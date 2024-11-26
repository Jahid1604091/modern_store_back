import slugify from 'slugify';
import asyncHandler from '../middleware/asyncHandler.js';
import Product from '../models/productModel.js';
import path from 'path';
import fs from 'fs';
import Category from '../models/categoryModel.js';
import Brand from '../models/brandModel.js';
import ErrorResponse from '../utils/errorresponse.js';

//@route    /api/products?q='df'
//@desc     get all products
//@access   public
export const getAllProducts = asyncHandler(async (req, res) => {
  const per_page = 8; // Number of products per page
  const page = Number(req.query.page) || 1; // Current page number
  const searchTerm = req.query.q ? req.query.q.trim() : ''; // Search term from query parameter

  // Build the search query
  const query = searchTerm
    ? {
      name: {
        $regex: searchTerm,
        $options: 'i', // Case insensitive search
      },
    }
    : {};

  try {
    // Count total number of products matching the query
    const totalProducts = await Product.countDocuments({ ...query });

    // Find products with pagination
    const products = await Product.find({ ...query })
      .populate('brand', 'name')
      .populate('category', 'name')
      .limit(per_page)
      .skip(per_page * (page - 1))
      .sort({ sales: -1, views: -1 });

    res.status(200).json({
      success: true,
      data: products,
      page,
      pages: Math.ceil(totalProducts / per_page), // Total number of pages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "An error occurred while fetching products.",
    });
  }
});


//@route    /api/products/:id
//@desc     get product
//@access   public
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.status(200).json({
    success: true,
    data: product,
  })
});

//@route    /api/products/:id/view
//@desc     PUT incremeentProductView
//@access   public
export const incremeentProductView = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  product.views = product.views + 1;
  await product.save();
  res.status(200).json({ success: true, msg: 'View count incremented' });
});

//------------------- A D M I N------------------------
//@route    /api/products/admin
//@desc     POST: create a new product
//@access   protected by admin
export const createProduct = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      msg: 'No image file uploaded!',
    });
  }

  const { name, description, brand, category, price, countInStock } = req.body;

  // Check if the category exists and is not soft-deleted
  const existingCategory = await Category.findOne({ _id: category, isSoftDeleted: false });
  if (!existingCategory) {
    return res.status(404).json({
      success: false,
      msg: 'Category not found or it has been soft-deleted!'
    });
  }

  // Check if the brand exists and is not soft-deleted
  const existingBrand = await Brand.findOne({ _id: brand, isSoftDeleted: false });
  if (!existingBrand) {
    return res.status(404).json({
      success: false,
      msg: 'Brand not found or it has been soft-deleted!'
    });
  }

  const slug = slugify(name, '-');

  //check if brand or category exists or not softdeleted
  const product = new Product({
    name,
    slug,
    image: req.file.path,
    description,
    brand,
    category,
    price,
    countInStock
  });
  const newProduct = await product.save();
  return res.status(200).json({
    success: true,
    msg: "Product created successfully!",
    data: newProduct
  });
})


//@route    /api/products/admin/:id
//@desc     PATCH: update a new product
//@access   protected by admin
export const editProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorResponse('No Product Found to Update!', 404));
  }
  const { name, description, brand, category, price, countInStock } = req.body;

  // Check if the category exists and is not soft-deleted
  // const existingCategory = await Category.findOne({ _id: category, isSoftDeleted: false });
  // if (!existingCategory) {
  //   return res.status(404).json({
  //     success: false,
  //     msg: 'Category not found or it has been soft-deleted!'
  //   });
  // }

  // // Check if the brand exists and is not soft-deleted
  // const existingBrand = await Brand.findOne({ _id: brand, isSoftDeleted: false });
  // if (!existingBrand) {
  //   return res.status(404).json({
  //     success: false,
  //     msg: 'Brand not found or it has been soft-deleted!'
  //   });
  // }

  product.name = name || product.name;
  product.slug = name ?  slugify(name, '-') : product.slug;
  product.description = description || product.description;
  product.brand = brand || product.brand;
  product.category = category || product.category;
  product.price = price || product.price;
  product.countInStock = countInStock || product.countInStock;

  // Handle image upload
  if (req.file) {
    // Delete the old image if it exists
    if (product.image) {
      const __dirname = path.resolve();
      const oldImagePath = path.join(__dirname, product.image);
      fs.unlink(oldImagePath, (err) => {
        if (err) console.error('Failed to delete old product image:', err);
      });
    }
    product.image = req.file.path;
  }

  // Save the updated product
  const updatedProduct = await product.save();

  return res.status(200).json({
    success: true,
    msg: "Product updated successfully!",
    data: updatedProduct
  });
})

//@route    /api/products/admin/:id
//@desc     DELETE: delete a product
//@access   protected by admin
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const product = await Product.findById(id);

  if (!product) {
    return next(new ErrorResponse('No Product Found to Delete!', 404));
  }

  //if we need to delete permanently
  // Delete the product image from the server
  // const __dirname = path.resolve();
  // const imagePath = path.join(__dirname, product.image);

  // fs.unlink(imagePath, (err) => {
  //   if (err) {
  //     console.error(`Failed to delete image: ${imagePath}`, err);
  //     return next(new ErrorResponse('Failed to delete product image.', 500));
  //   }
  // });

  //update table
  product.isSoftDeleted = true;
  product.softDeletedAt = Date.now();
  product.deletedBy = req.user._id;


  await product.save();

  return res.status(200).json({
    success: true,
    msg: "Product deleted successfully!",
    data: product
  });
})