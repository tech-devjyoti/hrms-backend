const bcrypt = require("bcrypt");

const Organization = require("../models/Organization");
const User = require("../models/User");

const { generateAccessToken } = require("../utils/authUtils");

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

      [user] = await User.create(
        [
          {
            organizationId: organization._id,

            firstName: firstName.trim(),

            lastName: lastName.trim(),

            email: normalizedAdminEmail,

            password: hashedPassword,

            role: "ADMIN",

            isActive: true,
          },
        ],
        { session },
      );
    });

    const token = generateAccessToken(user);

    return {
      token,

      organization: {
        id: organization._id,
        organizationName: organization.organizationName,
        organizationCode: organization.organizationCode,
      },

      user: {
        id: user._id,
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
  });

  if (!user) {
    throw createError("Invalid email or password.", 401);
  }

  if (!user.isActive) {
    throw createError("Your account is inactive.", 403);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw createError("Invalid email or password.", 401);
  }

  const token = generateAccessToken(user);

  return {
    token,

    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    },
  };
};

// GET CURRENT USER PROFILE
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw createError("User not found.", 404);
  }

  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    isActive: user.isActive,
  };
};

module.exports = {
  registerOrganization,
  loginUser,
  getCurrentUser,
};
