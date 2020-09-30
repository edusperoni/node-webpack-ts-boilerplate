import nconf from "nconf";
import yamlFormat from "nconf-yaml";

nconf.argv().env();
const confFile = nconf.get("config");

nconf.file({
    file: confFile || "config.yml",
    format: yamlFormat
});

nconf.defaults({
    cors: {
        enable: true
    },
    loglevel: "debug",
    server: {
        listen: "::",
        port: 3000,
        prefix: "/"
    }
});

export const config = nconf;
