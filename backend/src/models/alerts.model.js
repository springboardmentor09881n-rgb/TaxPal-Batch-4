const mongoose = require("mongoose");

const alertsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ["BUDGET_EXCEEDED", "TAX_DUE", "LARGE_TRANSACTION", "SYSTEM"],
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    alertDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

alertsSchema.index({ userId: 1, isRead: 1, alertDate: -1 });

module.exports = mongoose.model("Alert", alertsSchema);