const {
  validateCreateEmployee,
  validateUpdateEmployee,
  validateUpdateEmployeeFields,
} = require("../utils/employeeValidation");

const { validateChangePassword } = require("../utils/passwordValidation");

const { canAssignRole } = require("../utils/roleUtils");

const {
  createEmployee,
  getEmployeeById,
  suspendUserAccount,
  getEmployees,
  updateEmployee,
  deactivateEmployee,
  reactivateUserAccount,
  changePassword,
} = require("../services/employeeService");

const getEmployeesController = async (req, res) => {
  const organizationId = req.user.organizationId;

  const result = await getEmployees(organizationId, req.query);

  return res.status(200).json({
    success: true,
    message: "Employees fetched successfully.",
    data: result,
  });
};

const createEmployeeController = async (req, res) => {
  const validationErrors = validateCreateEmployee(req.body);

  if (Object.keys(validationErrors).length > 0) {
    const error = new Error("Employee validation failed.");

    error.statusCode = 400;
    error.errors = validationErrors;

    throw error;
  }

  const organizationId = req.user.organizationId;

  const canCreateEmployee = canAssignRole(req.user.role, req.body.role);

  if (!canCreateEmployee) {
    const error = new Error("You are not authorized to assign this role.");

    error.statusCode = 403;

    throw error;
  }

  const employee = await createEmployee(req.body, organizationId);

  return res.status(201).json({
    success: true,
    message: "Employee created successfully.",
    data: employee,
  });
};

const getEmployeeByIdController = async (req, res) => {
  const { employeeId } = req.params;

  const organizationId = req.user.organizationId;

  const employee = await getEmployeeById(employeeId, organizationId);

  return res.status(200).json({
    success: true,
    message: "Employee fetched successfully.",
    data: {
      employee,
    },
  });
};

const updateEmployeeController = async (req, res) => {
  // --------------------------------------------------
  // 1. Check whether requested fields are supported
  // --------------------------------------------------

  const fieldErrors = validateUpdateEmployeeFields(req.body);

  if (Object.keys(fieldErrors).length > 0) {
    const error = new Error("Request contains fields that cannot be updated.");

    error.statusCode = 400;
    error.errors = fieldErrors;

    throw error;
  }

  // --------------------------------------------------
  // 2. Validate field values
  // --------------------------------------------------

  const validationErrors = validateUpdateEmployee(req.body);

  if (Object.keys(validationErrors).length > 0) {
    const error = new Error("Employee validation failed.");

    error.statusCode = 400;
    error.errors = validationErrors;

    throw error;
  }

  // --------------------------------------------------
  // 3. Request context
  // --------------------------------------------------

  const { employeeId } = req.params;

  const { organizationId, userId } = req.user;

  // --------------------------------------------------
  // 4. Update employee
  // --------------------------------------------------

  const employee = await updateEmployee(
    employeeId,
    organizationId,
    userId,
    req.body,
  );

  // --------------------------------------------------
  // 5. Response
  // --------------------------------------------------

  return res.status(200).json({
    success: true,
    message: "Employee updated successfully.",
    data: {
      employee,
    },
  });
};

const deactivateEmployeeController = async (req, res) => {
  const { employeeId } = req.params;

  const organizationId = req.user.organizationId;

  const employee = await deactivateEmployee(
    employeeId,
    organizationId,
    req.user.userId,
  );

  return res.status(200).json({
    success: true,
    message: "Employee deactivated successfully.",
    data: {
      employee,
    },
  });
};

const suspendUserAccountController = async (req, res) => {
  const { employeeId } = req.params;

  const organizationId = req.user.organizationId;

  const user = await suspendUserAccount(
    employeeId,
    organizationId,
    req.user.userId,
  );

  return res.status(200).json({
    success: true,
    message: "Employee account suspended successfully.",
    data: {
      user,
    },
  });
};

const reactivateUserAccountController = async (req, res) => {
  const { employeeId } = req.params;

  const organizationId = req.user.organizationId;

  const user = await reactivateUserAccount(
    employeeId,
    organizationId,
    req.user.userId,
  );

  return res.status(200).json({
    success: true,
    message: "Employee account reactivated successfully.",
    data: {
      user,
    },
  });
};

const changePasswordController = async (req, res) => {
  const validationErrors = validateChangePassword(req.body);

  if (Object.keys(validationErrors).length > 0) {
    const error = new Error("Password validation failed.");

    error.statusCode = 400;
    error.errors = validationErrors;

    throw error;
  }

  const { currentPassword, newPassword } = req.body;

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

module.exports = {
  createEmployeeController,
  getEmployeesController,
  getEmployeeByIdController,
  updateEmployeeController,
  deactivateEmployeeController,
  suspendUserAccountController,
  reactivateUserAccountController,
  changePasswordController,
};
