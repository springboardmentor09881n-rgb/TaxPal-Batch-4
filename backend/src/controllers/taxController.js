const TaxEstimate = require('../models/taxEstimates.model');
const Alert = require('../models/alerts.model');

const US_STATES = [
    { name: 'Alabama', rate: 0.05 }, { name: 'Alaska', rate: 0 }, { name: 'Arizona', rate: 0.025 },
    { name: 'Arkansas', rate: 0.044 }, { name: 'California', rate: 0.093 }, { name: 'Colorado', rate: 0.044 },
    { name: 'Connecticut', rate: 0.055 }, { name: 'Delaware', rate: 0.066 }, { name: 'Florida', rate: 0 },
    { name: 'Georgia', rate: 0.0539 }, { name: 'Hawaii', rate: 0.0825 }, { name: 'Idaho', rate: 0.058 },
    { name: 'Illinois', rate: 0.0495 }, { name: 'Indiana', rate: 0.0305 }, { name: 'Iowa', rate: 0.038 },
    { name: 'Kansas', rate: 0.052 }, { name: 'Kentucky', rate: 0.04 }, { name: 'Louisiana', rate: 0.0425 },
    { name: 'Maine', rate: 0.0715 }, { name: 'Maryland', rate: 0.0575 }, { name: 'Massachusetts', rate: 0.05 },
    { name: 'Michigan', rate: 0.0425 }, { name: 'Minnesota', rate: 0.0785 }, { name: 'Mississippi', rate: 0.047 },
    { name: 'Missouri', rate: 0.048 }, { name: 'Montana', rate: 0.059 }, { name: 'Nebraska', rate: 0.052 },
    { name: 'Nevada', rate: 0 }, { name: 'New Hampshire', rate: 0 }, { name: 'New Jersey', rate: 0.0637 },
    { name: 'New Mexico', rate: 0.049 }, { name: 'New York', rate: 0.0685 }, { name: 'North Carolina', rate: 0.0425 },
    { name: 'North Dakota', rate: 0.025 }, { name: 'Ohio', rate: 0.035 }, { name: 'Oklahoma', rate: 0.0475 },
    { name: 'Oregon', rate: 0.0875 }, { name: 'Pennsylvania', rate: 0.0307 }, { name: 'Rhode Island', rate: 0.0599 },
    { name: 'South Carolina', rate: 0.062 }, { name: 'South Dakota', rate: 0 }, { name: 'Tennessee', rate: 0 },
    { name: 'Texas', rate: 0 }, { name: 'Utah', rate: 0.0455 }, { name: 'Vermont', rate: 0.066 },
    { name: 'Virginia', rate: 0.0575 }, { name: 'Washington', rate: 0 }, { name: 'West Virginia', rate: 0.0482 },
    { name: 'Wisconsin', rate: 0.053 }, { name: 'Wyoming', rate: 0 }, { name: 'District of Columbia', rate: 0.0895 }
];

const normalizeStatusKey = (status = '') => status.toUpperCase().trim().replace(/\s+/g, '_');

const US_FEDERAL_BRACKETS = {
    'SINGLE': [
        { upTo: 11925, rate: 0.10 }, { upTo: 48475, rate: 0.12 }, { upTo: 103350, rate: 0.22 },
        { upTo: 197300, rate: 0.24 }, { upTo: 250525, rate: 0.32 }, { upTo: 626350, rate: 0.35 },
        { upTo: Infinity, rate: 0.37 }
    ],
    'MARRIED_FILING_JOINTLY': [
        { upTo: 23850, rate: 0.10 }, { upTo: 96950, rate: 0.12 }, { upTo: 206700, rate: 0.22 },
        { upTo: 394600, rate: 0.24 }, { upTo: 501050, rate: 0.32 }, { upTo: 751600, rate: 0.35 },
        { upTo: Infinity, rate: 0.37 }
    ],
    'HEAD_OF_HOUSEHOLD': [
        { upTo: 17000, rate: 0.10 }, { upTo: 64850, rate: 0.12 }, { upTo: 103350, rate: 0.22 },
        { upTo: 197300, rate: 0.24 }, { upTo: 250500, rate: 0.32 }, { upTo: 626350, rate: 0.35 },
        { upTo: Infinity, rate: 0.37 }
    ],
    'MARRIED_FILING_SEPARATELY': [
        { upTo: 11925, rate: 0.10 }, { upTo: 48475, rate: 0.12 }, { upTo: 103350, rate: 0.22 },
        { upTo: 197300, rate: 0.24 }, { upTo: 250525, rate: 0.32 }, { upTo: 375800, rate: 0.35 },
        { upTo: Infinity, rate: 0.37 }
    ]
};

