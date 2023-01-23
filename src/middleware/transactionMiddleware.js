import { transactionSchema } from "../model/transactionSchema.js";

export async function validateTransaction(req, res, next) {
    const transactionValidation = transactionSchema.validate(
        req.body,
        { abortEarly: false });

    if (transactionValidation.error) {
        res.status(422).send(transactionValidation.error.details);
        return;
    }
    next();
}