const supabase = require("../config/supabase");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
async function sendOtp(phone, full_name) {
  console.log("=== SEND OTP START ===");
  console.log("Sending OTP for phone:", phone, "name:", full_name);

  // Ensure phone has + prefix for Supabase
  const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
  console.log("Formatted phone for Supabase:", formattedPhone);
  console.log("Supabase URL:", process.env.SUPABASE_URL);
  console.log("Supabase Anon Key exists:", !!process.env.SUPABASE_ANON_KEY);

  const { error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone, // ← Use formatted phone with +
    options: {
      channel: "sms",
      data: full_name ? { full_name } : undefined,
    },
  });

  if (error) {
    console.error("Send OTP error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    throw error;
  }

  console.log("OTP sent successfully to:", formattedPhone);
  console.log("=== SEND OTP END ===");
  return { message: "OTP sent successfully" };
}
async function verifyOtp(phone, token) {
  console.log("=== VERIFY OTP START ===");
  console.log("Backend verifyOtp called with phone:", phone, "token:", token);

  // Ensure phone has + prefix for Supabase
  const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
  console.log("Formatted phone for Supabase:", formattedPhone);

  // First, verify the OTP with Supabase to get the user
  const { data, error } = await supabase.auth.verifyOtp({
    phone: formattedPhone, // ← Use formatted phone with +
    token,
    type: "sms",
  });

  if (error) {
    console.error("Supabase OTP verification error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    throw new Error("Token has expired or is invalid");
  }

  if (!data.user) {
    console.error("No user returned from Supabase OTP verification");
    throw new Error("User not found after OTP verification");
  }

  const supabaseUserId = data.user.id;
  console.log("OTP verified successfully for Supabase user:", supabaseUserId);
  console.log("User phone from Supabase:", data.user.phone);

  // Now check if user exists in our custom users table
  const { data: existingUsers, error: findError } = await supabase
    .from("users")
    .select("user_id, role, full_name")
    .eq("user_id", supabaseUserId);

  if (findError) {
    console.error("Error finding user in database:", findError);
    throw new Error("Failed to verify user");
  }

  let userId = supabaseUserId;
  let profileExists = false;
  let userRole = null;

  if (existingUsers && existingUsers.length > 0) {
    // User exists in our database
    profileExists = existingUsers[0].full_name ? true : false; // Use full_name as profile indicator
    userRole = existingUsers[0].role || null;
    console.log(
      "Found existing user in database:",
      userId,
      "role:",
      userRole,
      "profile completed:",
      profileExists
    );
  } else {
    // User doesn't exist in our database, create them
    console.log("Creating new user in database for:", userId);

    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        user_id: supabaseUserId,
        phone_number: formattedPhone, // ← Store with + prefix
        role: null, // No default role - will be set later
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating user:", createError);
      throw new Error("Failed to create user profile");
    }

    console.log("Created new user:", newUser);
    profileExists = false;
    userRole = null;
  }

  // Generate backend JWT tokens
  const access_token = jwt.sign(
    {
      userId: userId,
      role: userRole,
      phone: formattedPhone,
    },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "1h" }
  );

  const refresh_token = jwt.sign(
    { userId: userId },
    process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key",
    { expiresIn: "7d" }
  );

  console.log("Backend verification successful for user:", userId);
  console.log("Returning tokens and user data");
  console.log("=== VERIFY OTP END ===");

  // Return in the format expected by frontend
  return {
    access_token,
    refresh_token,
    user_id: userId,
    phone: formattedPhone,
    role: userRole,
    profile_exists: profileExists,
  };
}

async function login(phone, password) {
  console.log("Login attempt for phone:", phone);

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
  const access_token = jwt.sign(
    { userId: user.user_id, role: user.role, phone: phone },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "1h" }
  );

  const refresh_token = jwt.sign(
    { userId: user.user_id },
    process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key",
    { expiresIn: "7d" }
  );

  return {
    access_token,
    refresh_token,
    user,
  };
}

