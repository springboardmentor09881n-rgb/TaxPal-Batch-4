const mongoose = require('mongoose');
const SuggestedCategory = require('../models/SuggestedCategory.model');
require('dotenv').config();

const seedSuggestedCategories = async () => {
  try {
    const count = await SuggestedCategory.countDocuments();
    if (count === 0) {
      const defaults = [
        { name: 'Office Rent', type: 'expense', description: 'rent, office, hotdesk, coworking, lease, desk, workspace' },
        { name: 'Business Expenses', type: 'expense', description: 'aws, server, hosting, cloud, azure, database, domain, ssl' },
        { name: 'Utilities', type: 'expense', description: 'electricity, water, wifi, internet, broadband, phone, mobile, phone bill' },
        { name: 'Food', type: 'expense', description: 'food, restaurant, lunch, dinner, breakfast, meal, cafe, starbucks, swiggy, zomato' },
        { name: 'Software Subscriptions', type: 'expense', description: 'github, slack, zoom, figma, copilot, openai, adobe, canva, subscriptions, software' },
        { name: 'Professional Development', type: 'expense', description: 'course, book, udemy, training, ebook, tutorial, certification' },
        { name: 'Marketing', type: 'expense', description: 'ads, marketing, facebook ads, google ads, promotion, sponsor, flyer, campaign' },
        { name: 'Travel', type: 'expense', description: 'ola, uber, taxi, cab, flight, train, travel, hotel, stay, petrol, diesel' },
        { name: 'Meals & Entertainment', type: 'expense', description: 'client dinner, movie, client lunch, cafe, party, event' },
        { name: 'Other', type: 'expense', description: 'other, miscellaneous, general' },
        { name: 'Consulting', type: 'income', description: 'consulting, consult, advise, advice, session' },
        { name: 'Design Project', type: 'income', description: 'design, logo, mockup, wireframe, frontend, landing page' },
        { name: 'SaaS Subscriptions', type: 'income', description: 'saas, subscriptions, stripe, customer payout' },
        { name: 'Ad Revenue', type: 'income', description: 'ad, adsense, youtube, sponsorship, sponsor payout' },
        { name: 'Other', type: 'income', description: 'other, gift, transfer' }
      ];
      await SuggestedCategory.insertMany(defaults);
      console.log('Seeded default suggested categories in DB');
    }
  } catch (err) {
    console.error('Failed to seed suggested categories:', err);
  }
};

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    await mongoose.connect(mongoURI);
    
    console.log('Connected to MongoDB via Mongoose');
    await seedSuggestedCategories();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
