const express = require("express");
const {
  sendOtp,
  verifyOtp,
  setRole,
  login,
  logout,
  completeProfile,
  initiateGoogleAuth,
  verifyGoogle,
} = require("../controllers/authcontroller");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes (no authentication required)
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/initiate-google-auth", initiateGoogleAuth);
router.post("/verify-google", verifyGoogle);

// Protected routes (authentication required)
router.post("/set-role", authenticate, setRole);
console.log;
router.post("/complete-profile", authenticate, completeProfile);
router.post("/logout", authenticate, logout);

module.exports = router;
