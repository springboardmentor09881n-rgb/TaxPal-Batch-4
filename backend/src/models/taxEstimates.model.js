const mongoose = require("mongoose");

const taxEstimateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    country: {
        type: String,
        required: true,
    },
    quarter: {
        type: String,
        enum: {
            values: ["Q1", "Q2", "Q3", "Q4"],
            message: "Quarter can only be Q1, Q2, Q3 and Q4",
        },
        required: true,
    },
    estimatedTax: {
        type: Number,
        min: 0,
        required: true,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    filingStatus: {
        type: String,
        enum: {
            values: ["SINGLE", "MARRIED_FILING_JOINTLY", "MARRIED_FILING_SEPARATELY", "HEAD_OF_HOUSEHOLD", "FIRM"],
            message: "Filing status can only be SINGLE, MARRIED_FILING_JOINTLY, MARRIED_FILING_SEPARATELY, HEAD_OF_HOUSEHOLD, FIRM",
        },
        default: "SINGLE",
    },
    grossIncomeForQuarter: {
        type: Number,
        min: 0,
        default: 0,
        required: true,
    },
    businessExpenses: {
        type: Number,
        min: 0,
        default: 0,
        required: true,
    },
    retirementContributions: {
        type: Number,
        min: 0,
        default: 0,
        required: true,
    },
    healthInsurancePremiums: {
        type: Number,
        min: 0,
        default: 0,
        required: true,
    },
    homeOfficeDeductions: {
        type: Number,
        min: 0,
        default: 0,
        required: true,
    }
}, { timestamps: true }
);

taxEstimateSchema.index({ userId: 1, quarter: 1, dueDate: 1 }, { unique: true });

module.exports = mongoose.model("taxEstimates", taxEstimateSchema);