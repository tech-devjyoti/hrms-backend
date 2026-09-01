const validateChangePassword = (data) => {
  const errors = {};

  const { currentPassword, newPassword, confirmPassword } = data;

  if (!currentPassword) {
    errors.currentPassword = "Current password is required.";
  }

  if (!newPassword) {
    errors.newPassword = "New password is required.";
  } else {
    if (newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters.";
    }

    if (!/[A-Z]/.test(newPassword)) {
      errors.newPassword =
        "Password must contain at least one uppercase letter.";
    }

    if (!/[a-z]/.test(newPassword)) {
      errors.newPassword =
        "Password must contain at least one lowercase letter.";
    }

    if (!/[0-9]/.test(newPassword)) {
      errors.newPassword = "Password must contain at least one number.";
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      errors.newPassword =
        "Password must contain at least one special character.";
    }
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your new password.";
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
};

const validateNewPassword = (password) => {
  const errors = {};

  if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(password)) {
    errors.password = "Password must contain at least one uppercase letter.";
  }

  if (!/[a-z]/.test(password)) {
    errors.password = "Password must contain at least one lowercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    errors.password = "Password must contain at least one number.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.password = "Password must contain at least one special character.";
  }

  return errors;
};

module.exports = {
  validateChangePassword,
  validateNewPassword,
};
