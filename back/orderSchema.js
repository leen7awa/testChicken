const mongoose = require('mongoose');

// Define the schema for restaurant orders
const orderSchema = new mongoose.Schema({
    orderNumber: { type: Number, required: true },
    customerName: { type: String, required: true },
    orderItems: [
        {
            name: { type: String, required: true }
        }
    ],
    date: { type: Date, default: Date.now },
    status: { type: Number, default: 1 },
    branch: { type: Number, required: true }
});


// Create the model
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
