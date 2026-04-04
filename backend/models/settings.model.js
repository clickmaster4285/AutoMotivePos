const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },

  

  logo: {
    type: String   // store URL or file path
  },

  tax: {
    type: Number,
    default: 0
  },

  currency: {
    type: String,
    default: "USD"
  },
  currencySymbol: {
    type: String,
    default: "$"
  },

  language: {
    type: String,
    default: "en"
  },

  timezone: {
    type: String,
    default: "UTC"
  },

  address: {
    type: String
  },
  phone: {type: String},

  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true
    },

    smsNotifications: {
      type: Boolean,
      default: false
    },

    salesAlerts: {
      type: Boolean,
      default: true
    },

    inventoryAlerts: {
      type: Boolean,
      default: true
    },

    systemUpdates: {
      type: Boolean,
      default: true
    },

    dailyReports: {
      type: Boolean,
      default: false
    },

    weeklyReports: {
      type: Boolean,
      default: false
    }
  }


}, { timestamps: true });

module.exports = mongoose.model("Settings", settingsSchema);
