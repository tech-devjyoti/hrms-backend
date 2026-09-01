const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {

  console.log(user,"SSSSSSSSSSSSSSSSSSSSSDDDDDDDDDDDDDDDDDDDDDDD")
  return jwt.sign(
    {
       userId:user.userId, 
       employeeId:user.employeeId,
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