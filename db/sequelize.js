import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

// Had some issues with env vars not being read correctly, so added these logs for debugging
// console.log("DB_HOST:", JSON.stringify(process.env.DB_HOST));
// console.log("DB_PORT:", JSON.stringify(process.env.DB_PORT));

const sslEnabled = process.env.DB_SSL === "true";

function getCaPath() {
    // 1) Render secret file location
    const renderPath = "/etc/secrets/ca.pem";
    if (fs.existsSync(renderPath)) return renderPath;

    // 2) Local dev path
    const localPath = path.resolve("certs/ca.pem");
    if (fs.existsSync(localPath)) return localPath;

    return null;
}

const caPath = getCaPath();

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
                ssl: caPath
                    ? { ca: fs.readFileSync(caPath), rejectUnauthorized: true }
                    : { rejectUnauthorized: true },
            }
            : {},
    }
);

export default sequelize;
