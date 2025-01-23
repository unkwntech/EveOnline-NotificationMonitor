import { Request, Response } from "express";
import routable from "../decorators/routable.decorator";
import { JWTPayload } from "../models/jwtpayload.model";
import User from "../models/user.model";
import { DbUtilities as DB } from "../utilities/db-utilities";

export default class Virtual {
    //#region characters

    @routable({
        path: "/characters/:id",
        method: "get",
        auth: false,
    })
    public async getCharacter(req: Request, res: Response, jwt: JWTPayload) {
        DB.Query({ "characters.id": req.params.id }, User.getFactory())
            .then((qResult) => {
                res.status(200).send(qResult.flatMap((u) => u.characters));
            })
            .catch((e) => {
                console.error(e);
                res.sendStatus(500);
            });
    }

    @routable({
        path: "/characters/",
        method: "get",
        auth: true,
    })
    public async getCharacters(req: Request, res: Response, jwt: JWTPayload) {
        DB.Get(jwt.sub, User.getFactory())
            .then((result) => {
                res.status(200).send(result.characters);
            })
            .catch((e) => {
                console.error(e);
                res.sendStatus(500);
            });
    }

    //#endregion

    //#region corporations

    @routable({
        path: "/corporations/:id",
        method: "get",
        auth: false,
    })
    public async getCorporation(req: Request, res: Response, jwt: JWTPayload) {
        DB.Query(
            { "characters.corporation.id": req.params.id },
            User.getFactory()
        )
            .then((qResult) => {
                res.status(200).send(
                    qResult.flatMap((u) =>
                        u.characters.map((c) => c.corporation)
                    )
                );
            })
            .catch((e) => {
                console.error(e);
                res.sendStatus(500);
            });
    }

    @routable({
        path: "/corporations/",
        method: "get",
        auth: false,
    })
    public async getCorporations(req: Request, res: Response, jwt: JWTPayload) {
        DB.Query({}, User.getFactory())
            .then((qResult) => {
                res.status(200).send(
                    qResult.flatMap((u) =>
                        u.characters.map((c) => c.corporation)
                    )
                );
            })
            .catch((e) => {
                console.error(e);
                res.sendStatus(500);
            });
    }

    @routable({
        path: "/corporations/:id/characters",
        method: "get",
        auth: false,
    })
    public async getCharsFromCorp(
        req: Request,
        res: Response,
        jwt: JWTPayload
    ) {
        DB.Query(
            { "characters.corporation.id": req.params.id },
            User.getFactory()
        )
            .then((qResult) => {
                res.status(200).send(qResult.flatMap((u) => u.characters));
            })
            .catch((e) => {
                console.error(e);
                res.sendStatus(500);
            });
    }

    //#endregion

    //#region stats
    @routable({
        path: "/stats/corps",
        method: "get",
    })
    public async GetCorpStats(req: Request, res: Response, jwt: JWTPayload) {
        DB.Query({}, User.getFactory())
            .then((users) => {
                let chars = users.flatMap((u) => u.characters);
                let activeChars: { [key: string]: number } = {};
                let inactiveChars: { [key: string]: number } = {};
                for (let char of chars) {
                    if (!activeChars[char.corporation.name]) {
                        activeChars[char.corporation.name] = 0;
                        inactiveChars[char.corporation.name] = 0;
                    }
                    if (char.token.isActive)
                        activeChars[char.corporation.name]++;
                    else inactiveChars[char.corporation.name]++;
                }
                res.status(200).send({ activeChars, inactiveChars });
            })
            .catch((e) => {
                console.error(e);
                res.sendStatus(500);
            });
    }
    //#endregion
}
