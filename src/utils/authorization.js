const canManageEmployee = ({ requestingRole, targetRole }) => {
  // ADMIN can manage everyone.
  if (requestingRole === "ADMIN") {
    return true;
  }

  // Nobody except ADMIN can manage an ADMIN.
  if (targetRole === "ADMIN") {
    return false;
  }

  // HR, MANAGER and EMPLOYEE can manage
  // non-ADMIN employees.
  return true;
};

const assertCanManageEmployee = ({ requestingRole, targetRole }) => {
  const allowed = canManageEmployee({
    requestingRole,
    targetRole,
  });

  if (!allowed) {
    const error = new Error(
      "You do not have permission to perform this operation on this employee.",
    );

    error.statusCode = 403;

    throw error;
  }
};

module.exports = {
  canManageEmployee,
  assertCanManageEmployee,
};
