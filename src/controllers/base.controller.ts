import express from "express";

export interface BaseController {
    router: express.Router;
}
