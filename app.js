import express from "express";
import dotenv from "dotenv";

import sequelize from "./db/sequelize.js";
import { Admin } from "./models/index.js"; // viktig: relasjoner registreres også

import { basicAuth } from "./middleware/basicAuth.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => res.json({ message: "Census API is running" }));

app.get("/admin/test", basicAuth, (req, res) => {
    res.json({ message: "Admin access granted", admin: req.admin });
});

async function start() {
    try {
        await sequelize.authenticate();
        console.log("DB connection OK");

        // Midlertidig for å oppdatere tabeller uten migrasjoner
        await sequelize.sync({ alter: true });
        console.log("DB synced");

        // Seed admin iht. krav
        await Admin.findOrCreate({
            where: { login: "admin" },
            defaults: { password: "P4ssword" },
        });
        console.log("Admin seeded/exists");

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (err) {
        console.error("DB connection failed:");
        console.error(err);
        process.exit(1);
    }
}

start();
