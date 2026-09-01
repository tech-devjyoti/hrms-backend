const express = require("express");

const {
  getMyProfileController,
  updateMyProfileController,
} = require("../controllers/profileController");

const { authenticateUser } = require("../middlewares/authMiddleware");

const upload = require("../middlewares/uploadMiddleware");

const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/me", authenticateUser, asyncHandler(getMyProfileController));

router.patch(
  "/me",
  authenticateUser,
  upload.single("profilePicture"),
  asyncHandler(updateMyProfileController),
);

module.exports = router;
