import express from "express";
import { Participant } from "../models/index.js";

const router = express.Router();

function isValidDateOnly(str) {
    // Expect "YYYY-MM-DD"
    if (typeof str !== "string") return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;

    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return false;

    // Ensure it doesn't auto-correct to another date (e.g. 2025-02-31)
    const [y, m, day] = str.split("-").map(Number);
    return (
        d.getUTCFullYear() === y &&
        d.getUTCMonth() + 1 === m &&
        d.getUTCDate() === day
    );
}

/**
 * POST /participants
 * Create participant
 * Required: email, firstName, lastName, dob (YYYY-MM-DD)
 */
router.post("/", async (req, res) => {
    try {
        const { email, firstName, lastName, dob } = req.body;

        if (!email || !firstName || !lastName || !dob) {
            return res.status(400).json({
                error: "Bad Request",
                message: "email, firstName, lastName and dob are required.",
            });
        }

        // Basic email format check (lightweight)
        if (typeof email !== "string" || !email.includes("@")) {
            return res.status(400).json({
                error: "Bad Request",
                message: "email must be a valid email address.",
            });
        }

        if (!isValidDateOnly(dob)) {
            return res.status(400).json({
                error: "Bad Request",
                message: "dob must be a valid date in format YYYY-MM-DD.",
            });
        }

        const created = await Participant.create({
            email: email.trim().toLowerCase(),
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            dob,
        });

        return res.status(201).json({
            message: "Participant created",
            participant: created,
        });
    } catch (err) {
        if (err?.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({
                error: "Conflict",
                message: "A participant with this email already exists.",
            });
        }

        console.error(err);
        return res.status(500).json({
            error: "Server Error",
            message: "Could not create participant.",
        });
    }
});

/**
 * GET /participants
 * List participants
 */
router.get("/", async (req, res) => {
    try {
        const items = await Participant.findAll({ order: [["id", "DESC"]] });

        return res.json({
            count: items.length,
            participants: items,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Server Error",
            message: "Could not fetch participants.",
        });
    }
});

/**
 * GET /participants/:id
 * Get one by numeric id
 */
router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
            return res.status(400).json({
                error: "Bad Request",
                message: "id must be a number.",
            });
        }

        const item = await Participant.findByPk(id);

        if (!item) {
            return res.status(404).json({
                error: "Not Found",
                message: "Participant not found.",
            });
        }

        return res.json({ participant: item });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Server Error",
            message: "Could not fetch participant.",
        });
    }
});

/**
 * PUT /participants/:id
 * Update participant
 * dob must stay valid YYYY-MM-DD if provided
 */
router.put("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
            return res.status(400).json({
                error: "Bad Request",
                message: "id must be a number.",
            });
        }

        const item = await Participant.findByPk(id);
        if (!item) {
            return res.status(404).json({
                error: "Not Found",
                message: "Participant not found.",
            });
        }

        const { email, firstName, lastName, dob } = req.body;

        if (email !== undefined) {
            if (typeof email !== "string" || !email.includes("@")) {
                return res.status(400).json({
                    error: "Bad Request",
                    message: "email must be a valid email address.",
                });
            }
            item.email = email.trim().toLowerCase();
        }

        if (firstName !== undefined) item.firstName = String(firstName).trim();
        if (lastName !== undefined) item.lastName = String(lastName).trim();

        if (dob !== undefined) {
            if (!isValidDateOnly(dob)) {
                return res.status(400).json({
                    error: "Bad Request",
                    message: "dob must be a valid date in format YYYY-MM-DD.",
                });
            }
            item.dob = dob;
        }

        await item.save();

        return res.json({
            message: "Participant updated",
            participant: item,
        });
    } catch (err) {
        if (err?.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({
                error: "Conflict",
                message: "A participant with this email already exists.",
            });
        }

        console.error(err);
        return res.status(500).json({
            error: "Server Error",
            message: "Could not update participant.",
        });
    }
});

/**
 * DELETE /participants/:id
 * Hard delete participant
 * (OK for participants unless your task says otherwise)
 */
router.delete("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
            return res.status(400).json({
                error: "Bad Request",
                message: "id must be a number.",
            });
        }

        const item = await Participant.findByPk(id);
        if (!item) {
            return res.status(404).json({
                error: "Not Found",
                message: "Participant not found.",
            });
        }

        await item.destroy();

        return res.json({
            message: "Participant deleted",
            id,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Server Error",
            message: "Could not delete participant.",
        });
    }
});

export default router;
