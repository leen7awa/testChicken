import React, { useState, useEffect, useRef } from "react";
import './modal.css';

const OrderFormModal = ({ onClose, onSubmit }) => {
  const [customerName, setCustomerName] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderItems, setOrderItems] = useState('');
  const [branch, setBranch] = useState('');
  const hasSaved = useRef(false);  // To track if the order has already been saved

  const localhost = import.meta.env.VITE_WS_SERVER;
  const socket = new WebSocket(`ws://${localhost}`);

  const currentDate = new Date().toLocaleString('en-US');


  const handleSubmit = () => {
    const itemsArray = orderItems.split(',').map(item => ({
      name: item.trim()  // Only store the name of the item
    }));

    const newOrder = {
      orderNumber,
      customerName,
      orderItems: itemsArray,  // Send only the name for each item
      date: currentDate,  // Use the new date format
      status: 1,
      branch:1, // temporary!
    };

    // Ensure we only save the order once
    if (!hasSaved.current) {
      onSubmit(newOrder);
      socket.onopen = () => {
        socket.send(JSON.stringify(newOrder));  // Send new order through WebSocket
      };

      // const pingInterval = setInterval(() => {
      //   if (socket.readyState === WebSocket.OPEN) {
      //     socket.send('ping'); // Send a ping to the server
      //   }
      // }, 30000);

      // Send the order data to the backend (MongoDB)
      submitOrderToDatabase(newOrder);

      hasSaved.current = true;  // Mark the order as saved to prevent duplicates
    }
  };

  // Function to submit the order to the backend
  const submitOrderToDatabase = async (orderDetails) => {
    try {
      const response = await fetch(`http://${localhost}/createOrder`, {
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
    <div className="modal-overlay">
      <div className="flex flex-col text-sm modal-content space-y-2 bg-[#fff2cd] border-2 border-gray-800 p-4">
        <h4 className="font-bold border-b-2 border-black">הוסף הזמנה חדשה</h4>
        <div className="flex flex-col space-y-2 text-end">
          {/* <div className="flex flex-row space-x-1 items-center"> */}
            {/* <label>
              מספר סניף
              <input
                type="text"
                className="border w-1/2 p-2"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                required
              />
            </label> */}
            <label>
              מספר הזמנה
              <input
                type="text"
                className="border w-full p-2"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                required
              />
            </label>
          {/* </div> */}
          <label>
            שם לקוח
            <input
              type="text"
              className="border w-full p-2"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </label>
          <label>
            פריטי הזמנה (מופרדים בפסיקים)
            <input
              type="text"
              className="border w-full p-2 text-end"
              value={orderItems}
              onChange={(e) => setOrderItems(e.target.value)}
              placeholder="לדוגמה: בורגר, צ'יפס, קולה"
            />
          </label>
        </div>
        <div className="flex justify-between mt-4">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded"
            onClick={handleSubmit}
          >
            שמור
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={onClose}
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderFormModal;
