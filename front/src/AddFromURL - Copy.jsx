import React, { useState, useEffect, useRef } from 'react';

const AddFromURL = () => {
    const [status] = useState(0);  // Default status
    const hasSaved = useRef(false);  // To track if the order is already saved
    const [orders, setOrders] = useState([]);
    const socket = new WebSocket('wss://rest1-04005fd2a151.herokuapp.com/');  // WebSocket connection

    // Retrieve parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('orderNumber');
    const customerName = urlParams.get('customerName');
    const orderItems = urlParams.get('orderItems');

    const currentDate = new Date().toLocaleString('en-US');  // Get current date and time

    // Fetch orders from the backend
    const fetchOrders = async () => {
        try {
            const response = await fetch('https://rest1-04005fd2a151.herokuapp.com/orders'); // Replace with your backend URL
            const data = await response.json();
            setOrders(data); // Update orders state with fetched data
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    // Fetch orders when component mounts
    useEffect(() => {
        if (!hasSaved.current) {
            fetchOrders();
        }
    }, []);

    // Check if the order number exists after orders are fetched
    useEffect(() => {
        if (orders.length > 0 && !hasSaved.current) {  // Ensure orders are fetched first
            if (orderNumber && customerName && orderItems) {
                // Check if the orderNumber already exists in the fetched orders
                const isOrderNumberExists = orders.some(order => order.orderNumber === orderNumber);

                if (!isOrderNumberExists) {
                    // Parse the order items and keep only the name
                    const parsedOrderItems = orderItems.split(',').map(item => ({
                        name: item.trim()  // Only store the name of the item
                    }));

                    // Create new order object
                    const newOrder = {
                        orderNumber,
                        customerName,
                        orderItems: parsedOrderItems,  // Send only the name for each item
                        date: currentDate,
                        status,
                    };

                    // Prevent multiple submissions
                    hasSaved.current = true;

                    // WebSocket: Wait until the connection is open before sending the message
                    socket.onopen = () => {
                        socket.send(JSON.stringify(newOrder));  // Send new order through WebSocket
                    };

                    const pingInterval = setInterval(() => {
                        if (socket.readyState === WebSocket.OPEN) {
                            socket.send('ping'); // Send a ping to the server
                        }
                    }, 30000);

                    // Send the order data to the backend (MongoDB)
                    submitOrderToDatabase(newOrder);

                    // Save new order to localStorage
                    const updatedOrders = [...orders, newOrder];
                    localStorage.setItem('orders', JSON.stringify(updatedOrders));
                    console.log(updatedOrders);
                    // Close the window after a successful order addition
                    setTimeout(() => {
                        window.close();
                    }, 1000);
                } else {
                    console.log(`Order with orderNumber ${orderNumber} already exists.`);
                }
            }
        }
    }, [orders, orderNumber, customerName, orderItems, status, currentDate]);  // Run when orders are updated

    // Function to submit the order to the backend
    const submitOrderToDatabase = async (orderDetails) => {
        console.log('Submit to database:', orderDetails);
        try {
            const response = await fetch('https://rest1-04005fd2a151.herokuapp.com/createOrder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderDetails),  // Send the order details as JSON
            });
            const data = await response.json();
            console.log('Order submitted successfully to the database:', data);
        } catch (error) {
            console.error('Error submitting order to the database:', error);
        }
    };

    return (
        <div className='bg-slate-300 justify-center'>
            <div className='container text-center'>
                <p>Order Number: {orderNumber}</p>
                <p>Customer Name: {customerName}</p>
                <p>Order Items: {orderItems}</p>
                <p>Date and Time: {currentDate}</p>
            </div>
        </div>
    );
};

export default AddFromURL;
