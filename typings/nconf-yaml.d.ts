
declare module "nconf-yaml" {
    import nconf from "nconf";
    const format: nconf.IFormat;
    export = format;
}
