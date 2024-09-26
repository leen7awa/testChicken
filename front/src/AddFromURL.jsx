import React, { useState, useEffect, useRef } from 'react';

const AddFromURL = () => {
    const [status] = useState(0);  // Default status
    const hasSaved = useRef(false);  // To track if the order is already saved
    const socket = new WebSocket('wss://rest1-04005fd2a151.herokuapp.com/');  // WebSocket connection
    
    // Retrieve parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('orderNumber');
    const customerName = urlParams.get('customerName');
    const orderItems = urlParams.get('orderItems');

    const currentDate = new Date().toLocaleString('en-US');  // Get current date and time

    const [numberExist, setNumberExist] = useState(false);

    const fetchOrders = async () => {
        try {
            const response = await fetch('https://rest1-04005fd2a151.herokuapp.com/orders'); // Replace with your backend URL
            const data = await response.json();

            // Check if the order number exists
            const exists = data.some(order => Number(order.orderNumber) === Number(orderNumber));

            if (exists) {
                setNumberExist(true);
                // console.log(`Order with orderNumber ${orderNumber} already exists.`);
                alert('מספר ההזמנה קיים במערכת!');
            } else {
                // If the order does not exist, add it to the database
                const parsedOrderItems = orderItems.split(',').map(item => ({
                    name: item.trim()  // Only store the name of the item
                }));

                const newOrder = {
                    orderNumber,
                    customerName,
                    orderItems: parsedOrderItems,  // Send only the name for each item
                    date: currentDate,
                    status,
                };

                // Submit the order to the database
                await submitOrderToDatabase(newOrder);

                // Send the order through WebSocket
                socket.onopen = () => {
                    socket.send(JSON.stringify(newOrder));
                };

                setTimeout(() => {
                    window.close();
                }, 100);
            }

        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    useEffect(() => {
        if (!hasSaved.current) {
            fetchOrders();  // Fetch the orders when the component mounts
            hasSaved.current = true;  // Prevent further submissions
        }
    }, [orderNumber, customerName, orderItems, status, currentDate]);

    // Function to submit the order to the backend
    const submitOrderToDatabase = async (orderDetails) => {
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
        <div className='bg-slate-300 justify justify-center'>
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
