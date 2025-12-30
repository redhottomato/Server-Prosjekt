import express from "express";
import dotenv from "dotenv";

import sequelize from "./db/sequelize.js";
import { Admin } from "./models/index.js";

import { basicAuth } from "./middleware/basicAuth.js";
import participantsRouter from "./routes/participants.js";

dotenv.config();

const app = express();
app.use(express.json());

// Optional: static info page (enable if you want a nice browser landing page)
app.use(express.static("public"));

// JSON health endpoint (useful for Postman / Render)
app.get("/status", (req, res) => {
    const auth = req.headers.authorization || "";
    res.json({
        status: "ok",
        authHeaderPresent: !!auth,
        authHeaderIsBasic: auth.startsWith("Basic "),
        uptimeSeconds: Math.floor(process.uptime()),
    });
});

// app.get("/", (req, res) => res.json({ message: "Census API is running" }));

app.get("/admin/test", basicAuth, (req, res) => {
    res.json({ message: "Admin access granted", admin: req.admin });
});

// Protected routes
app.use("/participants", basicAuth, participantsRouter);

async function start() {
    try {
        await sequelize.authenticate();
        console.log("DB connection OK");

        // ===== DEV ONLY schema auto-alter =====
        // Recommended: keep OFF in Render/production.
        // Enable locally only if needed:
        // await sequelize.sync({ alter: true });
        // console.log("DB synced (alter)");

        // Production-safe sync:
        await sequelize.sync();
        console.log("DB synced");

        // Seed admin as required by assignment
        await Admin.findOrCreate({
            where: { login: "admin" },
            defaults: { password: "P4ssword" },
        });
        console.log("Admin seeded/exists");

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (err) {
        console.error("Startup failed:");
        console.error(err);
        process.exit(1);
    }
}

start();