async function verifyWithToken(supabaseAccessToken) {
  console.log("Backend verifyWithToken called");

  // Get user from Supabase using the access token
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(supabaseAccessToken);

  if (error) {
    console.error("Supabase getUser error:", error);
    throw new Error("Invalid token");
  }

  if (!user) {
    throw new Error("User not found");
  }

  const supabaseUserId = user.id;
  const formattedPhone = user.phone; // Phone should be available from user object
  console.log("User from token:", supabaseUserId, "phone:", formattedPhone);

  // Now check if user exists in our custom users table
  const { data: existingUsers, error: findError } = await supabase
    .from("users")
    .select("user_id, role, full_name")
    .eq("user_id", supabaseUserId);

  if (findError) {
    console.error("Error finding user in database:", findError);
    console.error("Find error details:", JSON.stringify(findError, null, 2));
    throw new Error("Failed to verify user");
  }

  let userId = supabaseUserId;
  let profileExists = false;
  let userRole = null;

  if (existingUsers && existingUsers.length > 0) {
    // User exists in our database
    profileExists = existingUsers[0].full_name ? true : false; // Use full_name as profile indicator
    userRole = existingUsers[0].role || null;
    console.log(
      "Found existing user in database:",
      userId,
      "role:",
      userRole,
      "profile completed:",
      profileExists
    );
  } else {
    // User doesn't exist in our database, create them
    console.log("Creating new user in database for:", userId);

    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        user_id: supabaseUserId,
        phone_number: formattedPhone,
        role: null, // No default role - will be set later
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating user:", createError);
      throw new Error("Failed to create user profile");
    }

    console.log("Created new user:", newUser);
    profileExists = false;
    userRole = null;
  }

  // Generate backend JWT tokens
  const access_token = jwt.sign(
    {
      userId: userId,
      role: userRole,
      phone: formattedPhone,
    },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "1h" }
  );

  const refresh_token = jwt.sign(
    { userId: userId },
    process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key",
    { expiresIn: "7d" }
  );

  console.log("Backend token verification successful for user:", userId);

  // Return in the format expected by frontend
  return {
    access_token,
    refresh_token,
    user_id: userId,
    phone: formattedPhone,
    role: userRole,
    profile_exists: profileExists,
  };
}

async function setRole(userId, role) {
  console.log("Setting role for user:", userId, "role:", role);

  const { data, error } = await supabase
    .from("users")
    .update({ role })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error setting role:", error);
    throw new Error("Failed to set role");
  }

  console.log("Role set successfully:", data);
  return data;
}

async function logout(token) {
  console.log("Logging out user with token");

  // For JWT, we don't need to do anything server-side
  // The client should remove the token from storage
  // In a more advanced setup, you might want to blacklist the token

  return { message: "Logged out successfully" };
}

async function completeProfile(userId, profileData) {
  console.log("Completing profile for user:", userId, "data:", profileData);

  const { data, error } = await supabase
    .from("users")
    .update({
      full_name: profileData.full_name,
      ...profileData, // Include any additional profile data
    })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error completing profile:", error);
    throw new Error("Failed to complete profile");
  }

  console.log("Profile completed successfully:", data);
  return data;
}

async function initiateGoogleAuth(redirect_to) {
  console.log("=== INITIATE GOOGLE AUTH START ===");
  console.log("Received redirect_to:", redirect_to);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "exp://10.200.250.164:8081/(welcome)/role-selection",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("Initiate Google Auth error:", error);
    throw error;
  }

  console.log("Google Auth URL generated:", data.url);
  console.log("=== INITIATE GOOGLE AUTH END ===");
  return { url: data.url };
}

async function verifyGoogle(access_token) {
  console.log("=== VERIFY GOOGLE START ===");
  console.log("Verifying Google token");

  // Get user from Supabase using the access token
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(access_token);

  if (error) {
    console.error("Supabase getUser error:", error);
    throw new Error("Invalid Google token");
  }

  if (!user) {
    throw new Error("User not found");
  }

  const supabaseUserId = user.id;
  const email = user.email; // Google provides email
  console.log("User from Google:", supabaseUserId, "email:", email);

  // Check if user exists in our custom users table
  const { data: existingUsers, error: findError } = await supabase
    .from("users")
    .select("user_id, role, full_name")
    .eq("user_id", supabaseUserId);

  if (findError) {
    console.error("Error finding user in database:", findError);
    throw new Error("Failed to verify user");
  }

  let userId = supabaseUserId;
  let profileExists = false;
  let userRole = null;

  if (existingUsers && existingUsers.length > 0) {
    // User exists in our database
    profileExists = existingUsers[0].full_name ? true : false;
    userRole = existingUsers[0].role || null;
    console.log(
      "Found existing user in database:",
      userId,
      "role:",
      userRole,
      "profile completed:",
      profileExists
    );
  } else {
    // User doesn't exist in our database, create them
    console.log("Creating new user in database for:", userId);

    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        user_id: supabaseUserId,
        phone_number: null, // Google auth doesn't have phone
        email: email,
        role: null, // No default role - will be set later
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating user:", createError);
      throw new Error("Failed to create user profile");
    }

    console.log("Created new user:", newUser);
    profileExists = false;
    userRole = null;
  }

  // Generate backend JWT tokens
  const access_token_jwt = jwt.sign(
    {
      userId: userId,
      role: userRole,
      email: email,
    },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "1h" }
  );

  const refresh_token = jwt.sign(
    { userId: userId },
    process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key",
    { expiresIn: "7d" }
  );

  console.log("Google verification successful for user:", userId);

  // Return in the format expected by frontend
  return {
    access_token: access_token_jwt,
    refresh_token,
    user_id: userId,
    email: email,
    role: userRole,
    profile_exists: profileExists,
  };
}

async function hashPassword(password) {
  // Simple hash for demo - in production use bcrypt
  return crypto.createHash("sha256").update(password).digest("hex");
}

module.exports = {
  sendOtp,
  verifyOtp,
  verifyWithToken,
  setRole,
  login,
  logout,
  completeProfile,
  initiateGoogleAuth,
  verifyGoogle,
};
