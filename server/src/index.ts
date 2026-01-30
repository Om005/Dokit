import express, { Request, Response } from "express";
import env from "@config/env";

const app = express();

app.use(express.json());


app.get("/", (req: Request, res: Response) => {
    res.send("Hello from Express.");
});

const PORT = env.PORT;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
