const authService = require("../services/authService");

const sendOtp = async (req, res) => {
  try {
    const { phone, full_name } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone required" });
    }

    console.log("=== SEND OTP CONTROLLER START ===");
    console.log("Send OTP request for:", phone);

    const result = await authService.sendOtp(phone, full_name);

    console.log("=== SEND OTP CONTROLLER END ===");
    res.json(result);
  } catch (e) {
    console.error("=== SEND OTP CONTROLLER ERROR ===");
    console.error("Send OTP controller error:", e.message);
    res.status(500).json({ error: e.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { phone, token } = req.body;

    if (!phone || !token) {
      return res.status(400).json({ error: "Phone and token are required" });
    }

    console.log("=== VERIFY OTP CONTROLLER START ===");
    console.log("Received phone:", phone);
    console.log("Received token:", token);

    // Call the service
    const result = await authService.verifyOtp(phone, token);

    console.log("=== SERVICE RETURNED ===");
    console.log("Has access_token:", !!result.access_token);
    console.log("Has refresh_token:", !!result.refresh_token);
    console.log("User ID:", result.user_id);
    console.log("Role:", result.role);
    console.log("Profile exists:", result.profile_exists);

    // Return the data EXACTLY as received from service
    res.json(result);
    console.log(result);
    console.log("=== RESPONSE SENT ===");
  } catch (e) {
    console.error("=== VERIFY OTP CONTROLLER ERROR ===");
    console.error("Error message:", e.message);
    console.error("Error stack:", e.stack);
    res.status(400).json({ error: e.message });
  }
};

const setRole = async (req, res) => {
  try {
    const { role } = req.body;

    // Get user ID from JWT token (set by authenticate middleware)
    const userId = req.user?.userId;

    if (!userId) {
      console.error("No userId in req.user:", req.user);
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!role) {
      return res.status(400).json({ error: "Role is required" });
    }

    console.log("=== SET ROLE CONTROLLER START ===");
    console.log("User ID from token:", userId);
    console.log("Setting role:", role);

    const profile = await authService.setRole(userId, role);

    console.log("Role set successfully:", profile);
    res.json({
      message: "Role updated successfully",
      profile,
    });
  } catch (e) {
    console.error("=== SET ROLE CONTROLLER ERROR ===");
    console.error("Error:", e.message);
    res.status(500).json({ error: e.message });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({ error: "Token required" });
    }

    console.log("=== LOGOUT CONTROLLER START ===");
    await authService.logout(token);
    console.log("=== LOGOUT CONTROLLER END ===");

    res.json({ message: "Logged out successfully" });
  } catch (e) {
    console.error("Logout controller error:", e);
    res.status(500).json({ error: e.message });
  }
};

const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: "Phone and password required" });
    }

    console.log("=== LOGIN CONTROLLER START ===");
    console.log("Login request for phone:", phone);

    const result = await authService.login(phone, password);

    res.json({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      user_id: result.user.user_id,
      phone: result.user.phone_number,
      role: result.user.role,
      profile_exists: result.user.full_name ? true : false,
    });
  } catch (e) {
    console.error("Login controller error:", e);
    res.status(401).json({ error: e.message });
  }
};

const completeProfile = async (req, res) => {
  try {
    // Get user ID from JWT token (set by authenticate middleware)
    const userId = req.user?.userId;

    if (!userId) {
      console.error("No userId in req.user:", req.user);
      return res.status(401).json({ error: "User not authenticated" });
    }

    const profileData = req.body;

    // Validate required fields
    if (!profileData.full_name) {
      return res.status(400).json({ error: "Full name is required" });
    }

    console.log("=== COMPLETE PROFILE CONTROLLER START ===");
    console.log("User ID from token:", userId);
    console.log("Profile data:", profileData);

    const profile = await authService.completeProfile(userId, profileData);

    console.log("Profile completed successfully:", profile);
    res.json({
      message: "Profile completed successfully",
      profile,
    });
  } catch (e) {
    console.error("=== COMPLETE PROFILE CONTROLLER ERROR ===");
    console.error("Error:", e.message);
    res.status(500).json({ error: e.message });
  }
};

const initiateGoogleAuth = async (req, res) => {
  try {
    console.log("=== INITIATE GOOGLE AUTH CONTROLLER START ===");
    console.log("Request body:", req.body);

    const { redirect_to } = req.body;
    const result = await authService.initiateGoogleAuth(redirect_to);

    console.log("=== INITIATE GOOGLE AUTH CONTROLLER END ===");
    res.json(result);
  } catch (e) {
    console.error("=== INITIATE GOOGLE AUTH CONTROLLER ERROR ===");
    console.error("Error:", e.message);
    res.status(500).json({ error: e.message });
  }
};

const verifyGoogle = async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: "Access token required" });
    }

    console.log("=== VERIFY GOOGLE CONTROLLER START ===");
    console.log("Received access_token:", !!access_token);

    const result = await authService.verifyGoogle(access_token);

    console.log("=== VERIFY GOOGLE CONTROLLER END ===");
    console.log("Has access_token:", !!result.access_token);
    console.log("Has refresh_token:", !!result.refresh_token);
    console.log("User ID:", result.user_id);
    console.log("Role:", result.role);
    console.log("Profile exists:", result.profile_exists);

    res.json(result);
  } catch (e) {
    console.error("=== VERIFY GOOGLE CONTROLLER ERROR ===");
    console.error("Error:", e.message);
    res.status(400).json({ error: e.message });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  setRole,
  login,
  logout,
  completeProfile,
  initiateGoogleAuth,
  verifyGoogle,
};
