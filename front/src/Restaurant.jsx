import React, { useState, useEffect } from "react";
import RestaurantHeader from "./RestaurantHeader";

const localhost = import.meta.env.VITE_WS_SERVER;
const socket = new WebSocket(`ws://${localhost}`);

const Restaurant = () => {

    const [orders, setOrders] = useState([]); // State to store orders from the database
    const [readyOrders, setReadyOrders] = useState([]);
    const [preppingOrders, setPreppingOrders] = useState([]);

    // Fetch orders from the backend when the component mounts
    const fetchOrders = async () => {
        try {
            const response = await fetch(`http://${localhost}/orders`);
            const data = await response.json();
            setOrders(data); // Set orders fetched from the backend
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    useEffect(() => {

        fetchOrders(); // Fetch orders when component mounts

        // Set up the interval to refresh the orders every 10 seconds
        const intervalId = setInterval(fetchOrders, 5000);

        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, []);

    // WebSocket message handling for real-time updates
    useEffect(() => {
        socket.onmessage = (event) => {
            if (event.data instanceof Blob) {
                // Handle Blob data
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const messageData = JSON.parse(reader.result); // Assuming Blob contains JSON data
                        updateOrders(messageData);
                    } catch (error) {
                        console.error("Error processing Blob WebSocket message:", error);
                    }
                };
                reader.readAsText(event.data);
            } else {
                // Handle JSON string data
                try {
                    const messageData = JSON.parse(event.data);
                    updateOrders(messageData);
                } catch (error) {
                    console.error("Error processing WebSocket message:", error);
                }
            }
        };
        // const pingInterval = setInterval(() => {
        //     if (socket.readyState === WebSocket.OPEN) {
        //         socket.send('ping'); // Send a ping to the server
        //     }
        // }, 30000);
        
        // WebSocket error handling
        socket.onerror = (error) => {
            console.error('WebSocket Error: ', error);
        };

        const updateOrders = (messageData) => {
            // Update the orders when a message is received from the WebSocket
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.orderNumber === messageData.orderNumber
                        ? { ...order, status: messageData.status }
                        : order
                )
            );
        };
    }, []);

    // Filter orders based on their status
    useEffect(() => {
        const filteredPreppingOrders = orders.filter(order => order.status === 1);
        const filteredReadyOrders = orders.filter(order => order.status === 2);

        setPreppingOrders(filteredPreppingOrders);
        setReadyOrders(filteredReadyOrders);
    }, [orders]);
    
    const modules = import.meta.glob('./assets/images/*.jpg');
    const [images, setImages] = useState([]);

    useEffect(() => {
        // Convert the modules into an array of promises to fetch image paths
        const imagePromises = Object.values(modules).map((importImage) => importImage());

        // Once all promises resolve, update the state with image URLs
        Promise.all(imagePromises).then((resolvedImages) => {
            setImages(resolvedImages.map((img) => img.default || img));
        });
    }, []);

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Image carousel effect
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentImageIndex(prevIndex => (prevIndex + 1) % images.length);
        }, 20000);

        return () => clearInterval(intervalId);
    }, [images.length]);

    return (
        <>
            <div className='max-h-[100%]'>

                {/* Top section */}
                <RestaurantHeader />

                <div className="flex max-h-fit text-center text-4xl font-bold bg-yellow-100">
                    {/* Prepping Orders Section */}
                    <div className="flex-1">
                        <div className="flex-row p-4 space-y-2 font-normal text-2xl text-gray-800">
                            {preppingOrders.map(order => (
                                <div
                                    key={order.orderNumber}
                                    className="border-black border-2 bg-yellow-500 rounded-2xl p-4 justify justify-between flex"
                                >
                                    <div className="font-semibold text-[50px]">{order.orderNumber}</div>
                                    <div className="font-semibold text-[50px]">{order.customerName}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Image Carousel Section */}
                    <div className="flex-grow flex w-32 justify-center items-center h-fit">
                        <div className="w-full h-full flex flex-col justify-between items-center">
                            {images.length > 0 && (
                                <img
                                    src={images[currentImageIndex]}
                                    alt={`image-${currentImageIndex}`}
                                    className="w-full h-full object-cover"
                                // className="w-full h-full object-fill"
                                />
                            )}
                            <img src={'/Logobshara.png'} alt="Logo" className="items-center justify-center w-full h-56" />
                        </div>
                    </div>

                    {/* Ready Orders Section */}
                    <div className="flex-1">
                        <div className="flex-row gap-4 space-y-2 p-4 font-bold text-2xl text-gray-800">
                            {readyOrders.map(order => (
                                <div
                                    key={order.orderNumber}
                                    className="border-black border-2 bg-green-500 rounded-2xl p-4 justify justify-between flex"
                                >
                                    <div className="font-semibold text-[50px]">{order.orderNumber}</div>
                                    <div className="font-semibold text-[50px]">{order.customerName}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
};

export default Restaurant;
