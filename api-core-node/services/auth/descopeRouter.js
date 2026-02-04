import { Router } from "express";
import { oauthExchangeController } from "./controllers/auth.controller.js";
const descopeRouter = Router();
descopeRouter.get("/auth/callback", oauthExchangeController);
descopeRouter.get("/auth/verify", oauthExchangeController);

export default descopeRouter