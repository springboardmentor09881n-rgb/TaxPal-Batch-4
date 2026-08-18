const { processChatQuery } = require('./src/controllers/chatbotController');

// Load .env
require('dotenv').config();

async function runTest() {
  const queryText = process.argv[2] || "Can you tell me about the tax estimator?";
  console.log(`Testing query: "${queryText}"`);
  console.log(`GROQ_API_KEY set: ${!!process.env.GROQ_API_KEY}`);

  const req = {
    body: {
      query: queryText,
      currentRoute: '/dashboard'
    }
  };

  const res = {
    status: function(code) {
      console.log(`[Status Code]: ${code}`);
      return this;
    },
    json: function(data) {
      console.log("[JSON Response]:", JSON.stringify(data, null, 2));
      return this;
    }
  };

  await processChatQuery(req, res);
}

runTest();
