const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    employeeCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    dateOfBirth: {
      type: Date,
    },

    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
    },

    employment: {
      dateOfJoining: {
        type: Date,
        required: true,
      },

      employmentType: {
        type: String,
        enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"],
        required: true,
      },

      designation: {
        type: String,
        trim: true,
        required: true,
        maxlength: 100,
      },

      department: {
        type: String,
        trim: true,
        required: true,
        maxlength: 100,
      },

      status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE",
      },
    },

    address: {
      addressLine1: {
        type: String,
        trim: true,
        maxlength: 200,
      },

      addressLine2: {
        type: String,
        trim: true,
        maxlength: 200,
      },

      country: {
        type: String,
        trim: true,
        maxlength: 100,
      },

      state: {
        type: String,
        trim: true,
        maxlength: 100,
      },

      city: {
        type: String,
        trim: true,
        maxlength: 100,
      },

      pincode: {
        type: String,
        trim: true,
        maxlength: 20,
      },
    },

    profilePicture: {
      url: {
        type: String,
        default: null,
      },

      publicId: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  },
);

employeeSchema.index(
  {
    organizationId: 1,
    employeeCode: 1,
  },
  {
    unique: true,
  },
);

employeeSchema.index(
  {
    organizationId: 1,
    email: 1,
  },
  {
    unique: true,
  },
);

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
