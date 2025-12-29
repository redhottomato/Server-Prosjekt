import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const sslEnabled = process.env.DB_SSL === "true";

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        dialect: "mysql",
        logging: false,
        dialectOptions: sslEnabled
            ? {
                ssl: {
                    ca: fs.readFileSync(path.resolve("certs/ca.pem")),
                    rejectUnauthorized: true,
                },
            }
            : {},
    }
);

export default sequelize;
