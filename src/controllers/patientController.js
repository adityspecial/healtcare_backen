const patientService = require("../services/patientService");

const getMedicalHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await patientService.getMedicalHistory(userId);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const addDisease = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await patientService.addDisease(userId, req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const triggerSos = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gps, message } = req.body;
    const data = await patientService.triggerSos(userId, gps, message);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { getMedicalHistory, addDisease, triggerSos };
