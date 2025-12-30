import express from "express";
import { Participant, Work, Home } from "../models/index.js";

const router = express.Router();

function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
    return typeof email === "string" && email.includes("@") && email.includes(".");
}

function isValidDateOnly(str) {
    // Expect "YYYY-MM-DD"
    if (typeof str !== "string") return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;

    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return false;

    const [y, m, day] = str.split("-").map(Number);
    return (
        d.getUTCFullYear() === y &&
        d.getUTCMonth() + 1 === m &&
        d.getUTCDate() === day
    );
}

function requireString(value, field, res) {
    if (typeof value !== "string" || value.trim() === "") {
        res.status(400).json({
            error: "Bad Request",
            message: `${field} is required and must be a non-empty string.`,
        });
        return false;
    }
    return true;
}

function requireNumber(value, field, res) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
        res.status(400).json({
            error: "Bad Request",
            message: `${field} is required and must be a number.`,
        });
        return null;
    }
    return n;
}

/*
 * Expected nested JSON structure:
 * {
 *   "participant": { email, firstname, lastname, dob },
 *   "work": { companyname, salary, currency },
 *   "home": { country, city }
 * }
 *
 * All properties must be provided in POST/PUT as per assignment.
*/

function validateNestedBody(body, res) {
    const participant = body?.participant;
    const work = body?.work;
    const home = body?.home;

    if (!participant || !work || !home) {
        res.status(400).json({
            error: "Bad Request",
            message:
                "Body must include participant, work and home objects in a single top-level JSON object.",
        });
        return null;
    }

    const email = normalizeEmail(participant.email);
    const firstname = participant.firstname;
    const lastname = participant.lastname;
    const dob = participant.dob;

    if (!requireString(email, "participant.email", res)) return null;
    if (!isValidEmail(email)) {
        res.status(400).json({
            error: "Bad Request",
            message: "participant.email must be a valid email address.",
        });
        return null;
    }
    if (!requireString(firstname, "participant.firstname", res)) return null;
    if (!requireString(lastname, "participant.lastname", res)) return null;

    if (!requireString(dob, "participant.dob", res)) return null;
    if (!isValidDateOnly(dob)) {
        res.status(400).json({
            error: "Bad Request",
            message: "participant.dob must be a valid date in format YYYY-MM-DD.",
        });
        return null;
    }

    if (!requireString(work.companyname, "work.companyname", res)) return null;
    const salary = requireNumber(work.salary, "work.salary", res);
    if (salary === null) return null;
    if (!requireString(work.currency, "work.currency", res)) return null;

    if (!requireString(home.country, "home.country", res)) return null;
    if (!requireString(home.city, "home.city", res)) return null;

    return {
        email,
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        dob,
        work: {
            companyname: work.companyname.trim(),
            salary,
            currency: String(work.currency).trim(),
        },
        home: {
            country: home.country.trim(),
            city: home.city.trim(),
        },
    };
}

/**
 * POST /participants/add
 * Creates participant + work + home from nested JSON body.
 */
router.post("/add", async (req, res) => {
    try {
        const validated = validateNestedBody(req.body, res);
        if (!validated) return;

        const created = await Participant.create({
            email: validated.email,
            firstName: validated.firstname,
            lastName: validated.lastname,
            dob: validated.dob,
        });

        // Upsert work/home (1-1 via participantEmail unique)
        await Work.upsert({
            participantEmail: validated.email,
            companyname: validated.work.companyname,
            salary: validated.work.salary,
            currency: validated.work.currency,
            isDeleted: false,
        });

        await Home.upsert({
            participantEmail: validated.email,
            country: validated.home.country,
            city: validated.home.city,
            isDeleted: false,
        });

        return res.status(201).json({
            message: "Participant created",
            participant: {
                email: created.email,
                firstname: created.firstName,
                lastname: created.lastName,
                dob: created.dob,
            },
            work: {
                companyname: validated.work.companyname,
                salary: validated.work.salary,
                currency: validated.work.currency,
            },
            home: {
                country: validated.home.country,
                city: validated.home.city,
            },
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
 * Returns all participants (full rows as stored)
 */
router.get("/", async (req, res) => {
    try {
        const items = await Participant.findAll({ order: [["id", "DESC"]] });
        return res.json({ count: items.length, participants: items });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Server Error",
            message: "Could not fetch participants.",
        });
    }
});

/**
 * GET /participants/details
 * Returns personal details of all participants: firstname, lastname, email
 */
router.get("/details", async (req, res) => {
    try {
        const items = await Participant.findAll({
            attributes: ["email", "firstName", "lastName"],
            order: [["id", "DESC"]],
        });

        return res.json({
            count: items.length,
            participants: items.map((p) => ({
                email: p.email,
                firstname: p.firstName,
                lastname: p.lastName,
            })),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Server Error",
            message: "Could not fetch participant details.",
        });
    }
});

/**
 * GET /participants/details/:email
 * Returns personal details for one participant: firstname, lastname, dob (+ email)
 */
router.get("/details/:email", async (req, res) => {
    try {
        const email = normalizeEmail(req.params.email);
        if (!isValidEmail(email)) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Invalid email format.",
            });
        }

        const p = await Participant.findOne({ where: { email } });
        if (!p) {
            return res.status(404).json({
                error: "Not Found",
                message: "Participant not found.",
            });
        }

        return res.json({
            participant: {
                email: p.email,
                firstname: p.firstName,
                lastname: p.lastName,
                dob: p.dob,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Server Error",
            message: "Could not fetch participant.",
        });
    }
});

/*
 * GET /participants/work/:email
 * Returns work details for participant where isDeleted=false
*/

router.get("/work/:email", async (req, res) => {
    try {
        const email = normalizeEmail(req.params.email);
        if (!isValidEmail(email)) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Invalid email format.",
            });
        }

        // Ensure participant exists
        const p = await Participant.findOne({ where: { email } });
        if (!p) {
            return res.status(404).json({
                error: "Not Found",
                message: "Participant not found.",
            });
        }

        const w = await Work.findOne({
            where: { participantEmail: email, isDeleted: false },
            attributes: ["companyname", "salary", "currency"],
        });

        if (!w) {
            return res.status(404).json({
                error: "Not Found",
                message: "Work details not found (or deleted).",
            });
        }

        return res.json({
            work: {
                companyname: w.companyname,
                salary: Number(w.salary),
                currency: w.currency,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Server Error",
            message: "Could not fetch work details.",
        });
    }
});

