const Category = require('../models/category.model');

exports.createCategory = async (req, res) => {
  try {
    const { categoryName, categoryCode, description, department } = req.body;

    // Check if category code already exists
    const existingCategory = await Category.findOne({ categoryCode: categoryCode.toUpperCase() });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this code already exists'
      });
    }

    // Create category
    const category = await Category.create({
      categoryName,
      categoryCode: categoryCode.toUpperCase(),
      description,
      department,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all categories (only show ACTIVE status)
exports.getCategories = async (req, res) => {
  try {
    const { department, search } = req.query;
    
    let query = { status: "ACTIVE" }; // Only show ACTIVE categories
    
    if (department) {
      query.department = department;
    }
    
    if (search) {
      query.$or = [
        { categoryName: { $regex: search, $options: 'i' } },
        { categoryCode: { $regex: search, $options: 'i' } }
      ];
    }
    
    const categories = await Category.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { categoryName, categoryCode, description, department, status } = req.body;
    
    let category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if category code conflicts with another category
    if (categoryCode && categoryCode.toUpperCase() !== category.categoryCode) {
      const existingCategory = await Category.findOne({ 
        categoryCode: categoryCode.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this code already exists'
        });
      }
    }
    
    // Update category
    category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        categoryName: categoryName || category.categoryName,
        categoryCode: categoryCode ? categoryCode.toUpperCase() : category.categoryCode,
        description: description !== undefined ? description : category.description,
        department: department || category.department,
        status: status || category.status
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete - just set status to INACTIVE
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Set status to INACTIVE instead of deleting
    category.status = "INACTIVE";
    await category.save();
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Toggle between ACTIVE and INACTIVE
    category.status = category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await category.save();
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};