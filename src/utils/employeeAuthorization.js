const User = require("../models/User");

const getRequestingUser = async (
  requestingUserId,
  organizationId,
  session = null,
) => {
  let query = User.findOne({
    _id: requestingUserId,
    organizationId,
  }).select("_id employeeId role accountStatus");

  if (session) {
    query = query.session(session);
  }

  const user = await query.lean();

  if (!user) {
    const error = new Error("Authenticated user not found.");

    error.statusCode = 401;

    throw error;
  }

  return user;
};

module.exports = {
  getRequestingUser,
};
