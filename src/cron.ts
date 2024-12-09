// import axios from "axios";
// import { ObjectNotFoundError } from "./errors";
// import Notification from "./models/notification.model";
// import User from "./models/user.model";
// import { DbUtilities as DB } from "./utilities/db-utilities";
// require("dotenv").config();

// async function main() {
//     //new Date(new Date().getTime() - 5 * 60 * 1000)
//     let users = await DB.Query(
//         {
//             deleted: false,
//         },
//         User.getFactory(),
//         {},
//         { "tokens.lastPull": -1 },
//         1
//     );

//     for (let user of users) {
//         await fetchNotifications(
//             user.id,
//             user.tokens.sort((a, b) =>
//                 a.lastPull.getTime() > b.lastPull.getTime() ? 1 : -1
//             )[0].characterID
//         );
//     }

//     setTimeout(main, 60000);
// }
// main();

// //get list of
// async function fetchNotifications(userID: string, characterID: string) {
//     const user = await DB.Get(userID, User.getFactory());
//     const token = user.tokens.find((t) => t.characterID === characterID);
//     const interests = user.interests.map((i) => i.notificationType);

//     const embeds: { [key: string]: {}[] } = {};

//     if (!token) throw new Error("INVALID CHARACTERID PROVIDED");

//     return axios
//         .get(
//             `https://esi.evetech.net/latest/characters/${characterID}/notifications/`,
//             {
//                 headers: {
//                     Authorization: `Bearer ${token.accessToken}`,
//                 },
//             }
//         )
//         .then(async (res) => {
//             let data: Notification[] = await res.data
//                 .filter((n: any) => interests.includes(n.type))
//                 .map((n: any) =>
//                     Notification.make(
//                         n.notification_id,
//                         { id: n.sender_id, type: n.sender_type },
//                         n.type,
//                         { userID, characterID },
//                         n.timestamp,
//                         n.text,
//                         n.is_read
//                     )
//                 );

//             for (let notif of data) {
//                 //skip notifications that we aren't interested in
//                 let interest = user.interests.find(
//                     (i) => i.notificationType === notif.type
//                 );
//                 if (!interest) continue;

//                 //has notification already been seen?
//                 try {
//                     let search = await DB.Get(
//                         notif.id,
//                         Notification.getFactory()
//                     );
//                     if (search) {
//                         continue;
//                     }
//                 } catch (e) {
//                     if (!(e instanceof ObjectNotFoundError)) {
//                         throw e;
//                     }
//                 }
//                 DB.Insert(notif, Notification.getFactory());
//                 const tokeni = user.tokens.findIndex(
//                     (t) => t.characterID === characterID
//                 );
//                 user.tokens[tokeni].etag = res.headers["etag"] ?? "";
//                 user.tokens[tokeni].lastPull = new Date();
//                 await DB.Update(user, User.getFactory());

//                 //format notification
//                 if (embeds[interest.targetWebhook] === undefined) {
//                     embeds[interest.targetWebhook] = [];
//                 }

//                 const notifLines = notif.text.split("\n");
//                 const structureID = notifLines
//                     .filter((e: string) => e.startsWith("structureID"))[0]
//                     .split(" ")[2];
//                 const structureTypeID = notifLines
//                     .filter((e: string) => e.startsWith("structureTypeID"))[0]
//                     .split(" ")[1];
//                 const attackingAlliance = notifLines
//                     .filter((e: string) => e.startsWith("allianceName"))[0]
//                     .replaceAll("allianceName: ", "");
//                 const attackingCorp = notifLines
//                     .filter((e: string) => e.startsWith("corpName"))[0]
//                     .replaceAll("corpName: ", "");

//                 await axios
//                     .get(
//                         `https://esi.evetech.net/latest/universe/structures/${structureID}/`,
//                         {
//                             headers: {
//                                 Authorization: `Bearer ${token.accessToken}`,
//                             },
//                         }
//                     )
//                     .then((structureDetails) => {
//                         const structureName = structureDetails.data.name;

//                         embeds[interest?.targetWebhook ?? ""].push({
//                             title: notif.type,
//                             color: "15409955",
//                             image: {
//                                 url: `https://images.evetech.net/types/${structureTypeID}/render?size=128`,
//                             },
//                             // author: {
//                             //     name: "Infrastructure Team Secretary",
//                             // },
//                             fields: [
//                                 {
//                                     name: "Attacker Alliance",
//                                     value: attackingAlliance,
//                                     inline: true,
//                                 },
//                                 {
//                                     name: "Attacker Corp",
//                                     value: attackingCorp,
//                                     inline: true,
//                                 },
//                             ],
//                             description: structureName,
//                             timestamp: notif.timestamp.toISOString(),
//                         });
//                     })
//                     .catch((e) => {
//                         console.log(e);
//                         debugger;
//                     });
//             }

//             for (let embed of Object.entries(embeds)) {
//                 for (let i = 0; embed[1].length > 0; i++) {
//                     let count = embed[1].length;

//                     if (embed[1].length >= 10) count = 10;
//                     axios
//                         .post(`${embed[0]}?wait=true`, {
//                             name: "Infrastructure Team Secretary",
//                             content: "@everyone",
//                             embeds: embed[1].splice(0, count),
//                         })
//                         .then((res) => {
//                             // notif.notificationSent = new Date();
//                             // DB.Upsert(notif, Notification.getFactory());
//                         })
//                         .catch((e) => {
//                             console.log(e);
//                             debugger;
//                         });
//                 }
//             }

//             return res.data;
//         })
//         .catch((e) => {
//             if (e.response.status === 403) {
//                 //attempt refresh
//                 axios
//                     .post(
//                         "https://login.eveonline.com/v2/oauth/token",
//                         `grant_type=refresh_token&refresh_token=${token.refreshToken}`,
//                         {
//                             headers: {
//                                 Authorization:
//                                     "Basic ZTYwZjMyN2RiOWM3NGU0OTllMjY4N2FhOGQ1MTcxOTE6d3Q4WjVHa09PUUdpaHoxeHRycGQ4YU5MblVKSkY5UHk2OU1yQ1ZmSg==",
//                                 "Content-Type":
//                                     "application/x-www-form-urlencoded",
//                             },
//                         }
//                     )
//                     .then(async (tokenres) => {
//                         //store new access token
//                         const tokeni = user.tokens.findIndex(
//                             (t) => t.characterID === characterID
//                         );
//                         user.tokens[tokeni].accessToken =
//                             tokenres.data.access_token;

//                         await DB.Update(user, User.getFactory());
//                         fetchNotifications(userID, characterID);
//                         // queue.add("notification-refresh", {
//                         //     userID,
//                         //     characterID,
//                         // }, {
//                         //     repeat
//                         // });
//                     })
//                     .catch(async (e) => {
//                         console.log("token refresh");
//                         const tokeni = user.tokens.findIndex(
//                             (t) => t.characterID === characterID
//                         );

//                         user.tokens[tokeni].isActive = false;
//                         await DB.Update(user, User.getFactory());
//                     });
//             } else {
//                 console.error("token refresh failed", e);
//             }
//             //if 403(?) refresh token & requeue
//         });
// }