const INDIA_SLABS = [
    { upTo: 300000, rate: 0 },
    { upTo: 700000, rate: 0.05 },
    { upTo: 1000000, rate: 0.10 },
    { upTo: 1200000, rate: 0.15 },
    { upTo: 1500000, rate: 0.20 },
    { upTo: Infinity, rate: 0.30 }
];

const UK_BRACKETS = [
    { upTo: 12570, rate: 0 },
    { upTo: 50270, rate: 0.20 },
    { upTo: 125140, rate: 0.40 },
    { upTo: Infinity, rate: 0.45 }
];

const UK_SCOTLAND_BRACKETS = [
    { upTo: 12570, rate: 0 },
    { upTo: 14876, rate: 0.19 },
    { upTo: 26561, rate: 0.20 },
    { upTo: 43662, rate: 0.21 },
    { upTo: 75000, rate: 0.42 },
    { upTo: 125140, rate: 0.45 },
    { upTo: Infinity, rate: 0.47 }
];

const GERMANY_BRACKETS = [
    { upTo: 11604, rate: 0 },
    { upTo: 17005, rate: 0.14 },
    { upTo: 66760, rate: 0.24 },
    { upTo: 277825, rate: 0.42 },
    { upTo: Infinity, rate: 0.45 }
];

const JAPAN_BRACKETS = [
    { upTo: 1950000, rate: 0.05 },
    { upTo: 3300000, rate: 0.10 },
    { upTo: 6950000, rate: 0.20 },
    { upTo: 9000000, rate: 0.23 },
    { upTo: 18000000, rate: 0.33 },
    { upTo: 40000000, rate: 0.40 },
    { upTo: Infinity, rate: 0.45 }
];

const CANADA_FEDERAL_BRACKETS = [
    { upTo: 55867, rate: 0.15 },
    { upTo: 111733, rate: 0.205 },
    { upTo: 173205, rate: 0.26 },
    { upTo: 246752, rate: 0.29 },
    { upTo: Infinity, rate: 0.33 }
];

const CANADA_PROVINCES = [
    { name: 'Alberta', rate: 0.10 }, { name: 'British Columbia', rate: 0.128 }, { name: 'Manitoba', rate: 0.174 },
    { name: 'New Brunswick', rate: 0.197 }, { name: 'Newfoundland and Labrador', rate: 0.218 },
    { name: 'Northwest Territories', rate: 0.1405 }, { name: 'Nova Scotia', rate: 0.21 },
    { name: 'Nunavut', rate: 0.115 }, { name: 'Ontario', rate: 0.1316 }, { name: 'Prince Edward Island', rate: 0.188 },
    { name: 'Quebec', rate: 0.2575 }, { name: 'Saskatchewan', rate: 0.145 }, { name: 'Yukon', rate: 0.128 }
];

const AUSTRALIA_BRACKETS = [
    { upTo: 18200, rate: 0 },
    { upTo: 45000, rate: 0.16 },
    { upTo: 135000, rate: 0.30 },
    { upTo: 190000, rate: 0.37 },
    { upTo: Infinity, rate: 0.45 }
];

const SINGAPORE_BRACKETS = [
    { upTo: 20000, rate: 0 },
    { upTo: 30000, rate: 0.02 },
    { upTo: 40000, rate: 0.035 },
    { upTo: 80000, rate: 0.07 },
    { upTo: 120000, rate: 0.115 },
    { upTo: 160000, rate: 0.15 },
    { upTo: 200000, rate: 0.18 },
    { upTo: 240000, rate: 0.19 },
    { upTo: 280000, rate: 0.20 },
    { upTo: 320000, rate: 0.22 },
    { upTo: Infinity, rate: 0.24 }
];

const SELF_EMPLOYMENT_TAX_RATE = 0.153;

const computeProgressiveTax = (annualIncome, brackets) => {
    if (annualIncome <= 0) return 0;
    let tax = 0;
    let lower = 0;
    for (const bracket of brackets) {
        if (annualIncome <= lower) break;
        const taxableInThisBracket = Math.min(annualIncome, bracket.upTo) - lower;
        tax += taxableInThisBracket * bracket.rate;
        lower = bracket.upTo;
        if (annualIncome <= bracket.upTo) break;
    }
    return tax;
};

