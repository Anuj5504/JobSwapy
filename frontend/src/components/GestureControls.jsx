import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function GestureControls({ onToggleTilt, onToggleHandGesture, isTiltEnabled, isHandGestureEnabled }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobileDevice, setIsMobileDevice] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');

    // Check if device is mobile/touch capable
    useEffect(() => {
        const checkDevice = () => {
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth <= 768; // Common mobile breakpoint
            setIsMobileDevice(isTouchDevice && isSmallScreen);
        };

        // Check initially
        checkDevice();

        // Check on window resize
        window.addEventListener('resize', checkDevice);

        return () => {
            window.removeEventListener('resize', checkDevice);
        };
    }, []);

    const handleToggleTilt = () => {
        onToggleTilt();
        setNotificationMessage(isTiltEnabled ? 'Tilt controls disabled' : 'Tilt controls enabled');
        setShowNotification(true);
        setIsOpen(false); // Close dropdown after toggle
        setTimeout(() => setShowNotification(false), 3000);
    };

    const handleToggleHandGesture = () => {
        onToggleHandGesture();
        setNotificationMessage(isHandGestureEnabled ? 'Hand gestures disabled' : 'Hand gestures enabled');
        setShowNotification(true);
        setIsOpen(false); // Close dropdown after toggle
        setTimeout(() => setShowNotification(false), 3000);
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-black/70 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 hover:bg-black/80 transition-colors"
            >
                <span>Gestures</span>
                <svg
                    className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 mt-2 w-64 bg-black/70 text-white rounded-lg shadow-lg overflow-hidden z-50"
                    >
                        <div className="p-4 space-y-4">
                            {isMobileDevice && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Tilt Controls</span>
                                    <button
                                        onClick={handleToggleTilt}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isTiltEnabled ? 'bg-green-500' : 'bg-gray-600'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isTiltEnabled ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Hand Gestures</span>
                                <button
                                    onClick={handleToggleHandGesture}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isHandGestureEnabled ? 'bg-green-500' : 'bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isHandGestureEnabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notification Popup */}
            <AnimatePresence>
                {showNotification && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg shadow-lg z-50"
                    >
                        {notificationMessage}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default GestureControls; 