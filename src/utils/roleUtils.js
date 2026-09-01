const { ROLES } = require("../constants/roles");

const ROLE_ASSIGNMENT_RULES = Object.freeze({
  [ROLES.ADMIN]: [ROLES.HR, ROLES.MANAGER, ROLES.EMPLOYEE],

  [ROLES.HR]: [ROLES.MANAGER, ROLES.EMPLOYEE],

  [ROLES.MANAGER]: [ROLES.EMPLOYEE],

  [ROLES.EMPLOYEE]: [],
});

const canAssignRole = (currentUserRole, requestedRole) => {
  return (
    ROLE_ASSIGNMENT_RULES[currentUserRole]?.includes(requestedRole) ?? false
  );
};

module.exports = {
  canAssignRole,
};