// Helper to calculate tax based on country, state, filingStatus, and taxable income
const calculateTax = (taxableIncome, filingStatus, country = 'United States', state = '') => {
    if (taxableIncome <= 0) return 0;

    const annualizedNet = taxableIncome * 4;
    let federalTax = 0;
    let stateTax = 0;
    let extraTax = 0;

    const normCountry = (country || 'United States').trim();
    const isFirm = filingStatus === 'FIRM' || filingStatus === 'Firm';

    if (normCountry === 'India') {
        const annualTax = computeProgressiveTax(annualizedNet, INDIA_SLABS);
        federalTax = annualTax / 4;
        stateTax = 0;
        extraTax = federalTax * 0.04; // Health & Education Cess
    } else if (normCountry === 'United Kingdom') {
        const brackets = (state || '').toLowerCase() === 'scotland' ? UK_SCOTLAND_BRACKETS : UK_BRACKETS;
        const annualTax = isFirm ? annualizedNet * 0.25 : computeProgressiveTax(annualizedNet, brackets);
        federalTax = annualTax / 4;
        stateTax = 0;
        extraTax = isFirm ? 0 : taxableIncome * 0.06; // National Insurance
    } else if (normCountry === 'European Union' || normCountry === 'Germany') {
        const annualTax = isFirm ? annualizedNet * 0.15 : computeProgressiveTax(annualizedNet, GERMANY_BRACKETS);
        federalTax = annualTax / 4;
        stateTax = 0;
        extraTax = federalTax * 0.055; // Solidarity Surcharge
    } else if (normCountry === 'Japan') {
        const annualTax = isFirm ? annualizedNet * 0.232 : computeProgressiveTax(annualizedNet, JAPAN_BRACKETS);
        federalTax = annualTax / 4;
        stateTax = taxableIncome * 0.10; // Inhabitant Tax
        extraTax = isFirm ? 0 : taxableIncome * 0.05; // Enterprise Tax
    } else if (normCountry === 'Canada') {
        const annualTax = isFirm ? annualizedNet * 0.15 : computeProgressiveTax(annualizedNet, CANADA_FEDERAL_BRACKETS);
        federalTax = annualTax / 4;
        const stateObj = CANADA_PROVINCES.find(s => s.name.toLowerCase() === (state || '').toLowerCase());
        stateTax = taxableIncome * (stateObj ? stateObj.rate : 0.13);
        extraTax = isFirm ? 0 : taxableIncome * 0.119; // CPP
    } else if (normCountry === 'Australia') {
        const annualTax = isFirm ? annualizedNet * 0.25 : computeProgressiveTax(annualizedNet, AUSTRALIA_BRACKETS);
        federalTax = annualTax / 4;
        stateTax = 0;
        extraTax = isFirm ? 0 : taxableIncome * 0.02; // Medicare Levy
    } else if (normCountry === 'Singapore') {
        const annualTax = isFirm ? annualizedNet * 0.17 : computeProgressiveTax(annualizedNet, SINGAPORE_BRACKETS);
        federalTax = annualTax / 4;
        stateTax = 0;
        extraTax = isFirm ? 0 : taxableIncome * 0.06; // Medisave Levy
    } else if (normCountry === 'United Arab Emirates' || normCountry === 'UAE') {
        federalTax = isFirm ? Math.max(0, annualizedNet - 375000) * 0.09 / 4 : 0;
        stateTax = 0;
        extraTax = 0;
    } else {
        // Default to United States
        const statusKey = normalizeStatusKey(filingStatus);
        const brackets = US_FEDERAL_BRACKETS[statusKey] || US_FEDERAL_BRACKETS['SINGLE'];
        const annualFederalTax = isFirm ? annualizedNet * 0.21 : computeProgressiveTax(annualizedNet, brackets);
        federalTax = annualFederalTax / 4;

        const stateObj = US_STATES.find(s => s.name.toLowerCase() === (state || '').toLowerCase());
        const stateRate = stateObj ? stateObj.rate : 0;
        stateTax = taxableIncome * stateRate;

        extraTax = isFirm ? 0 : taxableIncome * SELF_EMPLOYMENT_TAX_RATE;
    }

    return federalTax + stateTax + extraTax;
};

