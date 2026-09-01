const {
  validateOrganizationRegistration,
  validateLogin, 
} = require("../utils/onboardingValidation");

const { validateNewPassword } =  require("../utils/passwordValidation");

const {
  registerOrganization: registerOrganizationService,
  loginUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  changePassword,
} = require("../services/authService");

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000,
});

const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
});

// REGISTER ORGANIZATION
const registerOrganization = async (req, res) => {
  const validationErrors = validateOrganizationRegistration(req.body);

  if (Object.keys(validationErrors).length > 0) {
    const error = new Error("Validation failed.");
    error.statusCode = 400;
    error.errors = validationErrors;
    throw error;
  }

  const result = await registerOrganizationService(req.body);

  res.cookie("token", result.token, getCookieOptions());

  return res.status(201).json({
    success: true,
    message: "Organization created successfully.",
    data: {
      organization: result.organization,
      user: result.user,
    },
  });
};

// LOGIN
const login = async (req, res) => {
  const validationErrors = validateLogin(req.body);

  if (Object.keys(validationErrors).length > 0) {
    const error = new Error("Validation failed.");
    error.statusCode = 400;
    error.errors = validationErrors;
    throw error;
  }

  const { email, password } = req.body;

  const result = await loginUser(email, password);

  res.cookie("token", result.token, getCookieOptions());

  return res.status(200).json({
    success: true,
    message: "Login successful.",
    data: {
      user: result.user,
    },
  });
};

// GET CURRENT USER
const getMe = async (req, res) => {
  const user = await getCurrentUser(req.user.userId);

  return res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
};

// LOGOUT
const logout = (req, res) => {
  res.clearCookie("token", getClearCookieOptions());

  return res.status(200).json({
    success: true,
    message: "Logout successful.",
  });
};

// CHANGE PASSWORD
const changePasswordController = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword) {
    const error = new Error("Current password is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!newPassword) {
    const error = new Error("New password is required.");
    error.statusCode = 400;
    throw error;
  }

  if (newPassword !== confirmPassword) {
    const error = new Error("Passwords do not match.");
    error.statusCode = 400;
    throw error;
  }

  const validationErrors = validateNewPassword(newPassword);

  if (Object.keys(validationErrors).length > 0) {
    const error = new Error("Password validation failed.");
    error.statusCode = 400;
    error.errors = validationErrors;
    throw error;
  }

  const user = await changePassword(
    req.user.userId,
    currentPassword,
    newPassword,
  );

  return res.status(200).json({
    success: true,
    message: "Password changed successfully.",
    data: {
      user,
    },
  });
};

// FORGOT PASSWORD
const forgotPasswordController = async (req, res) => {
  const { email } = req.body;

  if (!email?.trim()) {
    const error = new Error("Email is required.");

    error.statusCode = 400;

    throw error;
  }

  await forgotPassword(email);

  /*
   * IMPORTANT:
   * Always return the same response.
   *
   * This prevents attackers from checking
   * whether an email exists in our system.
   */
  return res.status(200).json({
    success: true,
    message:
      "If an account exists with this email, a password reset link has been sent.",
  });
};

// RESET PASSWORD
const resetPasswordController = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token) {
    const error = new Error("Reset token is required.");

    error.statusCode = 400;

    throw error;
  }

  if (!newPassword) {
    const error = new Error("New password is required.");

    error.statusCode = 400;

    throw error;
  }

  if (!confirmPassword) {
    const error = new Error("Confirm password is required.");

    error.statusCode = 400;

    throw error;
  }

  if (newPassword !== confirmPassword) {
    const error = new Error("Passwords do not match.");

    error.statusCode = 400;

    throw error;
  }

  const validationErrors = validateNewPassword(newPassword);

  if (Object.keys(validationErrors).length > 0) {
    const error = new Error("Password validation failed.");

    error.statusCode = 400;

    error.errors = validationErrors;

    throw error;
  }

  const user = await resetPassword(token, newPassword);

  return res.status(200).json({
    success: true,
    message: "Password reset successfully.",

    data: {
      user,
    },
  });
};

module.exports = {
  registerOrganization,
  login,
  getMe,
  logout,
  changePasswordController,
  forgotPasswordController,
  resetPasswordController,
};
