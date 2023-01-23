import db from "../config/database.js";

export async function validateToken (req, res, next){
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    if (!token) return res.status(401).send("Credenciais de autentição inválidas");

    const session = await db.collection("sessions").findOne({ token });

    if (!session) {
        return res.status(401).send("Credenciais de autentição inválidas");
    }

    const user = await db.collection("users").findOne({
        _id: session.userId
    });

    if (user) {
        delete user.password;
        res.locals.user = user;
        res.locals.session = session;
    } else {
        res.sendStatus(401);
    }
    next();
}