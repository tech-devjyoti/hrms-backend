const ROLES = Object.freeze({
  ADMIN: "ADMIN",
  HR: "HR",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
});

const ASSIGNABLE_ROLES = Object.freeze([
  ROLES.HR,
  ROLES.MANAGER,
  ROLES.EMPLOYEE,
]);

module.exports = {
  ROLES,
  ASSIGNABLE_ROLES,
};