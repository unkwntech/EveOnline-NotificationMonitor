import routable from "@decorators/routable.decorator";
import { Request, Response } from "express";
import { JWTPayload } from "../models/jwtpayload.model";
import User from "../models/user.model";
import { DbUtilities as DB } from "../utilities/db-utilities";

export default class Users {
    @routable({
        path: "/users",
        method: "get",
    })
    public async GetUsers(
        req: Request,
        res: Response,
        jwt: JWTPayload
    ): Promise<void> {
        console.log(req.query);
        res.append("Access-Control-Expose-Headers", "*");
        let data = await DB.Query({}, User.getFactory());
        console.log(data);
        res.append("Content-Range", `*/${data.length}`);
        res.send(data);
    }

    @routable({
        path: "/users/:id",
        method: "get",
    })
    public async GetUser(
        req: Request,
        res: Response,
        jwt: JWTPayload
    ): Promise<void> {
        console.log(req.query);
        res.append("Access-Control-Expose-Headers", "*");
        let data = await DB.Get(req.params.id, User.getFactory());
        console.log(data);
        res.send(data);
    }
}
