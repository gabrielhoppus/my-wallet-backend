import { stripHtml } from "string-strip-html";
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import db from "../config/database.js";

export async function signUp(req, res) {
    let { name, email, password, confirmation } = req.body;

    name = stripHtml(name).result.trim();
    email = stripHtml(email).result.trim();
    password = stripHtml(password).result.trim();
    const passwordHash = bcrypt.hashSync(password, 10);

    try {
        const emailCheck = await db
            .collection("users")
            .findOne({ email });
        if (emailCheck)
            return res.status(400).send("Esse usuário já está cadastrado, tente novamente.");
        const user = { name, email, password: passwordHash };
        await db.collection("users").insertOne(user);
        res.status(201).send("Usuário criado com sucesso!");
    } catch {
        res.status(500).send("Erro no banco de dados");
    }
}

export async function signIn(req, res) {
    let { email, password } = req.body;

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
}

export async function logOut(req, res) {
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
}