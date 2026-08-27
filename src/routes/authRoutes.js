const express = require("express");

const {
  registerOrganization,
  login,
  getMe,
  logout,
} = require("../controllers/authController");

const { authenticateUser } = require("../middlewares/authMiddleware");

const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/register", asyncHandler(registerOrganization));

router.post("/login", asyncHandler(login));

router.get("/me", authenticateUser, asyncHandler(getMe));

router.post("/logout", logout);

module.exports = router;
