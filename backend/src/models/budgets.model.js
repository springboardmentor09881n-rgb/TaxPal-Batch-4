const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    category: {
        type: String,
        required: true,
    },
    budget_amount: {
        type: Number,
        required: true,
    },
    month: {
        type: String, // e.g., 'May, 2025' or '2025-05'
        required: true,
    },
    description: {
        type: String,
    },
},
{ timestamps: true }
);

budgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);