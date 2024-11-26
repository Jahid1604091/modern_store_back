import asyncHandler from "../middleware/asyncHandler.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import path from 'path';
import { invoiceGenerate } from "../utils/invoiceGenerate.js";
import fs from 'fs';

//@route    /api/orders/
//@desc     post create a new order
//@access   protected
export const createOrder = asyncHandler(async (req, res) => {
    const order = new Order({ ...req.body, user: req.user._id })
    const newOrder = await order.save()
    return res.status(200).json({
        success: true,
        data: newOrder,
        msg:"Order Creation Successful!"
    });
})

//@route    /api/orders/myorders
//@desc     GET get my orders
//@access   protected
export const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id })
    return res.status(200).json({
        success: true,
        data: orders
    });
})

//@route    /api/orders/myorders/:id
//@desc     GET get one of my order details
//@access   protected
export const getMyOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'id name email')
    return res.status(200).json({
        success: true,
        data: order
    });
})

//@route    /api/orders/myorders/:id/pay
//@desc     put update order to paid
//@access   protected
export const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    order.isPaid = true;
    order.paidAt = Date.now();

    //increment the sales count in product table
    for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
            product.sales += item.qty;
            await product.save();
        }
    }

    // order.paymentResult = {
    //     id:req.body.id,
    //     status:req.body.status,
    //     update_time:req.body.update_time,
    //     email_address:req.body.payer.email_address,
    // }

    const updatedOrder = await order.save();
    return res.status(200).json({
        success: true,
        data: updatedOrder,
        msg:"Order Updated Successfully!"
    });
})


//@route    /api/orders/
//@desc     GET all  orders
//@access   protected/Admin
export const getAllOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({}).populate('user', 'id name')
    return res.status(200).json({
        success: true,
        data: orders
    });
})

//@route    /api/orders/myorders/:id/invoice
//@desc     GET     generate an invoice
//@access   protected
export const generateInvoice = asyncHandler(async (req, res) => {
    const __dirname = path.resolve()
    const order = await Order.findById(req.params.id).populate('user','name email');
    const invoicesDir = path.join(__dirname, 'invoices');
    if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
    }
    const invoicePath = path.join(invoicesDir, `invoice_${order._id}.pdf`);

    const stream = res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment;filename=invoice.pdf`,
    });

    await new Promise((resolve,reject)=>{
        invoiceGenerate(order, 
            invoicePath, 
            (chunk) => stream.write(chunk),
            () => stream.end(),
            resolve
        );
    })  
    
    // res.download(invoicePath);
    return res.status(200).json({
        success: true,
        data: invoicePath,
        msg:"Invoice Generated Successfully!"
    });
})


