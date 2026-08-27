const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPassword = (password) => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
};

const validateOrganizationRegistration = (data) => {
  const {
    organizationName,
    organizationCode,
    organizationEmail,
    organizationType,
    industry,

    addressLine1,
    country,
    state,
    city,
    pincode,

    employeeCount,
    organizationSize,
    workingDays,
    timezone,
    currency,

    firstName,
    lastName,
    adminEmail,
    password,
    confirmPassword,

    termsAccepted,
    informationConfirmed,
  } = data;

  const errors = {};

  if (!organizationName?.trim()) {
    errors.organizationName = "Organization name is required";
  }

  if (!organizationCode?.trim()) {
    errors.organizationCode = "Organization code is required";
  }

  if (!organizationEmail?.trim()) {
    errors.organizationEmail = "Organization email is required";
  } else if (!isValidEmail(organizationEmail)) {
    errors.organizationEmail = "Please provide a valid organization email";
  }

  if (!organizationType?.trim()) {
    errors.organizationType = "Organization type is required";
  }

  if (!industry?.trim()) {
    errors.industry = "Industry is required";
  }

  if (!addressLine1?.trim()) {
    errors.addressLine1 = "Address is required";
  }

  if (!country?.trim()) {
    errors.country = "Country is required";
  }

  if (!state?.trim()) {
    errors.state = "State is required";
  }

  if (!city?.trim()) {
    errors.city = "City is required";
  }

  if (!pincode?.trim()) {
    errors.pincode = "Pincode is required";
  }

  const parsedEmployeeCount = Number(employeeCount);

  if (!Number.isInteger(parsedEmployeeCount) || parsedEmployeeCount < 1) {
    errors.employeeCount = "Employee count must be at least 1";
  }

  if (!organizationSize?.trim()) {
    errors.organizationSize = "Organization size is required";
  }

  if (!Array.isArray(workingDays) || workingDays.length === 0) {
    errors.workingDays = "Please select at least one working day";
  }

  if (!timezone?.trim()) {
    errors.timezone = "Time zone is required";
  }

  if (!currency?.trim()) {
    errors.currency = "Currency is required";
  }

  if (!firstName?.trim()) {
    errors.firstName = "First name is required";
  }

  if (!lastName?.trim()) {
    errors.lastName = "Last name is required";
  }

  if (!adminEmail?.trim()) {
    errors.adminEmail = "Admin email is required";
  } else if (!isValidEmail(adminEmail)) {
    errors.adminEmail = "Please provide a valid admin email";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (!isValidPassword(password)) {
    errors.password =
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  if (!termsAccepted) {
    errors.termsAccepted = "Terms & Conditions must be accepted";
  }

  if (!informationConfirmed) {
    errors.informationConfirmed =
      "Please confirm that the information is accurate";
  }

  return errors;
};

const validateLogin = (data) => {
  const { email, password } = data;

  const errors = {};

  if (!email?.trim()) {
    errors.email = "Email is required";
  } else if (!isValidEmail(email)) {
    errors.email = "Please provide a valid email";
  }

  if (!password) {
    errors.password = "Password is required";
  }

  return errors;
};

module.exports = {
  validateOrganizationRegistration,
  validateLogin,
};
