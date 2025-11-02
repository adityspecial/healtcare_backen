const supabase = require("../config/supabase");

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Invalid token" });

  req.user = user;
  next();
};

const requireRole = (roles) => (req, res, next) => {
  const role = req.user.user_metadata?.role || req.user.app_metadata?.role;
  if (!role || !roles.includes(role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

module.exports = { authenticate, requireRole };
