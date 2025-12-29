export function basicAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Basic ")) {
        return res.status(401).json({
            error: "Unauthorized",
            message: "Missing or invalid Authorization header (Basic Auth required).",
        });
    }

    // "Basic base64(username:password)"
    const base64Credentials = authHeader.split(" ")[1];
    const decoded = Buffer.from(base64Credentials, "base64").toString("utf8");

    const [username, password] = decoded.split(":");

    const validUser = process.env.ADMIN_USERNAME;
    const validPass = process.env.ADMIN_PASSWORD;

    if (username !== validUser || password !== validPass) {
        return res.status(401).json({
            error: "Unauthorized",
            message: "Invalid admin credentials.",
        });
    }

    // Optional: attach info
    req.admin = { username };

    next();
}
