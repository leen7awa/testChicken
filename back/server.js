const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const cors = require('cors');  // Import the CORS middleware
const Order = require('./orderSchema'); // Import the Mongoose order model
require('dotenv').config();

const app = express();
const port = process.env.PORT;

// Middleware to parse JSON requests

app.use(cors({
  origin: '*', // Allow requests from both localhost and your deployed frontend URL
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true  // Allow cookies or other credentials if needed
}));

app.use(express.json());

const db_url = process.env.MONGO_URI;

// MongoDB connection setup
mongoose.connect(db_url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server instance
const wss = new WebSocket.Server({ server });

// WebSocket connection logic
wss.on('connection', async (ws) => {
  console.log('New client connected');

  // const pingInterval = setInterval(() => {
  //   if (ws.readyState === WebSocket.OPEN) {
  //     ws.ping(); // Send ping message
  //   }
  // }, 30000); // Every 30 seconds
  
  ws.on('message', async (message) => {
    console.log(`Received message: ${message}`);

    // Try to parse the message
    try {
      const parsedMessage = JSON.parse(message);
      console.log('Parsed message:', parsedMessage);

      // Update the database and broadcast the updated orders
      const { orderNumber, status } = parsedMessage;
      console.log(`Updating order: ${orderNumber}, status: ${status}`);

      // Update order in MongoDB
      const updatedOrder = await Order.findOneAndUpdate({ orderNumber }, { status }, { new: true });
      
      if (updatedOrder) {
        console.log('Order updated successfully:', updatedOrder);
        const updatedOrders = await Order.find();
        // Broadcast the updated order to all clients
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(updatedOrders));
          }
        });
      } else {
        console.error('Order not found');
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// REST API to retrieve all orders from MongoDB
app.get('/orders', async (req, res) => {
  try {
    const allOrders = await Order.find();
    res.json(allOrders);
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving orders from MongoDB' });
  }
});

app.post('/createOrder', async (req, res) => {
  const { orderNumber, customerName, orderItems } = req.body;

  // Validate required fields
  if (!orderNumber || !customerName || !Array.isArray(orderItems) || orderItems.length === 0) {
    return res.status(400).json({ error: 'Missing required fields or invalid data' });
  }

  try {
    const newOrder = new Order(req.body);
    await newOrder.save();

    console.log('Order saved successfully:', newOrder);
    res.status(201).json({ message: 'Order created', order: newOrder });
  } catch (error) {
    console.error('Error while creating order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/orders/:orderNumber', async (req, res) => {
  const { orderNumber } = req.params;

  try {
      const deletedOrder = await Order.findOneAndDelete({ orderNumber });
      if (deletedOrder) {
          res.status(200).json({ message: 'Order deleted successfully' });
      } else {
          res.status(404).json({ message: 'Order not found' });
      }
  } catch (error) {
      res.status(500).json({ error: 'Error deleting the order' });
  }
});

// Start the server
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
