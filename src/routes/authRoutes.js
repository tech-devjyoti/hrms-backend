const express = require("express");

const {
  registerOrganization,
  login,
  getMe,
  logout,
  changePasswordController,
  forgotPasswordController,
  resetPasswordController,
} = require("../controllers/authController");

const { authenticateUser } = require("../middlewares/authMiddleware");

const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/register", asyncHandler(registerOrganization));

router.post("/login", asyncHandler(login));

router.get("/me", authenticateUser, asyncHandler(getMe));

router.post("/logout", asyncHandler(logout));

router.post(
  "/change-password",
  authenticateUser,
  asyncHandler(changePasswordController),
);

router.post("/forgot-password", asyncHandler(forgotPasswordController));

router.post("/reset-password", asyncHandler(resetPasswordController));

module.exports = router;
