const {
  validateOrganizationRegistration,
  validateLogin,
} = require("../utils/onboardingValidation");

const {
  registerOrganization: registerOrganizationService,
  loginUser,
  getCurrentUser,
} = require("../services/authService");

const registerOrganization = async (req, res) => {
  const validationErrors = validateOrganizationRegistration(req.body);

  if (Object.keys(validationErrors).length > 0) {
    const error = new Error("Validation failed.");
    error.statusCode = 400;
    error.errors = validationErrors;

    throw error;
  }

  const result = await registerOrganizationService(req.body);

  res.cookie("accessToken", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.status(201).json({
    success: true,
    message: "Organization created successfully.",
    data: {
      organization: result.organization,
      user: result.user,
    },
  });
};

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

  res.cookie("token", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message: "Login successful.",
    data: {
      user: result.user,
    },
  });
};

const getMe = async (req, res) => {
  const user = await getCurrentUser(req.user.userId);

  return res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
};

// LOGOUT USER

const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logout successful.",
  });
};

module.exports = {
  registerOrganization,
  login,
  getMe,
  logout,
};
