import express from "express";
import cors from "cors";
import authRouter from "./routes/authRoutes.js";
import transactionRouter from "./routes/transactionRoutes.js";

const app = express();
app.use(express.json());
app.use(cors());
app.use([authRouter, transactionRouter]);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});