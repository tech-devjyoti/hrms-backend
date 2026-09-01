const { v4: uuidv4 } = require("uuid");

const { sendPasswordResetEmail } = require("../utils/emailService");

const bcrypt = require("bcrypt");
const Organization = require("../models/Organization");
const User = require("../models/User");
const Employee = require("../models/Employee");

const { generateAccessToken } = require("../utils/authUtils");

const { ACCOUNT_STATUS } = require("../constants/employeeStatus");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
};

// REGISTER ORGANIZATION
const registerOrganization = async (data) => {
  const {
    organizationName,
    organizationCode,
    organizationEmail,
    organizationPhone,
    organizationType,
    industry,
    website,

    addressLine1,
    addressLine2,
    country,
    state,
    city,
    pincode,

    employeeCount,
    organizationSize,
    foundedYear,
    workingDays,
    timezone,
    currency,

    firstName,
    lastName,
    adminEmail,
    password,
  } = data;

  const normalizedOrganizationCode = organizationCode.trim().toUpperCase();

  const normalizedOrganizationEmail = organizationEmail.trim().toLowerCase();

  const normalizedAdminEmail = adminEmail.trim().toLowerCase();

  const existingOrganization = await Organization.findOne({
    organizationCode: normalizedOrganizationCode,
  });

  if (existingOrganization) {
    throw createError("Organization code already exists.", 409);
  }

  const existingUser = await User.findOne({
    email: normalizedAdminEmail,
  });

  if (existingUser) {
    throw createError("Admin email is already registered.", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const session = await Organization.startSession();

  try {
    let organization;
    let employee;
    let user;

    await session.withTransaction(async () => {
      [organization] = await Organization.create(
        [
          {
            organizationName: organizationName.trim(),

            organizationCode: normalizedOrganizationCode,

            organizationEmail: normalizedOrganizationEmail,

            organizationPhone: organizationPhone?.trim(),

            organizationType: organizationType.trim(),

            industry: industry.trim(),

            website: website?.trim(),

            address: {
              addressLine1: addressLine1.trim(),

              addressLine2: addressLine2?.trim(),

              country: country.trim(),

              state: state.trim(),

              city: city.trim(),

              pincode: pincode.trim(),
            },

            settings: {
              employeeCount: Number(employeeCount),

              organizationSize: organizationSize.trim(),

              foundedYear: foundedYear ? Number(foundedYear) : undefined,

              workingDays,

              timezone: timezone.trim(),

              currency: currency.trim(),
            },
          },
        ],
        { session },
      );

      // 2. Create initial Admin Employee
      [employee] = await Employee.create(
        [
          {
            organizationId: organization._id,

            employeeCode: "EMP001",

            firstName: firstName.trim(),

            lastName: lastName.trim(),

            email: normalizedAdminEmail,

            employment: {
              dateOfJoining: new Date(),

              employmentType: "FULL_TIME",

              designation: "Organization Administrator",

              department: "Administration",

              status: "ACTIVE",
            },
          },
        ],
        { session },
      );

      // 3. Create Admin User
      [user] = await User.create(
        [
          {
            organizationId: organization._id,

            employeeId: employee._id,

            firstName: firstName.trim(),

            lastName: lastName.trim(),

            email: normalizedAdminEmail,

            password: hashedPassword,

            role: "ADMIN",

            mustChangePassword: false,
          },
        ],
        { session },
      );
    });

    const token = generatetoken(user);

    return {
      token,

      organization: {
        id: organization._id,
        organizationName: organization.organizationName,
        organizationCode: organization.organizationCode,
      },

      employee: {
        id: employee._id,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
      },

      user: {
        id: user._id,
        employeeId: user.employeeId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  } finally {
    await session.endSession();
  }
};

// LOGIN
const loginUser = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

  if (!user) {
    throw createError("Invalid email or password.", 401);
  }

  if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
    throw createError("Your account has been suspended.", 403);
  }

  if (user.accountStatus === ACCOUNT_STATUS.DEACTIVATED) {
    throw createError("Your account has been deactivated.", 403);
  }

  if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    throw createError("Your account is not active.", 403);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw createError("Invalid email or password.", 401);
  }

  const employee = await Employee.findById(user.employeeId)
    .select("_id firstName lastName profilePicture")
    .lean();

  const token = generateAccessToken({
    userId: user._id,
    employeeId: user.employeeId,
    organizationId: user.organizationId,
    role: user.role,
  });

  return {
    token,

    user: {
      id: user._id,
      employeeId: user.employeeId,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      mustChangePassword: user.mustChangePassword,

      employee: employee
        ? {
            id: employee._id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            profilePicture: employee.profilePicture || null,
          }
        : null,
    },
  };
};

// GET CURRENT USER PROFILE
// const getCurrentUser = async (userId) => {
//   const user = await User.findById(userId).select("-password");

//   if (!user) {
//     throw createError("User not found.", 404);
//   }

//   if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
//     throw createError("Your account is not active.", 403);
//   }

//   return {
//     id: user._id,
//     employeeId: user.employeeId,
//     firstName: user.firstName,
//     lastName: user.lastName,
//     email: user.email,
//     role: user.role,
//     organizationId: user.organizationId,
//     accountStatus: user.accountStatus,
//     mustChangePassword: user.mustChangePassword,
//   };
// };

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId)
    .select("_id email role accountStatus mustChangePassword employeeId")
    .populate({
      path: "employeeId",
      select: "firstName lastName employeeCode profilePicture",
    })
    .lean();

  if (!user) {
    const error = new Error("Authenticated user not found.");

    error.statusCode = 401;

    throw error;
  }

  return {
    id: user._id,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    mustChangePassword: user.mustChangePassword,

    employee: user.employeeId
      ? {
          id: user.employeeId._id,
          firstName: user.employeeId.firstName,
          lastName: user.employeeId.lastName,
          employeeCode: user.employeeId.employeeCode,
          profilePicture: user.employeeId.profilePicture || null,
        }
      : null,
  };
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User not found.");

    error.statusCode = 404;

    throw error;
  }

  if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    const error = new Error("Your account is not active.");

    error.statusCode = 403;

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
      "New password must be different from your current password.",
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
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
};

