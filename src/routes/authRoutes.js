const express = require("express");
const {
  sendOtp,
  verifyOtp,
  setRole,
  login,
  logout,
  completeProfile,
} = require("../controllers/authcontroller");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/set-role", authenticate, setRole);
router.post("/complete-profile", authenticate, completeProfile);
router.post("/logout", authenticate, logout);

module.exports = router;
