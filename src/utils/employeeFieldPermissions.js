const EMPLOYMENT_FIELDS = [
  "dateOfJoining",
  "employmentType",
  "designation",
  "department",
];

const canModifyEmployeeField = ({ requestingRole, isSelf, field }) => {
  // ---------------------------------------------
  // ADMIN
  // ---------------------------------------------
  // ADMIN can modify everything,
  // including their own information.
  if (requestingRole === "ADMIN") {
    return true;
  }

  // ---------------------------------------------
  // HR
  // ---------------------------------------------
  // HR can modify everything for other employees.
  // HR cannot modify their own employment information.
  if (requestingRole === "HR") {
    if (isSelf) {
      return !EMPLOYMENT_FIELDS.includes(field);
    }

    return true;
  }

  // ---------------------------------------------
  // MANAGER
  // ---------------------------------------------
  // Manager cannot modify employment information.
  if (requestingRole === "MANAGER") {
    return !EMPLOYMENT_FIELDS.includes(field);
  }

  // ---------------------------------------------
  // EMPLOYEE
  // ---------------------------------------------
  // Employee cannot modify employment information.
  if (requestingRole === "EMPLOYEE") {
    return !EMPLOYMENT_FIELDS.includes(field);
  }

  // ---------------------------------------------
  // Unknown role
  // ---------------------------------------------
  return false;
};

const getUnauthorizedFields = ({ requestingRole, isSelf, data }) => {
  return Object.keys(data).filter(
    (field) =>
      !canModifyEmployeeField({
        requestingRole,
        isSelf,
        field,
      }),
  );
};

module.exports = {
  EMPLOYMENT_FIELDS,
  canModifyEmployeeField,
  getUnauthorizedFields,
};
