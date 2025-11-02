const express = require("express");
const {
  getMedicalHistory,
  addDisease,
  triggerSos,
} = require("../controllers/patientController");
const { authenticate, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);
router.use(requireRole(["patient"]));

router.get("/medical-history", getMedicalHistory);
router.post("/diseases", addDisease);
router.post("/sos", triggerSos);

module.exports = router;
