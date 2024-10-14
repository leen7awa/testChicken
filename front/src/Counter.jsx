import React, { useState, useEffect } from 'react';
import StatusConvert from './StatusConvert';
import ConfirmationModal from './ConfirmationModal';
import OrderDetailsModal from './OrderDetailsModal'; // Import your modal component
import Header from './Header';
import './card.css';

// Initialize WebSocket connection
// const socket = new WebSocket('ws://localhost:8081/');
const socket = new WebSocket('wss://rest1-04005fd2a151.herokuapp.com/');

const Counter = () => {
    const [orders, setOrders] = useState([]); // Initialize with an empty array
    const [statusFilters, setStatusFilters] = useState([false, false, true, false]); // Default to show specific statuses
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [finishOrderItem, setFinishOrderItem] = useState('');
    const [showOrderDetails, setShowOrderDetails] = useState(false); // State for order details modal
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Function to send WebSocket messages
    const sendMessage = (orderNumber, newStatus) => {
        const message = JSON.stringify({ orderNumber, status: newStatus });
        socket.send(message); // Send order number and new status to WebSocket

        // Update order status in the frontend immediately after sending the WebSocket message
        setOrders(prevOrders => {
            const updatedOrders = prevOrders.map(order =>
                order.orderNumber === orderNumber ? { ...order, status: newStatus } : order
            );
            return updatedOrders;
        });
    };

    // Fetch orders from the database
    const fetchOrders = async () => {
        try {
            // const response = await fetch('http://localhost:8081/orders'); // Fetch from backend
            const response = await fetch('https://rest1-04005fd2a151.herokuapp.com/orders'); // Fetch from backend
            const data = await response.json();
            setOrders(data); // Set orders fetched from the database
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    useEffect(() => {
        fetchOrders(); // Fetch orders when component mounts

        // WebSocket message handler
        socket.onmessage = (event) => {
            if (event.data instanceof Blob) {
                // Handle Blob data
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const messageData = JSON.parse(reader.result); // Assuming the blob contains JSON data
                        handleMessage(messageData);
                    } catch (error) {
                        console.error("Error processing Blob WebSocket message:", error);
                    }
                };
                reader.readAsText(event.data);
            } else {
                // Handle JSON data
                try {
                    const messageData = JSON.parse(event.data);
                    handleMessage(messageData);
                } catch (error) {
                    console.error("Error processing WebSocket message:", error);
                }
            }
        };

        const pingInterval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send('ping'); // Send a ping to the server
            }
          }, 30000);

        // WebSocket error handling
        socket.onerror = (error) => {
            console.error('WebSocket Error: ', error);
        };

        const handleMessage = (messageData) => {
            setOrders(prevOrders => {
                const orderExists = prevOrders.some(order => order.orderNumber === messageData.orderNumber);

                if (orderExists) {
                    // Update the order if it already exists
                    return prevOrders.map(order =>
                        order.orderNumber === messageData.orderNumber ? { ...order, status: messageData.status } : order
                    );
                } else {
                    // Add the new order if it doesn't exist
                    return [...prevOrders, messageData];
                }
            });
        };

        // Set up the interval to refresh the page every 10 seconds
        const intervalId = setInterval(fetchOrders, 5000);

        // Cleanup the interval on component unmount
        return () => clearInterval(intervalId);

    }, []);

    // Function to delete the order from the database
    const deleteOrderFromDB = async (orderNumber) => {
        try {
            // const response = await fetch(`http://localhost:8081/orders/${orderNumber}`, {
            const response = await fetch(`https://rest1-04005fd2a151.herokuapp.com/orders/${orderNumber}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete the order');
            }
            console.log(`Order ${orderNumber} deleted successfully`);
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    };

    // Filter orders based on their status
    const filteredOrders = orders.filter((order) => statusFilters[order.status]);

    return (
        <>
            <div className="bg-[#ffa900] h-screen overflow-y-auto">
                <Header title='דלפק' onToggleStatuses={setStatusFilters} /> {/* Pass the toggle handler */}

                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '20px',
                        marginTop: '20px',
                        margin: '20px',
                        justifyContent: 'center'
                    }}
                >
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map((order, orderIndex) => (
                            <div
                                key={orderIndex}
                                className="order-card"
                                style={{
                                    backgroundColor: 'wheat',
                                    border: '2px solid #1a1a1a',
                                    width: '300px',
                                    height: '200px',
                                    textAlign: 'center',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden' // Prevent overflow issues
                                }}>
                                <div className='flex flex-col h-full text-gray-800'>
                                    <div className='flex-col font-bold text-base overflow-hidden text-ellipsis'>
                                        <h2 className='text-xl sm:text-base md:text-base'>מספר הזמנה {order.orderNumber}</h2>
                                        <h4 className='text-base'> סטטוס הזמנה:
                                            <span className='border-b-2 border-blue-500'>
                                                <StatusConvert status={order.status} />
                                            </span>
                                        </h4>
                                        <h4 className='text-base'>שם לקוח: {order.customerName}</h4>
                                        <h4 className="text-center">
                            {new Date(new Date(order.date).getTime() - 3 * 60 * 60 * 1000).toLocaleString()}
                        </h4>
                                    </div>

                                    <div className='flex-1 mt-2 justify-center flex items-center'>
                                        <button
                                            className="px-4 py-1 bg-gray-600 font-bold rounded-2xl border-2 border-gray-800"
                                            onClick={() => {
                                                setSelectedOrder(order); // Set order items
                                                setShowOrderDetails(true); // Show the modal
                                            }}
                                        >
                                            פרטי הזמנה
                                        </button>
                                    </div>

                                    <div className='flex-1 text-center p-2'>
                                        <button
                                            className="px-2 py-1 bg-red-500 font-bold rounded-2xl border-2 border-gray-800"
                                            onClick={() => {
                                                setFinishOrderItem(order);
                                                setShowConfirmation(true);
                                            }}
                                        >
                                            סיום
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className='text-gray-800 font-mono mt-44 text-3xl font-bold'>אין הזמנות</div>
                    )}
                </div>
            </div>

            {showConfirmation && (
                <ConfirmationModal
                    message={<span dir="rtl">לסיים את ההזמנה?</span>}
                    onConfirm={async () => {
                        // Remove the order from the database
                        await deleteOrderFromDB(finishOrderItem.orderNumber);

                        // Remove the order from the list
                        setOrders(prevOrders => {
                            const updatedOrders = prevOrders.filter(order => order.orderNumber !== finishOrderItem.orderNumber);
                            return updatedOrders;
                        });
                        setShowConfirmation(false);
                    }}
                    onCancel={() => setShowConfirmation(false)}
                />
            )}

            {showOrderDetails && selectedOrder && ( // Show the order details modal when triggered
                <OrderDetailsModal
                    order={selectedOrder} // Pass the selected order object
                    onClick={() => setShowOrderDetails(false)} // Close the modal
                />
            )}
        </>
    );
};

export default Counter;
