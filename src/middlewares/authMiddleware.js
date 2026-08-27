const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = {
      userId: decodedToken.userId,
      organizationId: decodedToken.organizationId,
      role: decodedToken.role,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
};

module.exports = {
  authenticateUser,
};