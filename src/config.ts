import dotenv from "dotenv";
import { Config } from "./types";

dotenv.config();

const config: Config = {
  BOT_TOKEN: process.env.BOT_TOKEN || "YOUR_BOT_TOKEN_HERE",
  NODE_ENV: process.env.NODE_ENV || "development",
};

export default config;
