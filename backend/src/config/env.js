import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const CLIENT_URL = process.env.CLIENT_URL || "*";
