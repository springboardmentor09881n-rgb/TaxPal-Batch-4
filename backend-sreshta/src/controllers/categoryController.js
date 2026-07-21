const SuggestedCategory = require('../models/SuggestedCategory.model');

exports.recommendCategory = async (req, res) => {
  try {
    const { description, type } = req.query;
    if (!description || !type) {
      return res.status(400).json({ message: 'Description and type are required' });
    }

    const suggestions = await SuggestedCategory.find({ type });
    const descLower = description.toLowerCase();

    let bestMatch = null;
    let maxScore = 0;

    for (const sug of suggestions) {
      const keywords = sug.description.toLowerCase().split(/\s*,\s*|\s+/);
      let score = 0;
      for (const kw of keywords) {
        if (kw && descLower.includes(kw)) {
          // Score can be based on keyword length to favor longer, more specific matches
          score += kw.length;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = sug;
      }
    }

    if (bestMatch) {
      return res.json({ category: bestMatch.name });
    }

    return res.json({ category: null });
  } catch (error) {
    console.error('Error recommending category:', error);
    res.status(500).json({ message: 'Server error recommending category' });
  }
};
