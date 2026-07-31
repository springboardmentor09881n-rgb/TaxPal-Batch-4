const TaxEstimate = require('../models/taxEstimates.model');
const Alert = require('../models/alerts.model');

// Helper to calculate tax based on simple US 2024 Single Filer slabs
const calculateTax = (taxableIncome, filingStatus) => {
    let tax = 0;
    if (taxableIncome <= 0) return 0;
    
    // Using single filer brackets as default for demonstration
    const brackets = [
        { rate: 0.10, limit: 11600 },
        { rate: 0.12, limit: 47150 },
        { rate: 0.22, limit: 100525 },
        { rate: 0.24, limit: 191950 },
        { rate: 0.32, limit: 243725 },
        { rate: 0.35, limit: 609350 },
        { rate: 0.37, limit: Infinity }
    ];

    let previousLimit = 0;
    for (const bracket of brackets) {
        if (taxableIncome > previousLimit) {
            const amountInBracket = Math.min(taxableIncome - previousLimit, bracket.limit - previousLimit);
            tax += amountInBracket * bracket.rate;
            previousLimit = bracket.limit;
        } else {
            break;
        }
    }
    
    return tax;
};

// Calculate and save tax estimate
exports.calculateTaxEstimate = async (req, res) => {
    try {
        const {
            country,
            state,
            quarter,
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
        
        // Calculate tax based on slabs
        const estimatedTax = calculateTax(taxableIncome, filingStatus);
        
        // Determine Due Date based on Quarter
        const currentYear = new Date().getFullYear();
        let dueDate;
        let reminderDate;
        
        switch(quarter) {
            case 'Q1': 
                dueDate = new Date(currentYear, 3, 15); // April 15
                reminderDate = new Date(currentYear, 3, 1); // April 1
                break;
            case 'Q2':
                dueDate = new Date(currentYear, 5, 15); // June 15
                reminderDate = new Date(currentYear, 5, 1); // June 1
                break;
            case 'Q3':
                dueDate = new Date(currentYear, 8, 15); // Sept 15
                reminderDate = new Date(currentYear, 8, 1); // Sept 1
                break;
            case 'Q4':
                dueDate = new Date(currentYear + 1, 0, 15); // Jan 15 next year
                reminderDate = new Date(currentYear + 1, 0, 1); // Jan 1 next year
                break;
            default:
                dueDate = new Date();
                reminderDate = new Date();
        }

        // Upsert Tax Estimate
        const taxEstimate = await TaxEstimate.findOneAndUpdate(
            { userId, quarter, country },
            {
                userId,
                country,
                state,
                quarter,
                filingStatus,
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
        
        // Schedule Alert
        await Alert.findOneAndUpdate(
            { userId, type: "TAX_DUE", message: { $regex: quarter } },
            {
                userId,
                type: "TAX_DUE",
                message: `Reminder: ${quarter} Estimated Tax Payment`,
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
            calendarEvents.push({
                type: 'payment',
                title: `${est.quarter} Estimated Tax Payment`,
                description: `Estimated tax payment due. Amount: $${est.estimatedTax.toFixed(2)}`,
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
        
    } catch(error) {
        console.error("Error fetching tax calendar:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
