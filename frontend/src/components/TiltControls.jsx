import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function TiltControls({ onTiltAction, enabled }) {
    const [tiltCooldown, setTiltCooldown] = useState(false);
    const [isMobileDevice, setIsMobileDevice] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const TILT_THRESHOLD = 15; // Degrees of tilt required to trigger

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

    useEffect(() => {
        if (!enabled || !isMobileDevice) return;

        const handleTilt = (event) => {
            if (tiltCooldown) return;

            // Get gamma rotation (left-right tilt)
            const tiltAngle = event.gamma;

            if (Math.abs(tiltAngle) > TILT_THRESHOLD) {
                setTiltCooldown(true);

                // Right tilt = Apply, Left tilt = Reject
                if (tiltAngle > TILT_THRESHOLD) {
                    console.log("RIGHT TILT - APPLY");
                    onTiltAction('right');
                    setShowNotification(true);
                    setTimeout(() => setShowNotification(false), 1000);
                } else if (tiltAngle < -TILT_THRESHOLD) {
                    console.log("LEFT TILT - REJECT");
                    onTiltAction('left');
                    setShowNotification(true);
                    setTimeout(() => setShowNotification(false), 1000);
                }

                // Add cooldown to prevent multiple triggers
                setTimeout(() => setTiltCooldown(false), 1000);
            }
        };

        // Request permission for device orientation
        const requestPermission = async () => {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    const permission = await DeviceOrientationEvent.requestPermission();
                    if (permission === 'granted') {
                        window.addEventListener('deviceorientation', handleTilt);
                    } else {
                        alert('Permission to access device orientation was denied');
                    }
                } catch (error) {
                    console.error('Error requesting device orientation permission:', error);
                }
            } else {
                // For devices that don't require permission
                window.addEventListener('deviceorientation', handleTilt);
            }
        };

        requestPermission();

        return () => {
            window.removeEventListener('deviceorientation', handleTilt);
        };
    }, [enabled, tiltCooldown, onTiltAction, isMobileDevice]);

    // Don't render anything if not a mobile device or not enabled
    if (!enabled || !isMobileDevice) return null;

    return (
        <AnimatePresence>
            {showNotification && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg shadow-lg z-50"
                >
                    {tiltCooldown ? 'Tilt detected!' : 'Tilt to control'}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default TiltControls; 