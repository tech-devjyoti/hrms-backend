const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    organizationName: {
      type: String,
      required: true,
      trim: true,
    },

    organizationCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },

    organizationEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    organizationPhone: {
      type: String,
      trim: true,
    },

    organizationType: {
      type: String,
      required: true,
      trim: true,
    },

    industry: {
      type: String,
      required: true,
      trim: true,
    },

    website: {
      type: String,
      trim: true,
    },

    address: {
      addressLine1: {
        type: String,
        required: true,
        trim: true,
      },

      addressLine2: {
        type: String,
        trim: true,
      },

      country: {
        type: String,
        required: true,
        trim: true,
      },

      state: {
        type: String,
        required: true,
        trim: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      pincode: {
        type: String,
        required: true,
        trim: true,
      },
    },

    settings: {
      employeeCount: {
        type: Number,
        required: true,
        min: 1,
      },

      organizationSize: {
        type: String,
        required: true,
        trim: true,
      },

      foundedYear: {
        type: Number,
      },

      workingDays: {
        type: [String],
        required: true,
      },

      timezone: {
        type: String,
        required: true,
        trim: true,
      },

      currency: {
        type: String,
        required: true,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Organization",
  organizationSchema
);