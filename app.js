import express from "express";
import dotenv from "dotenv";

import { basicAuth } from "./middleware/basicAuth.js";
import sequelize from "./db/sequelize.js";
import Participant from "./models/Participant.js";
import participantsRouter from "./routes/participants.js";


dotenv.config();

if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    console.error("Missing ADMIN_USERNAME / ADMIN_PASSWORD in environment.");
    process.exit(1);
}

const app = express();
app.use(express.json());
app.use("/participants", basicAuth, participantsRouter);


app.get("/", (req, res) => {
    res.json({ message: "Census API is running" });
});

app.get("/admin/test", basicAuth, (req, res) => {
    res.json({
        message: "Admin access granted",
        admin: req.admin,
    });
});

async function start() {
    try {
        await sequelize.authenticate();
        console.log("DB connection OK");

        await sequelize.sync();
        console.log("DB synced");

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (err) {
        console.error("DB connection failed:", err.message);
        process.exit(1);
    }
}

start();
