import { signupSchema, signinSchema } from "../model/authSchema.js";

export async function validateUser(req, res, next){
    const userValidation = signupSchema.validate(
        req.body,
        { abortEarly: false });

    if (userValidation.error) {
        res.status(422).send(userValidation.error.details);
        return;
    }
    next();
}

export async function validateSignin(req, res, next){
    const signinValidation = signinSchema.validate(
        req.body,
        { abortEarly: false });

    if (signinValidation.error) {
        res.status(422).send(signinValidation.error.details);
        return;
    }
    next();
}