/**
 * GET /participants/home/:email
 * Returns home details for participant where isDeleted=false
 */
router.get("/home/:email", async (req, res) => {
    try {
        const email = normalizeEmail(req.params.email);
        if (!isValidEmail(email)) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Invalid email format.",
            });
        }

        const p = await Participant.findOne({ where: { email } });
        if (!p) {
            return res.status(404).json({
                error: "Not Found",
                message: "Participant not found.",
            });
        }

        const h = await Home.findOne({
            where: { participantEmail: email, isDeleted: false },
            attributes: ["country", "city"],
        });

        if (!h) {
            return res.status(404).json({
                error: "Not Found",
                message: "Home details not found (or deleted).",
            });
        }

        return res.json({
            home: {
                country: h.country,
                city: h.city,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Server Error",
            message: "Could not fetch home details.",
        });
    }
});

/*
 * PUT /participants/:email
 * Updates participant + work + home.
 * Must have exact same nested JSON body format as POST /participants/add.
*/
router.put("/:email", async (req, res) => {
    try {
        const emailParam = normalizeEmail(req.params.email);
        if (!isValidEmail(emailParam)) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Invalid email format in URL.",
            });
        }

        const validated = validateNestedBody(req.body, res);
        if (!validated) return;

        // Enforce that URL email matches body email (prevents confusion)
        if (validated.email !== emailParam) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Email in URL must match participant.email in body.",
            });
        }

        const p = await Participant.findOne({ where: { email: emailParam } });
        if (!p) {
            return res.status(404).json({
                error: "Not Found",
                message: "Participant not found.",
            });
        }

        // Update participant
        p.firstName = validated.firstname;
        p.lastName = validated.lastname;
        p.dob = validated.dob;
        await p.save();

        // Upsert work/home back to not deleted
        await Work.upsert({
            participantEmail: emailParam,
            companyname: validated.work.companyname,
            salary: validated.work.salary,
            currency: validated.work.currency,
            isDeleted: false,
        });

        await Home.upsert({
            participantEmail: emailParam,
            country: validated.home.country,
            city: validated.home.city,
            isDeleted: false,
        });

        return res.json({
            message: "Participant updated",
            participant: {
                email: p.email,
                firstname: p.firstName,
                lastname: p.lastName,
                dob: p.dob,
            },
            work: validated.work,
            home: validated.home,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Server Error",
            message: "Could not update participant.",
        });
    }
});

/**
 * DELETE /participants/:email
 * Deletes participant by email from DB.
 * (We also soft-delete work/home to respect isDeleted design.)
 */
router.delete("/:email", async (req, res) => {
    try {
        const email = normalizeEmail(req.params.email);
        if (!isValidEmail(email)) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Invalid email format.",
            });
        }

        const p = await Participant.findOne({ where: { email } });
        if (!p) {
            return res.status(404).json({
                error: "Not Found",
                message: "Participant not found.",
            });
        }

        // Soft delete work/home (optional but aligns with isDeleted requirement)
        await Work.update({ isDeleted: true }, { where: { participantEmail: email } });
        await Home.update({ isDeleted: true }, { where: { participantEmail: email } });

        // Delete participant
        await p.destroy();

        return res.json({
            message: "Participant deleted",
            email,
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
