const {
  getMyProfile,
  updateMyProfile,
} = require("../services/profileService");

const getMyProfileController = async (
  req,
  res,
) => {
  const {
    userId,
    organizationId,
  } = req.user;

  const profile =
    await getMyProfile(
      userId,
      organizationId,
    );

  return res.status(200).json({
    success: true,
    data: {
      profile,
    },
  });
};

const updateMyProfileController =
  async (req, res) => {
    const {
      userId,
      organizationId,
    } = req.user;

    const profile =
      await updateMyProfile(
        userId,
        organizationId,
        req.body,
        req.file,
      );

    return res.status(200).json({
      success: true,
      message:
        "Profile updated successfully.",
      data: {
        profile,
      },
    });
  };

module.exports = {
  getMyProfileController,
  updateMyProfileController,
};