const Category = require('../models/categories.model');

// Get all categories for a user
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user.id });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  const { type, name, color } = req.body;

  try {
    const existingCategory = await Category.findOne({ userId: req.user.id, type, name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists for this type' });
    }

    const category = new Category({
      userId: req.user.id,
      type,
      name,
      color: color || '#64748b'
    });

    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

// Update an existing category
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body;

  try {
    const category = await Category.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { name, color },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found or unauthorized' });
    }

    res.status(200).json(category);
  } catch (error) {
    if (error.code === 11000) {
       return res.status(400).json({ message: 'Category name already exists' });
    }
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!category) {
      return res.status(404).json({ message: 'Category not found or unauthorized' });
    }

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};
