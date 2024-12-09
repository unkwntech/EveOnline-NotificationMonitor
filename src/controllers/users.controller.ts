import { Request, Response } from "express";
import routable from "../decorators/routable.decorator";
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
        res.append("Access-Control-Expose-Headers", "*");
        let data = await DB.Query({}, User.getFactory());
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
        res.append("Access-Control-Expose-Headers", "*");
        let data = await DB.Get(req.params.id, User.getFactory());
        res.send(data);
    }
}
