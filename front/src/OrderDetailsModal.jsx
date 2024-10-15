import React from "react";
import './modal.css';

const OrderDetailsModal = ({ order, onClick }) => {
    return (
        <div className="modal-overlay">
            <div className="flex flex-col text-sm modal-content space-y-2 bg-[#fff2cd] border-2 border-gray-800">
                <div className="flex-1">
                    <h4 className="text-lg">מספר הזמנה: {order.orderNumber}</h4>
                    <div className="justify justify-between text-end text-sm">
                        <h4>שם לקוח: {order.customerName}</h4>
                        <h4>התקבלה ב</h4>
                        <h4 className="text-center">
                            {new Date(new Date(order.date).getTime()).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            })}
                        </h4>
                    </div>
                </div>
                <div className="flex-1 max-h-96 md:max-h-80 sm:max-h-64 overflow-y-auto">
                    <ul>
                        {order.orderItems.map((item, index) => (
                            <li key={index}>{item.name}</li>
                        ))}
                    </ul>
                </div>
                <div className="flex-1 modal-buttons">
                    <button
                        className="button rounded-3xl mt-4 text-base w-fit px-4 py-2 bg-slate-400 hover:bg-slate-500 border-2 border-gray-800"
                        onClick={onClick}
                    >
                        סגור
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;
