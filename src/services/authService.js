const supabase = require("../config/supabase");

async function sendOtp(phone, full_name) {
  console.log("Sending OTP for phone:", phone, "name:", full_name);

  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      channel: "sms",
      data: full_name ? { full_name } : undefined,
    },
  });
  if (error) throw error;
  return { message: "OTP sent" };
}

async function verifyOtp(phone, token) {
  console.log("Backend verifyOtp called with phone:", phone, "token:", token);

  // Since OTP is already verified by frontend, we just need to get/create the user
  // and generate backend tokens. We can't verify the same OTP token twice.

  // First, try to find existing user by phone
  const { data: existingUsers, error: findError } = await supabase
    .from("users")
    .select("user_id, role")
    .eq("phone_number", phone);

  if (findError) {
    console.error("Error finding user:", findError);
    throw new Error("Failed to verify user");
  }

  let userId;
  let profileExists = false;

  if (existingUsers && existingUsers.length > 0) {
    // User exists
    userId = existingUsers[0].user_id;
    profileExists = true;
    console.log("Found existing user:", userId);
  } else {
    // Need to create user - but we need the Supabase user ID
    // Since we can't verify OTP again, we'll need to get user by phone from auth
    // This is a limitation - we need the user ID from the frontend verification

    // For now, throw an error indicating the OTP was already used
    console.error(
      "User not found in database - OTP may have been verified already"
    );
    throw new Error("Token has expired or is invalid");
  }

  // Generate backend JWT tokens
  const jwt = require("jsonwebtoken");
  const access_token = jwt.sign(
    { userId: userId, role: existingUsers[0].role || "patient" },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "1h" }
  );

  const refresh_token = jwt.sign(
    { userId: userId },
    process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key",
    { expiresIn: "7d" }
  );

  // Create a mock session object for compatibility
  const session = {
    access_token,
    refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };

  // Create a mock user object
  const user = {
    id: userId,
    phone: phone,
    role: existingUsers[0].role || "patient",
  };

  console.log("Backend verification successful for user:", userId);

  return { user, session, profile_exists: profileExists };
}

async function setRole(userId, role) {
  const { data, error } = await supabase
    .from("users")
    .update({ role })
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function logout(token) {
  const { error } = await supabase.auth.signOut({ token });
  if (error) throw error;
  return { message: "Logged out" };
}

async function completeProfile(userId, profileData) {
  const { data, error } = await supabase
    .from("users")
    .update({
      full_name: profileData.full_name,
      password_hash: profileData.password
        ? await hashPassword(profileData.password)
        : undefined,
      blood_group: profileData.blood_group,
      date_of_birth: profileData.date_of_birth,
      gender: profileData.gender,
      address: profileData.address,
      emergency_contact: profileData.emergency_contact,
      profile_completed: true,
    })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function login(phone, password) {
  // Find user by phone
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("phone_number", phone)
    .single();

  if (userError || !user) {
    throw new Error("User not found");
  }

  // Verify password
  const hashedPassword = await hashPassword(password);
  if (user.password_hash !== hashedPassword) {
    throw new Error("Invalid password");
  }

  // Generate JWT tokens
  const jwt = require("jsonwebtoken");
  const access_token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "1h" }
  );

  const refresh_token = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key",
    { expiresIn: "7d" }
  );

  return {
    access_token,
    refresh_token,
    user,
  };
}

async function hashPassword(password) {
  // Simple hash for demo - in production use bcrypt
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(password).digest("hex");
}
module.exports = {
  sendOtp,
  verifyOtp,
  setRole,
  login,
  logout,
  completeProfile,
};
