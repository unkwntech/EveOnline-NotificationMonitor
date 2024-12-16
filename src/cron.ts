import axios from "axios";
import User, { Character, ESIToken } from "./models/user.model";
import { DbUtilities as DB } from "./utilities/db-utilities";

//scheduling
/*

    period = 5 * 60 / tokenCount

    shouldRun = now - timeSinceLastRun > period

*/

DB.Query({}, User.getFactory()).then(async (users: User[]) => {
    const characters: Character[] = [];
    characters.push(...users.flatMap((u) => u.characters));

    for (let corp of characters.map((c) => c.corporation)) {
        const corpChars = characters.filter((c) => c.corporation === corp);
        //sort oldest to newest
        corpChars.sort((a, b) =>
            a.token.lastUsed < b.token.lastUsed ? -1 : 1
        );

        const period = (5 * 60) / corpChars.length;

        if (
            Date.now() -
                corpChars[corpChars.length - 1].token.lastUsed.getTime() <
            period
        ) {
            //not enough time has elapsed
            continue;
        }

        //sufficient time has elapsed, use oldest char

        //refresh access token
        corpChars[0].token =
            (await refreshAccessToken(corpChars[0].token)) ??
            corpChars[0].token;
        //todo: push token to db

        console.log(corpChars[0].name);

        //fetch notifications
        axios
            .get(
                `https://esi.evetech.net/latest/characters/${corpChars[0].id}/notifications/`,
                {
                    headers: {
                        Authorization: `Bearer: ${corpChars[0].token.accessToken}`,
                    },
                }
            )
            .then((results) => {
                //push notifications to api

                for (let notif of results.data as esi_notification[]) {
                    console.log(notif.type);
                    axios.post(
                        `https://ibns.tech:8005/api/notifications/`,
                        notif,
                        {
                            headers: {
                                Authorization: `Bearer ${corpChars[0].token.accessToken}`,
                            },
                        }
                    );
                }
            })
            .catch((e) => {
                // console.error(e.response);
                // process.exit();
            });
    }
});

interface esi_notification {
    notification_id: number;
    sender_id: number;
    sender_type: string;
    text: string;
    timestamp: string;
    type: string;
}

const refreshAccessToken = (token: ESIToken): Promise<ESIToken | void> =>
    axios
        .post(
            "https://login.eveonline.com/v2/oauth/token",
            `grant_type=refresh_token&refresh_token=${token.refreshToken}`,
            {
                headers: {
                    authorization: `Basic ${Buffer.from(
                        `${process.env.ESI_CLIENTID}:${process.env.ESI_SECRET}`
                    ).toString("base64")}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        )
        .then((result) => {
            const data = result.data;
            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                lastUsed: new Date(),
                etag: result.headers.etag ?? undefined,
                isActive: true,
            } as ESIToken;
        })
        .catch((e) => {
            // console.error(e.response);
            // process.exit();
        });
