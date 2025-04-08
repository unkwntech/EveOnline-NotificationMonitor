import axios from "axios";
import clc from "cli-color";
import JWT from "jsonwebtoken";
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

async function init() {
    await DB.Query({}, User.getFactory()).then((result: User[]) => {
        users = result;

        //merge all characters into 1 array, if their tokens are active
        characters.push(
            ...users.flatMap((u) =>
                u.characters.filter((c) => {
                    return c.token.isActive;
                })
            )
        );

        //create a list of all corporations
        corporations = characters
            .map((c) => c.corporation)
            .filter((v, i, a) => a.findIndex((b) => b.id === v.id) === i);
    });
}

async function main() {
    console.log(clc.green(new Date()));
    //fetch and setup data
    await init();

    for (let corp of corporations) {
        //filter to characters in corp
        const corpChars = characters.filter(
            (c) => c.corporation.name === corp.name
        );

        //todo alert if 0 chars in corp
        if (corpChars.length < 1) continue;

        //sort by time since last used, oldest first
        corpChars.sort((a, b) =>
            a.token.lastUsed < b.token.lastUsed ? -1 : 1
        );

        if (corpShouldUpdate(corpChars)) {
            console.log(
                clc.green(
                    `\tFetching notifications for ${corp.name} with ${corpChars[0].name}`
                )
            );
        } else {
            console.log(
                clc.yellow(`\tSkipping notifications for ${corp.name}`)
            );
            continue;
        }

        const workingChar = corpChars[0];

        workingChar.token = await refreshAccessToken(workingChar.token).catch(
            (e) => markCharAsInactive(e, workingChar, e.response)
        );

        if (
            workingChar.token === null ||
            workingChar.token === undefined ||
            !workingChar.token.isActive
        )
            continue;

        await fetchNotifications(workingChar)
            .then(async (notifs) => {
                console.log(clc.bgRedBright("\t\tPARSING NOTIFS"));
                if (notifs.status !== 200) {
                    console.log(
                        clc.red(
                            `\t\t${notifs.status} on fetch for ${workingChar.name}`
                        )
                    );
                } else {
                    console.log(
                        clc.green(
                            `\t\tgot notifications for ${workingChar.name}`
                        )
                    );
                }

                let user = users.find((u) =>
                    u.characters.find((c) => c.id === workingChar.id)
                );

                if (!user) {
                    console.error(`FAILED TO FIND USER ${workingChar.name}`);
                    return;
                }

                await storeNewTokens(user, workingChar, notifs.headers.etag);

                if (!notifs.headers.etag)
                    console.error(
                        clc.red(`NOT ETAG ON RESPONSE FOR ${workingChar.name}`)
                    );

                for (let notif of notifs.data as esi_notification[]) {
                    if (!interestingNotifs.includes(notif.type)) continue;

                    submitNotification(notif, user.id, workingChar.id).catch(
                        (e) => {
                            if (!e.response) {
                                console.error(`no response: ${e}`);
                            } else {
                                if (
                                    e.response.data ===
                                    "document already exists"
                                )
                                    return;
                                console.error(e.response);
                            }
                        }
                    );
                }
            })
            .catch((e) => {
                if (!e.response) {
                    console.error(`no response: ${e}`);
                } else {
                    console.error(e.response);
                }
            });
    }
    console.log("done");
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
                Authorization: `Bearer ${JWT.sign(
                    {
                        sub: "-1",
                        name: "CRONTAB",
                    },
                    process.env.JWT_SECRET
                )}`,
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

const refreshAccessToken = async (token: ESIToken): Promise<any> => {
    return axios
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
            console.log(`\t\trefresh token result ${result.status}`);
            const data = result.data;
            if (data === null) throw new Error("Invalid token respose");
            return {
                ...token,
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
            } as ESIToken;
        });
};

const markCharAsInactive = async (
    e: Error,
    char: Character,
    details: any = {}
) => {
    if (details.status === 400 && details.data.error === "invalid_grant") {
        //refresh token is expired
        let user = users.find((u) =>
            u.characters.find((c) => c.id === char.id)
        );
        if (!user) {
            console.error(`FAILED TO FIND USER ${char.name}`);
            return;
        }
        let ci = user.characters.findIndex((c) => c.id === char.id);
        user.characters[ci].token.isActive = false;

        char.token.isActive = false;

        await DB.Update(user, User.getFactory());
    } else {
        console.error(e);
    }
};

interface esi_notification {
    notification_id: number;
    sender_id: number;
    sender_type: string;
    text: string;
    timestamp: string;
    type: string;
}

const storeNewTokens = async (
    user: User,
    workingChar: Character,
    etag?: string
) => {
    let ci = user.characters.findIndex((c) => c.id === workingChar.id);
    user.characters[ci].token.lastUsed = new Date();
    user.characters[ci].token.isActive = true;
    user.characters[ci].token.refreshToken = workingChar.token.refreshToken;

    if (etag !== undefined) user.characters[ci].token.etag = etag;
    else user.characters[ci].token.etag = undefined;

    await DB.Update(user, User.getFactory());
};