// Calculate and save tax estimate
exports.calculateTaxEstimate = async (req, res) => {
    try {
        const {
            country,
            state,
            quarter,
            year: requestYear,
            filingStatus,
            grossIncomeForQuarter,
            businessExpenses,
            retirementContributions,
            healthInsurancePremiums,
            homeOfficeDeductions
        } = req.body;

        const userId = req.user.id;

        // Calculate taxable income
        const totalDeductions = (Number(businessExpenses) || 0) +
            (Number(retirementContributions) || 0) +
            (Number(healthInsurancePremiums) || 0) +
            (Number(homeOfficeDeductions) || 0);

        const taxableIncome = Math.max(0, (Number(grossIncomeForQuarter) || 0) - totalDeductions);

        // Calculate tax based on country, state, filing status, and slabs
        const estimatedTax = calculateTax(taxableIncome, filingStatus, country, state);

        // Determine Due Date based on Quarter and Tax Year
        const taxYear = requestYear ? Number(requestYear) : new Date().getFullYear();
        let dueDate;
        let reminderDate;

        switch (quarter) {
            case 'Q1':
                dueDate = new Date(taxYear, 3, 15); // April 15 of taxYear
                reminderDate = new Date(taxYear, 3, 1); // April 1
                break;
            case 'Q2':
                dueDate = new Date(taxYear, 5, 15); // June 15 of taxYear
                reminderDate = new Date(taxYear, 5, 1); // June 1
                break;
            case 'Q3':
                dueDate = new Date(taxYear, 8, 15); // Sept 15 of taxYear
                reminderDate = new Date(taxYear, 8, 1); // Sept 1
                break;
            case 'Q4':
                dueDate = new Date(taxYear + 1, 0, 15); // Jan 15 of taxYear + 1
                reminderDate = new Date(taxYear + 1, 0, 1); // Jan 1 of taxYear + 1
                break;
            default:
                dueDate = new Date();
                reminderDate = new Date();
        }

        // Update existing estimate if explicit ID is provided, else upsert matching compound index { userId, quarter, dueDate }
        let taxEstimate;
        if (req.body.id || req.body._id) {
            const targetId = req.body.id || req.body._id;
            taxEstimate = await TaxEstimate.findOneAndUpdate(
                { _id: targetId, userId },
                {
                    userId,
                    country,
                    state,
                    quarter,
                    filingStatus: filingStatus || 'SINGLE',
                    grossIncomeForQuarter: Number(grossIncomeForQuarter) || 0,
                    businessExpenses: Number(businessExpenses) || 0,
                    retirementContributions: Number(retirementContributions) || 0,
                    healthInsurancePremiums: Number(healthInsurancePremiums) || 0,
                    homeOfficeDeductions: Number(homeOfficeDeductions) || 0,
                    estimatedTax,
                    dueDate
                },
                { new: true, runValidators: true }
            );
        }

        if (!taxEstimate) {
            taxEstimate = await TaxEstimate.findOneAndUpdate(
                { userId, quarter, dueDate },
                {
                    userId,
                    country,
                    state,
                    quarter,
                    filingStatus: filingStatus || 'SINGLE',
                    grossIncomeForQuarter: Number(grossIncomeForQuarter) || 0,
                    businessExpenses: Number(businessExpenses) || 0,
                    retirementContributions: Number(retirementContributions) || 0,
                    healthInsurancePremiums: Number(healthInsurancePremiums) || 0,
                    homeOfficeDeductions: Number(homeOfficeDeductions) || 0,
                    estimatedTax,
                    dueDate
                },
                { new: true, upsert: true, runValidators: true }
            );
        }

        // Schedule Alert with specific tax year message to avoid multi-year collisions
        const alertMessage = `Reminder: ${quarter} ${taxYear} Estimated Tax Payment`;
        await Alert.findOneAndUpdate(
            { userId, type: "TAX_DUE", message: alertMessage },
            {
                userId,
                type: "TAX_DUE",
                message: alertMessage,
                alertDate: reminderDate
            },
            { upsert: true }
        );

        res.status(200).json({
            success: true,
            data: taxEstimate
        });

    } catch (error) {
        console.error("Error calculating tax estimate:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.getTaxEstimates = async (req, res) => {
    try {
        const userId = req.user.id;
        const estimates = await TaxEstimate.find({ userId }).sort({ dueDate: 1 });
        res.status(200).json({ success: true, data: estimates });
    } catch (error) {
        console.error("Error fetching tax estimates:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.getTaxCalendar = async (req, res) => {
    try {
        const userId = req.user.id;
        // Fetch both estimates and alerts for the calendar view
        const estimates = await TaxEstimate.find({ userId });
        const alerts = await Alert.find({ userId, type: "TAX_DUE" });

        // Format for frontend consumption
        const calendarEvents = [];

        estimates.forEach(est => {
            const symbol = est.country === 'India' ? '₹' : '$';
            calendarEvents.push({
                type: 'payment',
                title: `${est.quarter} Estimated Tax Payment`,
                description: `Estimated tax payment due. Amount: ${symbol}${est.estimatedTax.toFixed(2)}`,
                date: est.dueDate,
                quarter: est.quarter
            });
        });

        alerts.forEach(alert => {
            calendarEvents.push({
                type: 'reminder',
                title: alert.message,
                date: alert.alertDate,
                isRead: alert.isRead
            });
        });

        // Sort by date ascending
        calendarEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.status(200).json({ success: true, data: calendarEvents });

    } catch (error) {
        console.error("Error fetching tax calendar:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.deleteTaxEstimate = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const deleted = await TaxEstimate.findOneAndDelete({ _id: id, userId });
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Tax estimate not found" });
        }
        res.status(200).json({ success: true, message: "Tax estimate deleted successfully" });
    } catch (error) {
        console.error("Error deleting tax estimate:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

