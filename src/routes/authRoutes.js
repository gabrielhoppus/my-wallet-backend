import { signUp, signIn, logOut } from "../controller/authControllers.js";
import { validateUser, validateSignin } from "../middleware/authMiddleware.js";
import { validateToken } from "../middleware/tokenMiddleware.js";
import express from "express";

const authRouter = express.Router();

authRouter.post("/users", signUp);
authRouter.post("/sessions", validateSignin, signIn);
authRouter.delete("/sessions", validateToken, logOut);

export default authRouter;