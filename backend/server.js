require('dotenv').config();

const app=require("./src/app");
const sequelize = require('./src/config/db');

const PORT = process.env.PORT || 5000;


// Database Connection & Server Start
sequelize.sync()
  .then(() => {
    console.log('Connected to MySQL via Sequelize');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MySQL connection error:', err);
  });
