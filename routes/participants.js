import express from "express";
import Participant from "../models/Participant.js";

const router = express.Router();

/**
 * POST /participants
 * Create participant
 */
router.post("/", async (req, res) => {
    try {
        const { firstName, lastName, email, phone, idNumber } = req.body;

        if (!firstName || !lastName) {
            return res.status(400).json({
                error: "Bad Request",
                message: "firstName and lastName are required.",
            });
        }

        const created = await Participant.create({
            firstName,
            lastName,
            email: email ?? null,
            phone: phone ?? null,
            idNumber: idNumber ?? null,
        });

        return res.status(201).json({
            message: "Participant created",
            participant: created,
        });
    } catch (err) {
        // Duplicate email (unique constraint) -> better message
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
 * Get one participant
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

        const { firstName, lastName, email, phone, idNumber } = req.body;

        // Update only provided fields
        if (firstName !== undefined) item.firstName = firstName;
        if (lastName !== undefined) item.lastName = lastName;
        if (email !== undefined) item.email = email;
        if (phone !== undefined) item.phone = phone;
        if (idNumber !== undefined) item.idNumber = idNumber;

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
 * Delete participant
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
