import axios from "axios";
import { Request, Response } from "express";
import * as yaml from "yaml";
import routable from "../decorators/routable.decorator";
import Interest from "../models/interests.model";
import { JWTPayload } from "../models/jwtpayload.model";
import Notification, {
    NotificationSender,
    NotificationSource,
} from "../models/notification.model";
import User from "../models/user.model";
import { DbUtilities as DB } from "../utilities/db-utilities";

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
        auth: false,
    })
    public async createNotification(
        req: Request,
        res: Response,
        jwt: JWTPayload
    ) {
        const existing = await DB.Get(
            req.body.notification_id,
            Notification.getFactory()
        );
        if (existing) {
            res.status(400).send("document already exists");
            return;
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

        DB.Get(req.body.userID, User.getFactory()).then((user: User) => {
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

        const structure = await axios.get(
            `https://esi.evetech.net/latest/universe/structures/${text.structureID}/`,
            {
                headers: {
                    Authorization: `Bearer ${token.accessToken}`,
                },
            }
        );
        const char = await axios.get(
            `https://esi.evetech.net/latest/characters/${text.charID}/`
        );
        const owner = await axios.get(
            `https://esi.evetech.net/latest/corporations/${structure.data.owner_id}/`
        );

        console.log(
            notif.toEmbed({
                attackerName: char.data.name,
                structureName: structure.data.name,
                ownerName: owner.data.name,
                ownerID: structure.data.owner_id,
            })
        );

        axios.post(
            interest.targetWebhook,
            notif.toEmbed({
                attackerName: char.data.name,
                structureName: structure.data.name,
                ownerName: owner.data.name,
                ownerID: structure.data.owner_id,
            })
        );
    }
}
