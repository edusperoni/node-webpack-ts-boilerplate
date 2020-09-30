import cors from "cors";
import express from "express";
import RateLimit from "express-rate-limit";
import * as expressWinston from "express-winston";
import { Server } from "http";
import morgan from "morgan";
import { config } from "./config";
import { BaseController } from "./controllers/base.controller";
import { ExampleController } from "./controllers/example.controller";
import { logger } from "./winston";

export class App {
    public app: express.Application = express();
    public server?: Server;
    public controllers: BaseController[] = [new ExampleController()];
    constructor() {
        this.initializeMiddlewares();
        this.initializeControllers();
        this.initializePostMiddlewares();
    }

    public listen() {
        this.server = this.app.listen(config.get("server:port"), config.get("server:listen"), () => {
            // tslint:disable-next-line: no-console
            console.log(`App listening on port ${config.get("server:port")}`);
        });
        return this.server;
    }
    private initializeMiddlewares() {
        const trustProxy = config.get("server:trust-proxy");
        if (trustProxy) {
            if (trustProxy === true) {
                this.app.enable("trust proxy");
            } else {
                this.app.set("trust proxy", trustProxy);
            }
        }

        this.app.use(morgan("combined", {
            stream: {
                write: (message) => {
                    logger.log({
                        level: "info",
                        message,
                        morgan: true
                    });
                }
            }
        }));

        this.app.use(expressWinston.logger({
            level: "debug",
            winstonInstance: logger
        }));

        // RateLimiting and cors
        const rl = RateLimit({
            max: 30,
            windowMs: 10 * 1000
        });

        let corsHandler: express.RequestHandler | undefined;
        if (config.get("cors:enable")) {
            const isRegexStruct = (v: any): v is { regex: string } => {
                return Object(v) === v && v.regex;
            };
            const origins: Array<string | { regex: string }> | string | { regex: string } | boolean = config.get("cors:origin");
            const options: cors.CorsOptions = {};
            if (origins instanceof Array) {
                const whitelist = origins.map((v) => typeof v === "string" ? v : new RegExp(v.regex));
                options.origin = whitelist.length === 1 && whitelist[0] instanceof RegExp ? whitelist[0] : whitelist;
            } else if (isRegexStruct(origins)) {
                options.origin = new RegExp(origins.regex);
            } else {
                options.origin = origins;
            }
            corsHandler = cors(options);
        }

        this.app.use(rl);
        if (corsHandler) {
            this.app.use(corsHandler);
        }
    }

    private initializePostMiddlewares() {
        this.app.use(expressWinston.errorLogger({
            level: "error",
            winstonInstance: logger
        }));
    }

    private initializeControllers() {
        for (const controller of this.controllers) {
            this.app.use(config.get("server:prefix"), controller.router);
        }
    }
}
