import React, { useState, useEffect } from 'react';
import StatusConvert from './StatusConvert';
import Header from './Header';
import ConfirmationModal from './ConfirmationModal';
import OrderDetailsModal from './OrderDetailsModal'; // Import your modal component
import './card.css';

// Initialize WebSocket connection
// const socket = new WebSocket('ws://localhost:8081/');
const socket = new WebSocket('wss://rest1-04005fd2a151.herokuapp.com/');

const Kitchen = () => {
    const [orders, setOrders] = useState([]); // Initialize with an empty array
    const [statusFilters, setStatusFilters] = useState([true, true, true]); // Default to show all statuses
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null); // Store the selected order
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [finishOrderItem, setFinishOrderItem] = useState('');
    
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

    const fetchOrders = async () => {
        // Fetch orders from the backend
        try {
            // const response = await fetch('http://localhost:8081/orders');
            const response = await fetch('https://rest1-04005fd2a151.herokuapp.com/orders');
            const data = await response.json();
            setOrders(data); // Set the orders with the data from the backend
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    useEffect(() => {
        fetchOrders(); // Fetch orders when component mounts

        // Set up the interval to refresh orders every 10 seconds
        const intervalId = setInterval(fetchOrders, 5000);

        return () => clearInterval(intervalId); // Cleanup the interval on component unmount
    }, []);

    // WebSocket message handler
    useEffect(() => {
        socket.onmessage = (event) => {
            let messageData;
            if (event.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        messageData = JSON.parse(reader.result); // Assuming the blob contains JSON data
                        handleMessage(messageData);
                    } catch (error) {
                        console.error("Error processing Blob WebSocket message:", error);
                    }
                };
                reader.readAsText(event.data);
            } else {
                // Handle JSON data
                try {
                    messageData = JSON.parse(event.data);
                    handleMessage(messageData);
                } catch (error) {
                    console.error("Error processing WebSocket message:", error);
                }
            }
        };

        const handleMessage = (messageData) => {
            console.log("Received WebSocket message:", messageData);

            // If it's not an array or object, log an error
            if (typeof messageData !== 'object') {
                console.error('Expected messageData to be an object, but got:', messageData);
                return;
            }

            setOrders(prevOrders => {
                const orderExists = prevOrders.some(order => order.orderNumber === messageData.orderNumber);
                if (orderExists) {
                    // Update the existing order
                    return prevOrders.map(order =>
                        order.orderNumber === messageData.orderNumber ? { ...order, ...messageData } : order
                    );
                } else {
                    // Add the new order
                    return [...prevOrders, messageData];
                }
            });
        };

        const pingInterval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {

            }
            else {
                location.reload();
            }
        }, 10000);

        // WebSocket error handling
        socket.onerror = (error) => {
            console.error('WebSocket Error: ', error);
        };
    }, []);

    // Filter orders based on the statusFilters array
    const filteredOrders = orders.filter(
        (order) => statusFilters[order.status] && order.branch === 1
    );

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

    return (
        <>
            <div className="bg-[#ffa900] h-screen overflow-y-auto">
                <Header title='מטבח' onToggleStatuses={setStatusFilters} /> {/* Pass the toggle handler */}

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
                                    width: '350px',
                                    height: '250px',
                                    textAlign: 'center',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                }}>

                                <div className='flex flex-col h-full text-gray-800 items-center'>
                                    <div className='flex-col font-bold text-base overflow-hidden text-ellipsis'>
                                        <h2 className='text-xl'>מספר הזמנה {order.orderNumber}</h2>
                                        <h4 className='text-base'>שם לקוח: {order.customerName}</h4>
                                        <h4 className="text-center">
                                            {new Date(new Date(order.date).getTime() - 3 * 60 * 60 * 1000).toLocaleString()}
                                        </h4>
                                    </div>

                                    <div className='flex-1 mt-2 justify-center flex items-center'>
                                        <button
                                            className="px-4 py-2 bg-gray-600 font-bold rounded-2xl border-2 border-gray-800"
                                            onClick={() => {
                                                setSelectedOrder(order); // Set the whole order object
                                                setShowOrderDetails(true); // Show the modal
                                            }}
                                        >
                                            פרטי הזמנה
                                        </button>
                                    </div>

                                    <div className='flex-shrink flex sm:flex-row md:flex-row justify-between items-end p-2 space-x-2'>
                                        {[{ label: 'בהמתנה', status: 0 }, { label: 'בהכנה', status: 1 }, { label: 'מוכן', status: 2 }].map((button, index) => (
                                            <button
                                                key={index}
                                                className={`px-6 py-1 rounded-2xl font-semibold ${order.status === button.status ? 'text-black bg-blue-500 border-2 border-gray-800' : 'bg-slate-300 text-gray-500'}`}
                                                onClick={() => sendMessage(order.orderNumber, button.status)}>
                                                {button.label}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        className="mb-2 w-1/2 py-1 rounded-2xl font-bold text-black bg-red-700 border-2 border-gray-800"
                                        // onClick={() => { }}
                                        onClick={() => {
                                            setFinishOrderItem(order);
                                            setShowConfirmation(true);
                                        }}
                                    >
                                        סיום
                                    </button>
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

export default Kitchen;
