import express from "express";
import { BaseController } from "./base.controller";

export class ExampleController implements BaseController {
    public router = express.Router();
    public path = "/example";

    constructor() {
        this.register();
    }

    public register() {
        this.router.get(this.path, this.example);
    }

    public example: express.RequestHandler = (req, res) => {
        res.send("Example");
    }
}
