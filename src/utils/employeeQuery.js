const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const buildEmployeeQuery = (queryParams) => {
  const {
    search,
    status,
    department,
    employmentType,
    role,
  } = queryParams;

  const query = {};

  if (search?.trim()) {
    const searchValue = search.trim();

    query.$or = [
      {
        employeeCode: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        firstName: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        lastName: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        email: {
          $regex: searchValue,
          $options: "i",
        },
      },
    ];
  }

  if (status) {
    query["employment.status"] = status;
  }

  if (department?.trim()) {
    query["employment.department"] =
      department.trim();
  }

  if (employmentType) {
    query["employment.employmentType"] =
      employmentType;
  }

  return query;
};

const getPagination = (queryParams) => {
  const page = Math.max(
    Number(queryParams.page) || DEFAULT_PAGE,
    1
  );

  const requestedLimit =
    Number(queryParams.limit) || DEFAULT_LIMIT;

  const limit = Math.min(
    Math.max(requestedLimit, 1),
    MAX_LIMIT
  );

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

module.exports = {
  buildEmployeeQuery,
  getPagination,
};