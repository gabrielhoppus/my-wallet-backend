import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dayjs from "dayjs";
import dotenv from "dotenv";
import Joi from "joi";
import { stripHtml } from "string-strip-html";
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';

dotenv.config();
const date = dayjs().format("hh:mm:ss");
const app = express();
app.use(express.json());
app.use(cors());

const client = new MongoClient(process.env.DATABASE_URL);
let db;

client.connect()
    .then(() => {
        db = client.db();
        console.log("Sucesso");
    })
    .catch((err) => {
        console.log(err);
    });

app.post("/sign-up", async (req, res) => {
    let { name, email, password, confirmation } = req.body;
    let emailCheck;

    const userSChema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().required(),
        password: Joi.string().required(),
        confirmation: Joi.string().valid(Joi.ref("password")).required()
    })

    const userValidation = userSChema.validate({ name, email, password, confirmation }, { abortEarly: false })

    if (userValidation.error) {
        res.status(422).send(userValidation.error.details);
        return;
    }

    try {
        emailCheck = await db.collection("users").findOne({ email });
    } catch {
        console.log("Error checking email");
        emailCheck = false;
    }

    name = stripHtml(name).result.trim();
    email = stripHtml(email).result.trim();
    password = stripHtml(password).result.trim();
    const passwordHash = bcrypt.hashSync(password, 10);

    if (emailCheck) {
        res.status(409).send("Esse usuário já está cadastrad, tente novamente.");
        return;
    } else {
        try {
            const user = { name, email, password: passwordHash };
            await db.collection("users").insertOne(user);
            res.status(201).send("Usuário criado com sucesso!")
        } catch {
            console.log("Error adding users")
        }
    }
})

app.post("/sign-in", async (req, res) => {
    let { email, password } = req.body;

    const userSChema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required(),
    })

    const userValidation = userSChema.validate({ email, password }, { abortEarly: false })

    if (userValidation.error) {
        res.status(422).send(userValidation.error.details);
        return;
    }

    email = stripHtml(email).result.trim();
    password = stripHtml(password).result.trim();

    const user = await db.collection("users").findOne({ email });

    if (user && bcrypt.compareSync(password, user.password)) {
        const token = uuid();

        await db.collection("sessions").insertOne({
            userId: user._id, token
        })

        res.status(201).send(token)
    } else {
        res.status(404).send("Usuário não encontrado. Email ou senha incorretos")
    }
})

app.get("/transactions", async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    if (!token) return res.sendStatus(401);

    const session = await db.collection("sessions").findOne({ token });

    if (!session) {
        return res.sendStatus(401);
    }

    const user = await db.collection("users").findOne({
        _id: session.userId
    })

    if (user) {
        db.collection("transactions")
            .find()
            .toArray()
            .then(dados => { return res.send(dados) })
            .catch(() => { res.status(500).send("Erro!") });
    } else {
        res.sendStatus(401);
    }


})

app.post("/transactions", async (req, res) => {
    const { amount, description, type } = req.body
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    const transactionSchema = Joi.object({
        amount: Joi.number().required(),
        description: Joi.string().required(),
        type: Joi.string().valid("entry", "exit").required()
    })

    if (!token) return res.sendStatus(401);

    const session = await db.collection("sessions").findOne({ token });

    if (!session) {
        return res.sendStatus(401);
    }

    const user = await db.collection("users").findOne({
        _id: session.userId
    })

    const transactionValidation = transactionSchema.validate({ amount, description, type }, { abortEarly: false })

    if (transactionValidation.error) {
        res.status(422).send(userValidation.error.details);
        return;
    }

    if (user) {
        await db.collection("transactions").insertOne({
            amount,
            description,
            type
        })
    } else {
        res.sendStatus(401);
    }

})

app.delete("/sessions", async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    if (!token) return res.sendStatus(401);

    const session = await db.collection("sessions").findOne({ token });

    if (session) {
        await db.collection("sessions").deleteOne({ token });
    }else {
        return res.sendStatus(401);
    }
})











app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`)
})