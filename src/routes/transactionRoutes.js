import express from "express";
import { getHistory, makeTransaction } from "../controller/transactionController.js";
import { validateTransaction } from "../middleware/transactionMiddleware.js";
import { validateToken } from "../middleware/tokenMiddleware.js";

const transactionRouter = express.Router();

transactionRouter.get(
    "/transactions",
    validateToken,
    getHistory
)

transactionRouter.post(
    "/transactions",
    validateTransaction,
    validateToken,
    makeTransaction
)

export default transactionRouter;