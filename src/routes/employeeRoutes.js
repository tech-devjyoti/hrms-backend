const express = require("express");

const {
  createEmployeeController,
  getEmployeesController,
  getEmployeeByIdController,
  updateEmployeeController,
  deactivateEmployeeController,
  suspendUserAccountController,
  reactivateUserAccountController,
  changePasswordController,
} = require("../controllers/employeeController");

const { authenticateUser } = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorizeMiddleware");

const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get(
  "/",
  authenticateUser,
  authorize("ADMIN", "HR", "MANAGER"),
  asyncHandler(getEmployeesController),
);

router.get(
  "/:employeeId",
  authenticateUser,
  authorize("ADMIN", "HR", "MANAGER"),
  asyncHandler(getEmployeeByIdController),
);

router.post(
  "/",
  authenticateUser,
  authorize("ADMIN", "HR"),
  asyncHandler(createEmployeeController),
);

router.patch(
  "/:employeeId",
  authenticateUser,
  authorize("ADMIN", "HR"),
  asyncHandler(updateEmployeeController),
);

router.patch(
  "/:employeeId/deactivate",
  authenticateUser,
  authorize("ADMIN", "HR"),
  asyncHandler(deactivateEmployeeController),
);

router.patch(
  "/:employeeId/suspend",
  authenticateUser,
  authorize("ADMIN", "HR"),
  asyncHandler(suspendUserAccountController),
);

router.patch(
  "/:employeeId/reactivate",
  authenticateUser,
  authorize("ADMIN", "HR"),
  asyncHandler(reactivateUserAccountController),
);

router.post(
  "/:employeeId/change-password",
  authenticateUser, 
  asyncHandler(changePasswordController),
);

module.exports = router;
