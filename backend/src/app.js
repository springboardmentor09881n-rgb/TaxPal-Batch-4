const express = require('express');
const cors = require('cors');

const app = express();

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');
const categoryRoutes = require('./routes/categories');
const taxRoutes = require('./routes/tax');
const reportRoutes = require('./routes/reports');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/reports', reportRoutes);

module.exports = app;