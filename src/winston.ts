import fs from "fs";
import path from "path";
import { MESSAGE } from "triple-beam";
import * as winston from "winston";
import { config } from "./config";

const morganFormat = winston.format((info, opts) => {
    if (!info.morgan) {
        return false;
    }
    info[MESSAGE as any] = `${info.message}`.trim();
    return info;
})();

const onlyExceptions = winston.format((info, opts) => {
    if (!info.meta || !info.meta.exception) {
        return false;
    }
    return info;
});

const filterMorgan = winston.format((info, opts) => {
    if (info.morgan) {
        return false;
    }
    return info;
})();

export let logger: winston.Logger;

function reopenTransportOnHupSignal(fileTransport: any /* winston.transports.FileTransportInstance */) {
    process.on("SIGHUP", () => {
        const fullname = path.join(fileTransport.dirname, fileTransport._getFile(false));

        function reopen() {
            if (fileTransport._stream) {
                fileTransport._stream.end();
                fileTransport._stream.destroySoon();
            }

            const stream = fs.createWriteStream(fullname, fileTransport.options);
            stream.setMaxListeners(Infinity);

            fileTransport._size = 0;
            fileTransport._stream = stream;

            fileTransport.once("flush", () => {
                fileTransport.opening = false;
                fileTransport.emit("open", fullname);
            });

            fileTransport.flush();
        }

        fs.stat(fullname, (err: any) => {
            if (err && err.code === "ENOENT") {
                return reopen();
            }
        });

    });
}

let uncaughtExceptionListener: (error: Error | null, ...args: any[]) => void;
let unhandledRejectionListener: (error: Error | null, ...args: any[]) => void;

export function initializeLogger() {
    if (logger) {
        logger.error("Logger already initialized!");
    }
    const accessFileName = config.get("server:accesslog");
    const logFile = config.get("logfile");
    const defaultTransport = logFile ?
        new winston.transports.File({
            filename: logFile,
            format: filterMorgan,
        }) :
        new winston.transports.Console({
            format: filterMorgan
        });
    if (logFile) {
        reopenTransportOnHupSignal(defaultTransport);
    }
    logger = winston.createLogger({
        defaultMeta: { service: "node-webpack-ts-boilerplate" },
        format: winston.format.combine(winston.format.splat(), winston.format.json()),
        level: config.get("loglevel"),
        transports: [
            defaultTransport
        ]
    });
    if (accessFileName) {
        const morganTransport = new winston.transports.File({
            filename: accessFileName,
            format: morganFormat,
            level: "debug"
        });
        reopenTransportOnHupSignal(morganTransport);
        logger.add(morganTransport);
    }

    uncaughtExceptionListener = (err) => {
        logger.error("uncaughtException", err);
    };
    process.on("uncaughtException", uncaughtExceptionListener);

    unhandledRejectionListener = (err) => {
        logger.error("unhandledRejection", err);
    };
    (process as any).on("unhandledRejection", unhandledRejectionListener);
}

initializeLogger();

export function disposeLogger() {
    // logger.close();
    // (logger as any) = undefined;
    // process.off("uncaughtException", uncaughtExceptionListener);
    // (process as any).off("unhandledRejection", unhandledRejectionListener);
}
