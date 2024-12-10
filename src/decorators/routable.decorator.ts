import Router, { Request, Response } from "express";
import JWT from "jsonwebtoken";
import { JWTPayload } from "../models/jwtpayload.model";
import { swagger } from "../models/swagger/swagger.model";
import { swaggerMethod } from "../models/swagger/swaggermethod.model";
import { swaggerPath } from "../models/swagger/swaggerpath.model";
require("dotenv").config();

export const appRouter = Router();

export const swaggerDeff: swagger = {
    swagger: "2.0",
    info: {
        title: process.env.SWAG_PAGE_TITLE,
        description: process.env.SWAG_PAGE_DESC,
        version: process.env.SWAG_VERSION,
    },
    host: process.env.SWAG_HOST,
    basePath: process.env.SWAG_BASE_PATH,
    schemes: ["http", "https"],
    consumes: ["application/json"],
    produces: ["application/json"],
    paths: {},
    parameters: {
        page: {
            description: "Which page of results to return",
            type: "integer",
            in: "query",
            name: "page",
            minimum: 1,
            default: 1,
        },
        limit: {
            description: "How many results to return",
            type: "integer",
            in: "query",
            name: "limit",
            minimum: 1,
            maximum: 100,
            default: parseInt(process.env.DEFAULT_QUERY_LIMIT),
        },
    },
    responses: {
        "400": {
            description: "Not Found",
        },
        "420": {
            description: "Rate Limited",
        },
    },
};

interface IOptions {
    path: string;
    method: "get" | "post" | "put" | "delete" | "head";
    swagger?: swaggerMethod;
    auth?: boolean;
}

function routable(options: IOptions) {
    return (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) => {
        if (process.env.LOG_LEVEL === "INFO") {
            console.info(
                `Setting up endpoint ${options.method.toUpperCase()}  \t/api${
                    options.path
                }`
            );
        }

        const origFunc = descriptor.value;

        //Add swagger doc to the swagger object

        //change format of variable path components from ":foobar" to "{foobar}"
        let swaggerPath = options.path.replaceAll(/\:(\w+)/gi, "{$1}");
        let tags = [
            ...(target.constructor.swaggerTags ?? []),
            ...(options.swagger?.tags ?? []),
        ];
        if (options.swagger) {
            //use provided swagger information
            swaggerDeff.paths[swaggerPath] = {
                [options.method]: {
                    ...options.swagger,
                    tags,
                } as swaggerMethod,
            } as swaggerPath;
        } else {
            //tag the endpoint as undocumented if swagger info hasn't been defined
            swaggerDeff.paths[options.path] = {
                [options.method]: {
                    tags: [
                        "Undocumented",
                        ...(target.constructor.swaggerTags ?? []),
                    ],
                    type: "Unknown",
                } as swaggerMethod,
            } as swaggerPath;
        }

        descriptor.value = async function (...args: any) {
            let request = args[0] as Request;
            let response = args[1] as Response;
            let headers = request.headers;

            //Check JWT validity
            let jwt: JWTPayload = new JWTPayload({
                name: "",
                sub: "",
                perm: [],
                exp: new Date(),
            });

            if (options.auth) {
                if (!headers.authorization) {
                    response.status(403).send("Auth Header Required");
                    return;
                }

                //auth header is in format "Bearer $JWT"
                if (
                    headers.authorization
                        .split(" ")[0]
                        .trim()
                        .toLocaleLowerCase() !== "bearer"
                ) {
                    //auth header is malformed
                    response.status(400).send("Invalid auth header");
                    return;
                }

                let encodedJwt = headers.authorization.split(" ")[1];
                if (!JWT.verify(encodedJwt, process.env.JWT_SECRET || "", {})) {
                    //JWT is invalid, tampered or corrupt
                    response.status(403).send("Invalid Token");
                    return;
                }

                jwt = new JWTPayload(JWT.decode(encodedJwt));
            } else if (
                headers.authorization &&
                headers.authorization
                    .split(" ")[0]
                    .trim()
                    .toLocaleLowerCase() === "bearer"
            ) {
                jwt = new JWTPayload(
                    JWT.decode(headers.authorization.split(" ")[1])
                );
            }

            origFunc(request, response, jwt);

            if (process.env.LOG_LEVEL === "INFO")
                console.log(`${options.method} - ${request.url}`);
        };

        appRouter[options.method](`/api${options.path}`, descriptor.value);
        return descriptor;
    };
}

export default routable;
