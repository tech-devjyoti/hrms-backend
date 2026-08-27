const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      organizationId: user.organizationId,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

module.exports = {
  generateAccessToken,
};