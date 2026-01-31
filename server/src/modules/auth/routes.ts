import express from "express";
import { fn } from "./controllers";

const router = express.Router();

router.get("/testing", fn);

export default router;
