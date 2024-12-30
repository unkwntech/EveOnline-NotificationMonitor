import axios from "axios";
import { Request, Response } from "express";
import * as yaml from "yaml";
import routable from "../decorators/routable.decorator";
import { ObjectNotFoundError } from "../errors";
import Interest from "../models/interests.model";
import { JWTPayload } from "../models/jwtpayload.model";
import Notification, {
    NotificationData,
    NotificationSender,
    NotificationSource,
} from "../models/notification.model";
import User from "../models/user.model";
import { DbUtilities as DB } from "../utilities/db-utilities";
import ESIUtilities from "../utilities/esi.utilities";

export default class NotificationsController {
    @routable({
        path: "/notifications/",
        method: "get",
        auth: true,
    })
    public async getNotifications(
        req: Request,
        res: Response,
        jwt: JWTPayload
    ) {
        DB.Query(
            { "notificationSource.userID": jwt.sub },
            Notification.getFactory()
        )
            .then((results) => {
                res.status(200).send(results);
            })
            .catch((e) => {
                res.sendStatus(500);
                console.error(e);
            });
    }

    @routable({
        path: "/notifications/",
        method: "post",
        auth: true,
    })
    public async createNotification(
        req: Request,
        res: Response,
        jwt: JWTPayload
    ) {
        try {
            const existing = await DB.Get(
                req.body.notification_id,
                Notification.getFactory()
            );
            if (existing) {
                res.status(400).send("document already exists");
                return;
            }
        } catch (e) {
            //supress ObjectNotFoundError
            if (!(e instanceof ObjectNotFoundError)) throw e;
        }

        const source = {
            userID: req.body.userID,
            characterID: req.body.characterID,
        } as NotificationSource;

        const newNotif = Notification.make(
            req.body.notification_id,
            {
                id: req.body.sender_id,
                type: req.body.sender_type,
            } as NotificationSender,
            req.body.type,
            source,
            req.body.timestamp,
            req.body.text
        );

        await DB.Insert(newNotif, Notification.getFactory());

        res.status(201).send(newNotif);

        await DB.Get(req.body.userID, User.getFactory()).then((user: User) => {
            const interest = user.interests.find(
                (i) => i.notificationType === newNotif.type
            );
            if (!interest) return;
            NotificationsController.sendNotification(
                newNotif,
                interest,
                source
            );
        });
    }

    @routable({
        path: "/notifications/:id/replay",
        method: "post",
        auth: true,
    })
    public async replayNotification(
        req: Request,
        res: Response,
        jwt: JWTPayload
    ) {
        const notif = await DB.Get(req.params.id, Notification.getFactory());
        const user = await DB.Get(
            notif.notificationSource.userID,
            User.getFactory()
        );
        const interest = user.interests.find(
            (i) => i.notificationType === notif.type
        );

        if (!interest) {
            res.sendStatus(500);
            throw new Error(
                `unable to find interest for notification id ${notif.id}`
            );
        }

        NotificationsController.sendNotification(
            notif,
            interest,
            notif.notificationSource
        );

        res.sendStatus(200);
    }

    public static async sendNotification(
        notif: Notification,
        interest: Interest,
        source: NotificationSource
    ) {
        const text = yaml.parse(notif.text);

        const user = await DB.Get(source.userID, User.getFactory());
        const token = user.characters.find(
            (c) => c.id === source.characterID
        )?.token;
        if (!token) {
            throw new Error(
                `Unable to locate token for character id ${source.characterID}`
            );
        }

        let data: NotificationData = {};

        switch (notif.type) {
            case "StructureUnderAttack":
            case "TowerAlertMsg":
                let char = await ESIUtilities.GetCharInfo(
                    text.charID ?? text.aggressorID
                );
                let corp = await ESIUtilities.GetCorpInfo(
                    char.data.corporation_id
                );
                let structureName = "";
                if (text.moonID) {
                    structureName = (
                        await ESIUtilities.GetMoonInfo(text.moonID)
                    ).data.name;
                } else {
                    structureName = (
                        await ESIUtilities.GetStructureInfo(
                            text.structureID.split(" ")[1],
                            token
                        )
                    ).data.name;
                }
                let solarSystem = await ESIUtilities.GetSystemInfo(
                    text.solarSystemID.toString()
                );

                let alli = {
                    data: {
                        name: "",
                    },
                };

                let owner = user.characters.find(
                    (c) => c.id === source.characterID
                )?.corporation;
                if (!owner) return;

                if (corp.data.alliance_id) {
                    alli = await ESIUtilities.GetAlliInfo(
                        corp.data.alliance_id
                    );
                }
                data = {
                    attacker: {
                        id: text.charID,
                        name: char.data.name,
                        corp: {
                            id: char.data.corporation_id,
                            name: corp.data.name,
                            alli: {
                                id: corp.data.alliance_id,
                                name: alli.data.name,
                            },
                        },
                    },
                    structure: {
                        id: text.structureID.split(" ")[1] ?? "",
                        name: structureName,
                        system: {
                            id: text.solarSystemID.toString(),
                            name: solarSystem.data.name,
                        },
                        typeID: text.typeID ?? text.structureTypeID,
                    },
                    owner: {
                        id: owner.id,
                        name: owner.name,
                    },
                };
                break;
        }

        axios.post(interest.targetWebhook, notif.toEmbed(data));
    }
}
