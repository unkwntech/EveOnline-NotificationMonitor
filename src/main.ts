import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import fs from "fs";
import https from "https";
import swaggerUI, { SwaggerOptions } from "swagger-ui-express";
import "./controllers/index";
import { appRouter, swaggerDeff } from "./decorators/routable.decorator";
require("dotenv").config();

const app = express();

//Setup express
//Increase maximum 'upload' limits to 50mb, should be overkill.
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));

//set cors policy to allow any source to access the api
const cors = require("cors");
app.use(
    cors({
        origin: "*",
    })
);

app.use(appRouter);

//Add swagger to express

const swaggerDefinition = {
    info: {
        title: process.env.SWAG_PAGE_TITLE,
        version: process.env.SWAG_VERSION,
        description: process.env.SWAG_PAGE_DESC,
    },
    host: process.env.SWAG_HOST,
    basePath: process.env.SWAG_BASE_PATH,
};

const options = {
    swaggerDefinition,
    swaggerOptions: {
        url: "/swagger.json",
    },
    explorer: false,
} as SwaggerOptions;

appRouter.use("/docs", swaggerUI.serve);
appRouter.use("/docs", swaggerUI.setup(swaggerDeff, options));

appRouter.get("/", (req: Request, res: Response) => [res.redirect("/docs")]);

app.get("/swagger.json", (req: Request, res: Response) =>
    res.status(200).send(JSON.stringify({ ...swaggerDeff, ...options }))
);

if (process.env.SSL_ENABLED === "true") {
    //Setup SSL
    https
        .createServer(
            {
                key: fs.readFileSync(process.env.SSL_PKEY),
                cert: fs.readFileSync(process.env.SSL_CERT),
            },
            app
        )
        .listen(process.env.BACKEND_PORT, () =>
            console.log(`listening on ${process.env.BACKEND_PORT}`)
        );
} else {
    app.listen(process.env.BACKEND_PORT, () =>
        console.log(`listening on ${process.env.BACKEND_PORT}`)
    );
}
//Any thrown error will return a 500.
app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

//Any missing page returns a 404 and logs
app.use((req, res, next) => {
    console.warn(`404 ${req.method} ${req.originalUrl}`);
    res.status(404).send("Sorry can't find that!");
});

//Catch and log any uncaught exception
process.on("uncaughtException", (e) => {
    console.error(e);
});
