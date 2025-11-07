const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  try {
    console.log("=== AUTHENTICATE MIDDLEWARE START ===");
    console.log("Headers:", req.headers);

    const authHeader = req.headers.authorization;
    console.log("Authorization header:", authHeader);

    if (!authHeader) {
      console.error("No authorization header");
      return res.status(401).json({ error: "Authorization header required" });
    }

    // Split "Bearer TOKEN"
    const parts = authHeader.split(" ");
    console.log("Auth header parts:", parts.length);

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      console.error("Invalid authorization format");
      return res
        .status(401)
        .json({ error: "Authorization format must be: Bearer [token]" });
    }

    const token = parts[1];
    console.log("Token extracted, length:", token.length);

    if (!token) {
      console.error("No token in authorization header");
      return res.status(401).json({ error: "Access token required" });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    console.log("Token verified successfully for user:", decoded.userId);

    // Attach user info to request
    req.user = decoded; // { userId, role, phone }

    console.log("=== AUTHENTICATE MIDDLEWARE SUCCESS ===");
    next();
  } catch (err) {
    console.error("=== AUTHENTICATE MIDDLEWARE ERROR ===");
    console.error("Authentication error:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ error: "Invalid token" });
    }

    return res.status(403).json({ error: err.message });
  }
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      console.log("=== REQUIRE ROLE MIDDLEWARE START ===");
      console.log("Required roles:", allowedRoles);
      console.log("User role:", req.user?.role);

      if (!req.user) {
        console.error("No user in request");
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!req.user.role) {
        console.error("No role in user");
        return res.status(403).json({ error: "Role not set" });
      }

      if (!allowedRoles.includes(req.user.role)) {
        console.error("Role not allowed:", req.user.role);
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      console.log("=== REQUIRE ROLE MIDDLEWARE SUCCESS ===");
      next();
    } catch (err) {
      console.error("=== REQUIRE ROLE MIDDLEWARE ERROR ===");
      console.error("Role check error:", err.message);
      return res.status(500).json({ error: "Role verification failed" });
    }
  };
};

module.exports = { authenticate, requireRole };