const forgotPassword = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  /*
   * Do not reveal whether the email exists.
   */
  if (!user) {
    return;
  }

  /*
   * Deactivated accounts cannot reset password.
   */
  if (user.accountStatus === ACCOUNT_STATUS.DEACTIVATED) {
    return;
  }

  /*
   * Generate reset token.
   */
  const resetToken = uuidv4();

  /*
   * Store token and expiration.
   */
  user.passwordResetToken = resetToken;

  user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await user.save();

  /*
   * Create frontend reset URL.
   */
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  /*
   * Send reset email.
   */
  await sendPasswordResetEmail({
    email: user.email,
    resetLink,
  });
};

const resetPassword = async (resetToken, newPassword) => {
  const user = await User.findOne({
    passwordResetToken: resetToken,
    passwordResetExpiresAt: {
      $gt: new Date(),
    },
  }).select("+password");

  /*
   * Invalid or expired token.
   */
  if (!user) {
    const error = new Error("Invalid or expired password reset token.");

    error.statusCode = 400;

    throw error;
  }

  /*
   * Deactivated accounts cannot reset password.
   */
  if (user.accountStatus === ACCOUNT_STATUS.DEACTIVATED) {
    const error = new Error("Your account has been deactivated.");

    error.statusCode = 403;

    throw error;
  }

  /*
   * Prevent using the same password.
   */
  const isSamePassword = await bcrypt.compare(newPassword, user.password);

  if (isSamePassword) {
    const error = new Error(
      "New password must be different from your current password.",
    );

    error.statusCode = 400;

    throw error;
  }

  /*
   * Hash new password.
   */
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  user.password = hashedPassword;

  /*
   * Reset mustChangePassword flag.
   */
  user.mustChangePassword = false;

  /*
   * Consume reset token.
   */
  user.passwordResetToken = null;
  user.passwordResetExpiresAt = null;

  await user.save();

  return {
    id: user._id,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
};

module.exports = {
  registerOrganization,
  loginUser,
  getCurrentUser,
  forgotPassword,
  changePassword,
  resetPassword,
};
