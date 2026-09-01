const Employee = require("../models/Employee");

const User = require("../models/User");

const {
  uploadProfilePicture,
  deleteProfilePicture,
} = require("../utils/cloudinaryUtils");

const getMyProfile = async (userId, organizationId) => {
  const user = await User.findOne({
    _id: userId,
    organizationId,
  })
    .select("_id email role accountStatus employeeId")
    .lean();

  if (!user) {
    const error = new Error("User not found.");

    error.statusCode = 404;

    throw error;
  }

  const employee = await Employee.findOne({
    _id: user.employeeId,
    organizationId,
  }).lean();

  if (!employee) {
    const error = new Error("Employee profile not found.");

    error.statusCode = 404;

    throw error;
  }

  return {
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
    },

    employee,
  };
};

const updateMyProfile = async (userId, organizationId, data, file) => {
  const user = await User.findOne({
    _id: userId,
    organizationId,
  });

  if (!user) {
    const error = new Error("User not found.");

    error.statusCode = 404;

    throw error;
  }

  const employee = await Employee.findOne({
    _id: user.employeeId,
    organizationId,
  });

  if (!employee) {
    const error = new Error("Employee profile not found.");

    error.statusCode = 404;

    throw error;
  }

  if (user.accountStatus !== "ACTIVE") {
    const error = new Error("Your account is not active.");

    error.statusCode = 403;

    throw error;
  }

  const { firstName, lastName, phone, dateOfBirth, gender } = data;

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

  /*
   * Profile picture
   */
  if (file) {
    const oldPublicId = employee.profilePicture?.publicId;

    const uploadedImage = await uploadProfilePicture(file.buffer);

    employee.profilePicture = {
      url: uploadedImage.url,
      publicId: uploadedImage.publicId,
    };

    /*
     * Delete old Cloudinary image
     * only after the new image has
     * been successfully uploaded.
     */
    if (oldPublicId) {
      await deleteProfilePicture(oldPublicId);
    }
  }

  await employee.save();

  return {
    id: employee._id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    dateOfBirth: employee.dateOfBirth,
    gender: employee.gender,
    profilePicture: employee.profilePicture,
    employment: employee.employment,
    address: employee.address,
  };
};

module.exports = {
  getMyProfile,
  updateMyProfile,
};
