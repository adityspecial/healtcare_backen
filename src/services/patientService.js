const supabase = require("../config/supabase");

async function getPatientId(userId) {
  const { data, error } = await supabase
    .from("patients")
    .select("patient_id")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data.patient_id;
}

// Medical History
async function getMedicalHistory(userId) {
  const patientId = await getPatientId(userId);
  const { data, error } = await supabase
    .from("medical_history")
    .select("*")
    .eq("patient_id", patientId);
  if (error) throw error;
  return data;
}

async function addDisease(userId, diseaseData) {
  const patientId = await getPatientId(userId);
  const { data, error } = await supabase.from("medical_history").insert({
    patient_id: patientId,
    diagnosis: diseaseData.disease_name,
    prescribed_date: new Date().toISOString().split("T")[0],
    notes: diseaseData.notes,
  });
  if (error) throw error;
  return data;
}

// Prescriptions
async function addPrescription(userId, prescriptionData) {
  const patientId = await getPatientId(userId);
  const { data, error } = await supabase.from("prescriptions").insert({
    patient_id: patientId,
    doctor_id: prescriptionData.doctor_id,
    medicine_name: prescriptionData.medicine_name,
    dosage: prescriptionData.dosage,
    frequency: prescriptionData.frequency,
    start_date: prescriptionData.start_date,
    end_date: prescriptionData.end_date,
  });
  if (error) throw error;
  return data;
}

// SOS
async function triggerSos(userId, gps, message) {
  const patientId = await getPatientId(userId);
  const { data, error } = await supabase.from("sos_alerts").insert({
    patient_id: patientId,
    gps_coordinates: gps, // 'lat,long'
    message,
  });
  if (error) throw error;
  return data;
}

module.exports = {
  getMedicalHistory,
  addDisease,
  addPrescription,
  triggerSos,
};
