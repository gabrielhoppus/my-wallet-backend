import Joi from "joi";

export const transactionSchema = Joi.object({
    amount: Joi.string().replace(',', '.', true).regex(/^\d+(\.\d{1,2})?$/).required(),
    description: Joi.string().required(),
    type: Joi.string().valid("entry", "exit").required()
});