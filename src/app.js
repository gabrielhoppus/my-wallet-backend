import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";
import dotenv from "dotenv";
import Joi from "joi";
import { stripHtml } from "string-strip-html";
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';

dotenv.config();
const date = dayjs().format("DD/MM");
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

app.get("/users", async (req, res) => {
    await db.collection("users")
        .find()
        .toArray()
        .then(data => { return res.send(data) })
        .catch(() => { res.status(500).send("Erro no banco de dados") });
});

app.post("/users", async (req, res) => {
    let { name, email, password, confirmation } = req.body;
    let emailCheck;

    const userSChema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().required(),
        password: Joi.string().required(),
        confirmation: Joi.string().valid(Joi.ref("password")).required()
    });

    const userValidation = userSChema.validate(
        {
            name,
            email,
            password,
            confirmation
        },
        { abortEarly: false });

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
        res.status(409).send("Esse usuário já está cadastrado, tente novamente.");
        return;
    } else {
        try {
            const user = { name, email, password: passwordHash };
            await db.collection("users").insertOne(user);
            res.status(201).send("Usuário criado com sucesso!");
        } catch {
            res.status(500).send("Erro no banco de dados");
        }
    }
})

app.post("/sessions", async (req, res) => {
    let { email, password } = req.body;

    const userSChema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required(),
    })

    const userValidation = userSChema.validate(
        {
            email,
            password
        },
        { abortEarly: false });

    if (userValidation.error) {
        res.status(422).send(userValidation.error.details);
        return;
    }

    email = stripHtml(email).result.trim();
    password = stripHtml(password).result.trim();

    const user = await db.collection("users").findOne({ email });
    const name = user.name;

    if (user && bcrypt.compareSync(password, user.password)) {
        const token = uuid();
        delete user.password;
        await db.collection("sessions").insertOne({
            userId: user._id, token
        });
        const body = { token, name };
        res.status(201).send(body);
    } else {
        res.status(404).send("Usuário não encontrado. Email ou senha incorretos");
    }
})

app.get("/transactions", async (req, res) => {
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
})

app.post("/transactions", async (req, res) => {
    const { amount, description, type } = req.body;
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    const transactionSchema = Joi.object({
        amount: Joi.string().replace(',', '.', true).regex(/^\d+(\.\d{1,2})?$/).required(),
        description: Joi.string().required(),
        type: Joi.string().valid("entry", "exit").required()
    });

    if (!token) return res.status(401).send("Credenciais de autentição inválidas");

    const session = await db.collection("sessions").findOne({ token });

    if (!session) {
        return res.status(401).send("Credenciais de autentição inválidas");
    }

    const user = await db.collection("users").findOne({
        _id: session.userId
    })


    const transactionValidation = transactionSchema.validate(
        { amount, description, type },
        { abortEarly: false });

    if (transactionValidation.error) {
        res.status(422).send(transactionValidation.error.details);
        return;
    }

    if (user) {
        let value = Number(amount);
        value = value.toFixed(2);
        delete user.password;
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

})


app.delete("/sessions", async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    if (!token) return res.status(401).send("Não autorizado");

    const session = await db.collection("sessions").findOne({ token });

    if (session) {
        await db.collection("sessions").deleteOne({ token });
        res.status(201).send("Deletado com sucesso!")
    } else {
        return res.status(404).send("Sessão não encontrada");
    }
})

app.get("/sessions", async (req, res) => {
    await db.collection("sessions")
        .find()
        .toArray()
        .then(data => { return res.send(data) })
        .catch(() => { res.status(500).send("Erro!") });
});


app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});