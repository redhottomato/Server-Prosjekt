import { Admin } from "../models/index.js";

export async function basicAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Basic ")) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "Missing or invalid Authorization header (Basic Auth required).",
            });
        }

        const base64Credentials = authHeader.split(" ")[1];
        const decoded = Buffer.from(base64Credentials, "base64").toString("utf8");
        const [login, password] = decoded.split(":");

        if (!login || !password) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "Invalid Basic Auth format.",
            });
        }

        const admin = await Admin.findOne({ where: { login } });

        if (!admin || admin.password !== password) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "Invalid admin credentials.",
            });
        }

        req.admin = { login: admin.login, id: admin.id };
        next();
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Server Error",
            message: "Authentication failed due to a server error.",
        });
    }
}
