import axios from "axios";
import User, { Character, Corporation, ESIToken } from "./models/user.model";
import { DbUtilities as DB } from "./utilities/db-utilities";

let users: User[] = [];
let characters: Character[] = [];
let corporations: Corporation[] = [];

const interestingNotifs = [
    "OrbitalAttacked", //poco / metenox?
    "OrbitalReinforced",
    "StructureUnderAttack", //citadel
    "StructureLostShields",
    "StructureLostArmor",
    "StructureNoReagentsAlert",
    "StructureFuelAlert",
    "StructureWentLowPower",
    "StructureDestroyed",
    "StructureServicesOffline",
    "StructureImpendingAbandonmentAssetsAtRisk",
    "TowerAlertMsg", //pos
    "TowerResourceAlertMsg",
    "CorpNewCEOMsg", //corp
];

async function main() {
    console.log(new Date());
    //fetch and setup data
    await DB.Query({}, User.getFactory()).then((usersr: User[]) => {
        users = usersr;

        //merge all characters into 1 array, if their tokens are active
        characters.push(
            ...users.flatMap((u) =>
                u.characters.filter((c) => c.token.isActive)
            )
        );

        //create a list of all corporations
        corporations = characters
            .map((c) => c.corporation)
            .filter((v, i, a) => a.findIndex((b) => b.id === v.id) === i);
    });

    for (let corp of corporations) {
        //filter to characters in corp
        const corpChars = characters.filter(
            (c) => c.corporation.name === corp.name
        );

        //sort by time since last used, oldest first
        corpChars.sort((a, b) =>
            a.token.lastUsed < b.token.lastUsed ? 1 : -1
        );

        console.log(`${corp.name} ${corpShouldUpdate(corpChars)}`);

        //todo alert if 0 chars in corp
        if (corpChars.length < 1 || !corpShouldUpdate(corpChars)) continue;

        const workingChar = corpChars[0];

        workingChar.token = await refreshAccessToken(workingChar.token);

        let notifs = (await fetchNotifications(workingChar).catch((e) => {
            if (!e.response) {
                console.error(`no response: ${e}`);
            } else {
                console.error(e.response);
            }
        })) || { status: 0, data: [], headers: { etag: "" } };

        if (notifs.status !== 200) continue;

        let user = users.find((u) =>
            u.characters.find((c) => c.id === workingChar.id)
        );
        if (user) {
            let ci = user.characters.findIndex((c) => c.id === workingChar.id);
            user.characters[ci].token.lastUsed = new Date();
            user.characters[ci].token.etag = notifs.headers.etag;
            await DB.Update(user, User.getFactory());
        }

        //send notif to api

        for (let notif of notifs.data as esi_notification[]) {
            if (interestingNotifs.includes(notif.type)) {
                submitNotification(notif, user?.id, workingChar.id).catch(
                    (e) => {
                        if (!e.response) {
                            console.error(`no response: ${e}`);
                        } else {
                            if (e.response.data === "document already exists")
                                return;
                            console.error(e.response);
                        }
                    }
                );
            }
        }
    }
}
main();

const submitNotification = (
    notification: esi_notification,
    userID?: string,
    characterID?: string
): Promise<any> =>
    axios.post(
        `https://notifs.ibns.tech:8005/api/notifications/`,
        { ...notification, userID, characterID },
        {
            headers: {
                Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiItMSIsIm5hbWUiOiJDUk9OVEFCIiwiaWF0IjoxNTE2MjM5MDIyfQ.yxUBEzSGyRcjovlHCXPQ7DLJrWAhg28BLGrFQ8gqNew`,
            },
        }
    );

const corpShouldUpdate = (chars: Character[]): boolean => {
    /*
        period = 5 * 60 / tokenCount
        shouldRun = now - timeSinceLastRun > period
    */
    const period = Math.floor(
        (parseInt(process.env.ESI_NOTIFICATION_CACHE_TIMER) / chars.length) *
            1000
    );
    return Date.now() - chars[0].token.lastUsed.getTime() > period;
};

const fetchNotifications = async (char: Character) => {
    let config: { [key: string]: any } = {
        headers: {
            Authorization: `Bearer ${char.token.accessToken}`,
        },
    };
    if (char.token.etag) {
        config.headers.etag = char.token.etag;
    }
    return axios.get(
        `https://esi.evetech.net/latest/characters/${char.id}/notifications/`,
        config
    );
};

interface esi_notification {
    notification_id: number;
    sender_id: number;
    sender_type: string;
    text: string;
    timestamp: string;
    type: string;
}

const refreshAccessToken = (token: ESIToken): Promise<ESIToken> =>
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
                ...token,
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
            } as ESIToken;
        });
