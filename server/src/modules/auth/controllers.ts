import type { Request, Response } from "express";

export const fn = (req: Request, res: Response) => {
    throw new Error("Function not implemented.");
}