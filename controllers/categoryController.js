import asyncHandler from "../middleware/asyncHandler.js";
import Category from "../models/categoryModel.js";
import slugify from 'slugify';
import ErrorResponse from "../utils/errorresponse.js";



//@route    /api/categories/admin
//@desc     POST: create a new category
//@access   protected by admin
export const createCategory = asyncHandler(async (req, res) => {
    const { name } = req.body;
    const slug = slugify(name, '-');
    const catObj = { name, slug };
    if (req.body.parentId) {
        catObj.parentId = req.body.parentId;
    }
    const category = new Category(catObj);
    const newCategory = await category.save();
    return res.status(200).json({
        success: true,
        msg: "Category created successfully!",
        data: newCategory
    });
})


//@route    /api/categories
//@desc     GET:fetch all categories
//@access   public
export const getCategories = asyncHandler(async (req, res, next) => {
    let categories;
    if (req.user && req.user.role === 'admin') {
        categories = await Category.find({isSoftDeleted: false });
    }
    else{
        categories = await Category.find({ isActive: true, isSoftDeleted: false });
    }
    if (!categories) {
        return next(new ErrorResponse('No Category Found!', 404));
    }

    const refinedCategories = formatCategories(categories);
    return res.status(200).json({
        success: true,
        msg: "Category fetched successfully!",
        data: refinedCategories
    });
})


//@route    /api/categories/admin/:id
//@desc     PATCH: update a category
//@access   protected by admin
export const editCategory = asyncHandler(async (req, res, next) => {
    const id = req.params.id;
    const { name, status } = req.body
    if (!name) {
        return next(new ErrorResponse('Category name is required!', 400));
    }
    const category = await Category.findById(id);

    if (!category) {
        return next(new ErrorResponse('No Category Found to Edit!', 404));
    }

    //update table
    category.name = name || category.name;
    category.isActive = status || category.isActive;
    category.slug = slugify(name, '-');

    const updatedCategory = await category.save();

    return res.status(200).json({
        success: true,
        msg: "Category updated successfully!",
        data: updatedCategory
    });
})

//@route    /api/categories/admin/:id
//@desc     DELETE: delete a category
//@access   protected by admin
export const deleteCategory = asyncHandler(async (req, res, next) => {
    const id = req.params.id;
    const category = await Category.findById(id);

    if (!category) {
        return next(new ErrorResponse('No Category Found to Delete!', 404));
    }

    //update table
    category.isSoftDeleted = true;
    category.softDeletedAt = Date.now();
    category.deletedBy = req.user._id;

    await category.save();

    return res.status(200).json({
        success: true,
        msg: "Category deleted successfully!",
        data: category
    });
})

function formatCategories(passedCategories, parentId = null) {
    const finalFormatedCategoryList = [];
    let categories;
    if (parentId == null) {
        categories = passedCategories.filter(cat => cat.parentId == undefined);
    }
    else {
        categories = passedCategories.filter(cat => cat.parentId == parentId);
    }

    for (let c of categories) {
        finalFormatedCategoryList.push({
            _id: c._id,
            name: c.name,
            slug: c.slug,
            subcategories: formatCategories(passedCategories, c._id)
        })
    }



    return finalFormatedCategoryList;
}