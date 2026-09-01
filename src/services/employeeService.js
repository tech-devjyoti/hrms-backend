const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Organization = require("../models/Organization");
const Employee = require("../models/Employee");
const User = require("../models/User");
const { buildEmployeeQuery, getPagination } = require("../utils/employeeQuery");

const { assertCanManageEmployee } = require("../utils/authorization");

const { getRequestingUser } = require("../utils/employeeAuthorization");

const { getUnauthorizedFields } = require("../utils/employeeFieldPermissions");

const {
  EMPLOYMENT_STATUS,
  ACCOUNT_STATUS,
} = require("../constants/employeeStatus");

const DEFAULT_EMPLOYEE_PASSWORD = "User_12345";

const getEmployees = async (organizationId, queryParams) => {
  const { role } = queryParams;

  const employeeQuery = buildEmployeeQuery(queryParams);

  const { page, limit, skip } = getPagination(queryParams);

  employeeQuery.organizationId = organizationId;

  // Role belongs to User, not Employee.
  if (role) {
    const users = await User.find({
      organizationId,
      role,
    })
      .select("employeeId")
      .lean();

    const employeeIds = users.map((user) => user.employeeId);

    employeeQuery._id = {
      $in: employeeIds,
    };
  }

  const [employees, totalEmployees] = await Promise.all([
    Employee.find(employeeQuery)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Employee.countDocuments(employeeQuery),
  ]);

  // Get User information for employees.
  const employeeIds = employees.map((employee) => employee._id);

  const users = await User.find({
    organizationId,
    employeeId: {
      $in: employeeIds,
    },
  })
    .select("employeeId role accountStatus mustChangePassword")
    .lean();

  const userMap = new Map(
    users.map((user) => [user.employeeId.toString(), user]),
  );

  const employeesWithAccount = employees.map((employee) => {
    const user = userMap.get(employee._id.toString());

    return {
      ...employee,

      // Employee's own profile picture
      profilePicture: employee.profilePicture || null,

      user: user
        ? {
            id: user._id,
            role: user.role,
            accountStatus: user.accountStatus,
            mustChangePassword: user.mustChangePassword,
          }
        : null,
    };
  });

  const totalPages = Math.ceil(totalEmployees / limit);

  return {
    employees: employeesWithAccount,

    pagination: {
      page,
      limit,
      totalEmployees,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

const createEmployee = async (data, organizationId) => {
  const {
    employeeCode,
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    gender,
    dateOfJoining,
    employmentType,
    designation,
    department,
    address,
    role,
  } = data;

  const normalizedEmployeeCode = employeeCode.trim().toUpperCase();

  const normalizedEmail = email.trim().toLowerCase();

  const existingEmployee = await Employee.findOne({
    organizationId,
    $or: [
      {
        employeeCode: normalizedEmployeeCode,
      },
      {
        email: normalizedEmail,
      },
    ],
  });

  if (existingEmployee) {
    const error = new Error(
      existingEmployee.employeeCode === normalizedEmployeeCode
        ? "Employee code already exists."
        : "Employee email is already registered.",
    );

    error.statusCode = 409;

    throw error;
  }

  const existingUser = await User.findOne({
    organizationId,
    email: normalizedEmail,
  });

  if (existingUser) {
    const error = new Error("A user account with this email already exists.");

    error.statusCode = 409;

    throw error;
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_EMPLOYEE_PASSWORD, 12);

  const session = await Organization.startSession();

  try {
    let employee;
    let user;

    await session.withTransaction(async () => {
      // Create Employee
      [employee] = await Employee.create(
        [
          {
            organizationId,

            employeeCode: normalizedEmployeeCode,

            firstName: firstName.trim(),

            lastName: lastName.trim(),

            email: normalizedEmail,

            phone: phone?.trim(),

            dateOfBirth: dateOfBirth || undefined,

            gender,

            employment: {
              dateOfJoining,

              employmentType,

              designation: designation.trim(),

              department: department.trim(),

              status: "ACTIVE",
            },

            address: {
              addressLine1: address?.addressLine1?.trim(),

              addressLine2: address?.addressLine2?.trim(),

              country: address?.country?.trim(),

              state: address?.state?.trim(),

              city: address?.city?.trim(),

              pincode: address?.pincode?.trim(),
            },
          },
        ],
        { session },
      );

      // Create User Account
      [user] = await User.create(
        [
          {
            organizationId,

            employeeId: employee._id,

            email: normalizedEmail,

            password: hashedPassword,

            role,

            accountStatus: "ACTIVE",

            mustChangePassword: true,
          },
        ],
        { session },
      );
    });

    return {
      employee: {
        id: employee._id,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        employment: employee.employment,
        address: employee.address,
      },

      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        mustChangePassword: user.mustChangePassword,
      },

      temporaryPassword: DEFAULT_EMPLOYEE_PASSWORD,
    };
  } finally {
    await session.endSession();
  }
};

const updateEmployee = async (
  employeeId,
  organizationId,
  requestingUserId,
  data,
) => {
  const session = await mongoose.startSession();

  try {
    let updatedEmployee;

    await session.withTransaction(async () => {
      // --------------------------------------------------
      // 1. Find employee
      // --------------------------------------------------

      const employee = await Employee.findOne({
        _id: employeeId,
        organizationId,
      }).session(session);

      if (!employee) {
        const error = new Error("Employee not found.");

        error.statusCode = 404;

        throw error;
      }

      // --------------------------------------------------
      // 2. Find requesting user
      // --------------------------------------------------

      const requestingUser = await getRequestingUser(
        requestingUserId,
        organizationId,
      );

      if (!requestingUser) {
        const error = new Error("Authenticated user not found.");

        error.statusCode = 401;

        throw error;
      }

      // --------------------------------------------------
      // 3. Find target employee's account
      // --------------------------------------------------

      const targetUser = await User.findOne({
        employeeId: employee._id,
        organizationId,
      })
        .select("role accountStatus email")
        .session(session);

      if (!targetUser) {
        const error = new Error("Employee account not found.");

        error.statusCode = 404;

        throw error;
      }

      // --------------------------------------------------
      // 4. Determine whether this is self-update
      // --------------------------------------------------

      const isSelf =
        requestingUser.employeeId?.toString() === employee._id.toString();

      // --------------------------------------------------
      // 5. Role-level authorization
      //
      // ADMIN:
      //   Can modify everyone.
      //
      // Non-ADMIN:
      //   Cannot modify ADMIN.
      // --------------------------------------------------

      assertCanManageEmployee({
        requestingRole: requestingUser.role,
        targetRole: targetUser.role,
      });

      // --------------------------------------------------
      // 6. Cannot update inactive employee
      // --------------------------------------------------

      if (employee.employment?.status === EMPLOYMENT_STATUS.INACTIVE) {
        const error = new Error("Inactive employees cannot be updated.");

        error.statusCode = 409;

        throw error;
      }

      // --------------------------------------------------
      // 7. Cannot update deactivated account
      // --------------------------------------------------

      if (targetUser.accountStatus === ACCOUNT_STATUS.DEACTIVATED) {
        const error = new Error(
          "Deactivated employee accounts cannot be updated.",
        );

        error.statusCode = 409;

        throw error;
      }

      // --------------------------------------------------
      // 8. Field-level authorization
      //
      // ADMIN:
      //   Everything.
      //
      // HR:
      //   Employment information for other employees.
      //   NOT their own employment information.
      //
      // MANAGER:
      //   No employment information.
      //
      // EMPLOYEE:
      //   No employment information.
      // --------------------------------------------------

      const unauthorizedFields = getUnauthorizedFields({
        requestingRole: requestingUser.role,
        isSelf,
        data,
      });

      if (unauthorizedFields.length > 0) {
        const error = new Error(
          "You do not have permission to modify these fields.",
        );

        error.statusCode = 403;

        error.errors = {
          fields: unauthorizedFields,
        };

        throw error;
      }

      // --------------------------------------------------
      // 9. Extract fields
      // --------------------------------------------------

      const {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        gender,
        dateOfJoining,
        employmentType,
        designation,
        department,
        address,
      } = data;

      // --------------------------------------------------
      // 10. Personal information
      // --------------------------------------------------

      if (firstName !== undefined) {
        employee.firstName = firstName.trim();
      }

      if (lastName !== undefined) {
        employee.lastName = lastName.trim();
      }

      if (phone !== undefined) {
        employee.phone = phone?.trim();
      }

      if (dateOfBirth !== undefined) {
        employee.dateOfBirth = dateOfBirth || undefined;
      }

      if (gender !== undefined) {
        employee.gender = gender;
      }

      // --------------------------------------------------
      // 11. Email
      // --------------------------------------------------

      if (email !== undefined) {
        const normalizedEmail = email.trim().toLowerCase();

        if (normalizedEmail !== employee.email) {
          // Check Employee collection
          const existingEmployee = await Employee.findOne({
            organizationId,
            email: normalizedEmail,
            _id: {
              $ne: employeeId,
            },
          }).session(session);

          if (existingEmployee) {
            const error = new Error("Employee email is already registered.");

            error.statusCode = 409;

            throw error;
          }

          // Check User collection
          const existingUser = await User.findOne({
            organizationId,
            email: normalizedEmail,
            employeeId: {
              $ne: employeeId,
            },
          }).session(session);

          if (existingUser) {
            const error = new Error(
              "A user account with this email already exists.",
            );

            error.statusCode = 409;

            throw error;
          }

          employee.email = normalizedEmail;
        }
      }

      // --------------------------------------------------
      // 12. Employment information
      // --------------------------------------------------

      if (dateOfJoining !== undefined) {
        employee.employment.dateOfJoining = dateOfJoining;
      }

      if (employmentType !== undefined) {
        employee.employment.employmentType = employmentType;
      }

      if (designation !== undefined) {
        employee.employment.designation = designation.trim();
      }

      if (department !== undefined) {
        employee.employment.department = department.trim();
      }

      // --------------------------------------------------
      // 13. Address
      // --------------------------------------------------

      if (address !== undefined) {
        if (address.addressLine1 !== undefined) {
          employee.address.addressLine1 = address.addressLine1?.trim();
        }

        if (address.addressLine2 !== undefined) {
          employee.address.addressLine2 = address.addressLine2?.trim();
        }

        if (address.country !== undefined) {
          employee.address.country = address.country?.trim();
        }

        if (address.state !== undefined) {
          employee.address.state = address.state?.trim();
        }

        if (address.city !== undefined) {
          employee.address.city = address.city?.trim();
        }

        if (address.pincode !== undefined) {
          employee.address.pincode = address.pincode?.trim();
        }
      }

      // --------------------------------------------------
      // 14. Save employee
      // --------------------------------------------------

      await employee.save({
        session,
      });

      // --------------------------------------------------
      // 15. Synchronize login email
      // --------------------------------------------------

      if (email !== undefined) {
        targetUser.email = employee.email;

        await targetUser.save({
          session,
        });
      }

      updatedEmployee = employee;
    });

    // --------------------------------------------------
    // 16. Return updated employee
    // --------------------------------------------------

    return {
      id: updatedEmployee._id,
      employeeCode: updatedEmployee.employeeCode,
      firstName: updatedEmployee.firstName,
      lastName: updatedEmployee.lastName,
      email: updatedEmployee.email,
      phone: updatedEmployee.phone,
      dateOfBirth: updatedEmployee.dateOfBirth,
      gender: updatedEmployee.gender,
      employment: updatedEmployee.employment,
      address: updatedEmployee.address,
    };
  } finally {
    await session.endSession();
  }
};

const getEmployeeById = async (employeeId, organizationId) => {
  const employee = await Employee.findOne({
    _id: employeeId,
    organizationId,
  }).lean();

  if (!employee) {
    const error = new Error("Employee not found.");

    error.statusCode = 404;

    throw error;
  }

  const user = await User.findOne({
    employeeId: employee._id,
    organizationId,
  })
    .select("employeeId email role accountStatus mustChangePassword")
    .lean();

  return {
    ...employee,

    profilePicture: employee.profilePicture
      ? {
          url: employee.profilePicture.url,
          publicId: employee.profilePicture.publicId,
        }
      : null,

    user: user
      ? {
          id: user._id,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus,
          mustChangePassword: user.mustChangePassword,
        }
      : null,
  };
};

const deactivateEmployee = async (
  employeeId,
  organizationId,
  requestingUserId,
) => {
  const session = await mongoose.startSession();

  try {
    let employee;

    await session.withTransaction(async () => {
      // --------------------------------------------------
      // 1. Find target employee
      // --------------------------------------------------

      employee = await Employee.findOne({
        _id: employeeId,
        organizationId,
      }).session(session);

      if (!employee) {
        const error = new Error("Employee not found.");

        error.statusCode = 404;

        throw error;
      }

      // --------------------------------------------------
      // 2. Find requesting user
      // --------------------------------------------------

      const requestingUser = await User.findOne({
        _id: requestingUserId,
        organizationId,
      })
        .select("employeeId role")
        .session(session);

      if (!requestingUser) {
        const error = new Error("Authenticated user not found.");

        error.statusCode = 401;

        throw error;
      }

      // --------------------------------------------------
      // 3. Prevent self-deactivation
      // --------------------------------------------------

      if (
        requestingUser.employeeId &&
        requestingUser.employeeId.toString() === employee._id.toString()
      ) {
        const error = new Error("You cannot deactivate your own account.");

        error.statusCode = 403;

        throw error;
      }

      // --------------------------------------------------
      // 4. Find target employee's user account
      // --------------------------------------------------

      const targetUser = await User.findOne({
        employeeId: employee._id,
        organizationId,
      })
        .select("role accountStatus")
        .session(session);

      if (!targetUser) {
        const error = new Error("Employee account not found.");

        error.statusCode = 404;

        throw error;
      }

      // --------------------------------------------------
      // 5. Authorization
      //
      // ADMIN can manage everyone.
      // Non-ADMIN cannot manage ADMIN.
      // --------------------------------------------------

      assertCanManageEmployee({
        requestingRole: requestingUser.role,
        targetRole: targetUser.role,
      });

      // --------------------------------------------------
      // 6. Check if already inactive
      // --------------------------------------------------

      if (employee.employment.status === EMPLOYMENT_STATUS.INACTIVE) {
        const error = new Error("Employee is already inactive.");

        error.statusCode = 409;

        throw error;
      }

      // --------------------------------------------------
      // 7. Deactivate employee
      // --------------------------------------------------

      employee.employment.status = EMPLOYMENT_STATUS.INACTIVE;

      await employee.save({
        session,
      });

      // --------------------------------------------------
      // 8. Deactivate user account
      // --------------------------------------------------

      targetUser.accountStatus = ACCOUNT_STATUS.DEACTIVATED;

      await targetUser.save({
        session,
      });
    });

    // --------------------------------------------------
    // 9. Return updated employee
    // --------------------------------------------------

    return {
      id: employee._id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      employment: employee.employment,
    };
  } finally {
    await session.endSession();
  }
};

const suspendUserAccount = async (
  employeeId,
  organizationId,
  requestingUserId,
) => {
  const session = await mongoose.startSession();

  try {
    let user;

    await session.withTransaction(async () => {
      // ---------------------------------------------
      // 1. Find employee
      // ---------------------------------------------

      const employee = await Employee.findOne({
        _id: employeeId,
        organizationId,
      }).session(session);

      if (!employee) {
        const error = new Error("Employee not found.");

        error.statusCode = 404;

        throw error;
      }

      // ---------------------------------------------
      // 2. Find requesting user
      // ---------------------------------------------

      const requestingUser = await User.findOne({
        _id: requestingUserId,
        organizationId,
      })
        .select("employeeId role")
        .session(session);

      if (!requestingUser) {
        const error = new Error("Authenticated user not found.");

        error.statusCode = 401;

        throw error;
      }

      // ---------------------------------------------
      // 3. Prevent self-suspension
      // ---------------------------------------------

      if (
        requestingUser.employeeId &&
        requestingUser.employeeId.toString() === employee._id.toString()
      ) {
        const error = new Error("You cannot suspend your own account.");

        error.statusCode = 403;

        throw error;
      }

      // ---------------------------------------------
      // 4. Find target user's account
      // ---------------------------------------------

      user = await User.findOne({
        employeeId: employee._id,
        organizationId,
      })
        .select("employeeId email role accountStatus mustChangePassword")
        .session(session);

      if (!user) {
        const error = new Error("Employee account not found.");

        error.statusCode = 404;

        throw error;
      }

      // ---------------------------------------------
      // 5. Authorization
      //
      // ADMIN can manage everyone.
      // Non-ADMIN cannot manage ADMIN.
      // ---------------------------------------------

      assertCanManageEmployee({
        requestingRole: requestingUser.role,
        targetRole: user.role,
      });

      // ---------------------------------------------
      // 6. Check current account status
      // ---------------------------------------------

      if (user.accountStatus === ACCOUNT_STATUS.DEACTIVATED) {
        const error = new Error("Employee account is already deactivated.");

        error.statusCode = 409;

        throw error;
      }

      if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
        const error = new Error("Employee account is already suspended.");

        error.statusCode = 409;

        throw error;
      }

      // ---------------------------------------------
      // 7. Suspend account
      // ---------------------------------------------

      user.accountStatus = ACCOUNT_STATUS.SUSPENDED;

      await user.save({
        session,
      });
    });

    // ---------------------------------------------
    // 8. Return updated account
    // ---------------------------------------------

    return {
      id: user._id,
      employeeId: user.employeeId,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      mustChangePassword: user.mustChangePassword,
    };
  } finally {
    await session.endSession();
  }
};

const reactivateUserAccount = async (
  employeeId,
  organizationId,
  requestingUserId,
) => {
  const session = await mongoose.startSession();

  try {
    let user;

    await session.withTransaction(async () => {
      // ---------------------------------------------
      // 1. Find employee
      // ---------------------------------------------

      const employee = await Employee.findOne({
        _id: employeeId,
        organizationId,
      }).session(session);

      if (!employee) {
        const error = new Error("Employee not found.");

        error.statusCode = 404;

        throw error;
      }

      // ---------------------------------------------
      // 2. Find requesting user
      // ---------------------------------------------

      const requestingUser = await User.findOne({
        _id: requestingUserId,
        organizationId,
      })
        .select("employeeId role")
        .session(session);

      if (!requestingUser) {
        const error = new Error("Authenticated user not found.");

        error.statusCode = 401;

        throw error;
      }

      // ---------------------------------------------
      // 3. Prevent self-reactivation
      // ---------------------------------------------

      if (
        requestingUser.employeeId &&
        requestingUser.employeeId.toString() === employee._id.toString()
      ) {
        const error = new Error("You cannot reactivate your own account.");

        error.statusCode = 403;

        throw error;
      }

      // ---------------------------------------------
      // 4. Inactive employee cannot be reactivated
      // ---------------------------------------------

      if (employee.employment.status === EMPLOYMENT_STATUS.INACTIVE) {
        const error = new Error("Inactive employees cannot be reactivated.");

        error.statusCode = 409;

        throw error;
      }

      // ---------------------------------------------
      // 5. Find target user's account
      // ---------------------------------------------

      user = await User.findOne({
        employeeId: employee._id,
        organizationId,
      })
        .select("employeeId email role accountStatus mustChangePassword")
        .session(session);

      if (!user) {
        const error = new Error("Employee account not found.");

        error.statusCode = 404;

        throw error;
      }

      // ---------------------------------------------
      // 6. Authorization
      //
      // ADMIN can manage everyone.
      // Non-ADMIN cannot manage ADMIN.
      // ---------------------------------------------

      assertCanManageEmployee({
        requestingRole: requestingUser.role,
        targetRole: user.role,
      });

      // ---------------------------------------------
      // 7. Check current account status
      // ---------------------------------------------

      if (user.accountStatus === ACCOUNT_STATUS.ACTIVE) {
        const error = new Error("Employee account is already active.");

        error.statusCode = 409;

        throw error;
      }

      // ---------------------------------------------
      // 8. Reactivate account
      // ---------------------------------------------

      user.accountStatus = ACCOUNT_STATUS.ACTIVE;

      await user.save({
        session,
      });
    });

    // ---------------------------------------------
    // 9. Return updated account
    // ---------------------------------------------

    return {
      id: user._id,
      employeeId: user.employeeId,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      mustChangePassword: user.mustChangePassword,
    };
  } finally {
    await session.endSession();
  }
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    const error = new Error("User account not found.");

    error.statusCode = 404;

    throw error;
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password,
  );

  if (!isCurrentPasswordValid) {
    const error = new Error("Current password is incorrect.");

    error.statusCode = 401;

    throw error;
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);

  if (isSamePassword) {
    const error = new Error(
      "New password must be different from the current password.",
    );

    error.statusCode = 400;

    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  user.password = hashedPassword;
  user.mustChangePassword = false;

  await user.save();

  return {
    id: user._id,
    email: user.email,
    mustChangePassword: user.mustChangePassword,
  };
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deactivateEmployee,
  suspendUserAccount,
  reactivateUserAccount,
  changePassword,
};
