const authService = require("../services/authService");

const sendOtp = async (req, res) => {
  try {
    const { phone, full_name } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone required" });
    const result = await authService.sendOtp(phone, full_name);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { phone, token } = req.body;
    if (!phone || !token)
      return res.status(400).json({ error: "Phone & OTP required" });

    console.log('Verifying OTP for phone:', phone, 'token:', token);

    const result = await authService.verifyOtp(phone, token);

    console.log('OTP verification result:', {
      hasUser: !!result.user,
      hasSession: !!result.session,
      profileExists: result.profile_exists
    });

    res.json({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
      user_id: result.user.id,
      profile_exists: result.profile_exists,
    });
  } catch (e) {
    console.error('OTP verification error:', e.message);
    res.status(500).json({ error: e.message });
  }
};

const setRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user.id;
    const profile = await authService.setRole(userId, role);
    res.json({ message: "Role updated", profile });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(400).json({ error: "Token required" });
    await authService.logout(token);
    res.json({ message: "Logged out successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: "Phone and password required" });
    }

    const result = await authService.login(phone, password);
    res.json({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      user_id: result.user.id,
      role: result.user.role,
      profile_completed: result.user.profile_completed,
    });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
};

const completeProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    // Validate required fields
    const requiredFields = ["full_name"];
    for (const field of requiredFields) {
      if (!profileData[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    const profile = await authService.completeProfile(userId, profileData);
    res.json({ message: "Profile completed", profile });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  setRole,
  login,
  logout,
  completeProfile,
};
