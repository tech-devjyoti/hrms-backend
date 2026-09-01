const { ASSIGNABLE_ROLES } = require("../constants/roles");

const validateCreateEmployee = (data) => {
  const errors = {};

  if (!data.employeeCode?.trim()) {
    errors.employeeCode = "Employee code is required.";
  }

  if (!data.firstName?.trim()) {
    errors.firstName = "First name is required.";
  }

  if (!data.lastName?.trim()) {
    errors.lastName = "Last name is required.";
  }

  if (!data.email?.trim()) {
    errors.email = "Email is required.";
  }

  if (!data.dateOfJoining) {
    errors.dateOfJoining = "Date of joining is required.";
  }

  if (!data.employmentType) {
    errors.employmentType = "Employment type is required.";
  }

  if (!data.designation?.trim()) {
    errors.designation = "Designation is required.";
  }

  if (!data.department?.trim()) {
    errors.department = "Department is required.";
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (data.gender && !["MALE", "FEMALE", "OTHER"].includes(data.gender)) {
    errors.gender = "Invalid gender.";
  }

  if (
    data.employmentType &&
    !["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"].includes(
      data.employmentType,
    )
  ) {
    errors.employmentType = "Invalid employment type.";
  }

  if (
    data.dateOfJoining &&
    Number.isNaN(new Date(data.dateOfJoining).getTime())
  ) {
    errors.dateOfJoining = "Please provide a valid date of joining.";
  }

  if (!data.role) {
    errors.role = "Employee role is required.";
  } else if (!ASSIGNABLE_ROLES.includes(data.role)) {
    errors.role = "You are not authorized to assign this role.";
  }

  return errors;
};

const validateUpdateEmployee = (data) => {
  const errors = {};

  if (
    data.firstName !== undefined &&
    !data.firstName.trim()
  ) {
    errors.firstName =
      "First name cannot be empty.";
  }

  if (
    data.lastName !== undefined &&
    !data.lastName.trim()
  ) {
    errors.lastName =
      "Last name cannot be empty.";
  }

  if (
    data.email !== undefined &&
    !data.email.trim()
  ) {
    errors.email =
      "Email cannot be empty.";
  }

  if (
    data.phone !== undefined &&
    data.phone !== null &&
    !data.phone.trim()
  ) {
    errors.phone =
      "Phone cannot be empty.";
  }

  if (
    data.dateOfJoining !== undefined &&
    !data.dateOfJoining
  ) {
    errors.dateOfJoining =
      "Date of joining cannot be empty.";
  }

  if (
    data.employmentType !== undefined &&
    ![
      "FULL_TIME",
      "PART_TIME",
      "CONTRACT",
      "INTERN",
    ].includes(data.employmentType)
  ) {
    errors.employmentType =
      "Invalid employment type.";
  }

  if (
    data.designation !== undefined &&
    !data.designation.trim()
  ) {
    errors.designation =
      "Designation cannot be empty.";
  }

  if (
    data.department !== undefined &&
    !data.department.trim()
  ) {
    errors.department =
      "Department cannot be empty.";
  }

  if (
    data.gender !== undefined &&
    ![
      "MALE",
      "FEMALE",
      "OTHER",
    ].includes(data.gender)
  ) {
    errors.gender = "Invalid gender.";
  }

  return errors;
};

const UPDATE_EMPLOYEE_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "dateOfBirth",
  "gender",
  "dateOfJoining",
  "employmentType",
  "designation",
  "department",
  "address",
];

const validateUpdateEmployeeFields = (data) => {
  const errors = {};

  Object.keys(data).forEach((field) => {
    if (!UPDATE_EMPLOYEE_FIELDS.includes(field)) {
      errors[field] =
        "This field cannot be updated using this endpoint.";
    }
  });

  return errors;
};


module.exports = {
  validateCreateEmployee,
  validateUpdateEmployee,
  validateUpdateEmployeeFields,
};
