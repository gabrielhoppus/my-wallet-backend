import dayjs from "dayjs";
import db from "../config/database.js"
const date = dayjs().format("DD/MM");

export async function getHistory(req, res) {
    const session = res.locals.session;
    const user = res.locals.user;
    const id = session.userId;

    if (user) {
        await db.collection("transactions")
            .find({
                "userId": { $in: [id] }
            })
            .toArray()
            .then(data => { return res.status(200).send(data) })
            .catch(() => { res.status(500).send("Erro ao executar requisição") });
    } else {
        res.status(401).send("Credenciais de autentição inválidas");
    }
}

export async function makeTransaction(req, res) {
    const { amount, description, type } = req.body;
    const user = res.locals.user;
    const session = res.locals.session;

    if (user) {
        let value = Number(amount);
        value = value.toFixed(2);
        await db.collection("transactions").insertOne({
            userId: session.userId,
            amount: value,
            description,
            type,
            date
        })
        res.status(201).send("Transação efetuada com sucesso!");
    } else {
        res.sendStatus(401);
    }

}