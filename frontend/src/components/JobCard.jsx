import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

function JobCard({ job, onSwipe, index }) {
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [exitDirection, setExitDirection] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef(null);
  const navigate = useNavigate();

  // Global event listeners for mouse movement and release
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging && !isExiting) {
        const diff = e.clientX - startX;
        setOffsetX(diff);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        completeSwipe();
        setIsDragging(false);
      }
    };

    // Add global event listeners
    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    // Clean up
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, startX, offsetX, isExiting]);

  const handleTouchStart = (e) => {
    if (isExiting) return;

    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    setStartX(clientX);

    if (e.type.includes('mouse')) {
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!startX || isExiting) return;

    // Only prevent default for touch events to avoid browser scroll issues
    if (e.type.includes('touch')) {
      e.preventDefault();

      const clientX = e.touches[0].clientX;
      const diff = clientX - startX;
      setOffsetX(diff);
    }

    // For mouse events, we handle movement in the global listener
  };

  const completeSwipe = () => {
    if (Math.abs(offsetX) > cardRef.current.offsetWidth * 0.3) {
      const direction = offsetX > 0 ? 'right' : 'left';
      setExitDirection(direction);
      setIsExiting(true);

      // Call the onSwipe function with job ID and direction
      setTimeout(() => {
        onSwipe(job.id, direction);
      }, 200);
    } else {
      setOffsetX(0);
    }
  };

  const handleTouchEnd = () => {
    if (!startX || isExiting) return;

    // For touch events, complete the swipe
    if (!isDragging) {
      completeSwipe();
    }
    // For mouse events, this is handled in the global mouseup listener
  };

  // Add useEffect to handle mobile hover state
  useEffect(() => {
    const checkMobile = () => {
      // Check if device is mobile (screen width <= 768px)
      if (window.innerWidth <= 768) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    // Check on mount
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Modify handleMouseLeave to only work on non-mobile
  const handleMouseLeave = () => {
    // Only update hover state on non-mobile devices
    if (window.innerWidth > 768 && !isExiting) {
      setIsHovered(false);
    }
  };

  const showDetails = (e) => {
    // Only navigate if we weren't dragging
    if (Math.abs(offsetX) < 10 && !isExiting && !isDragging) {
      navigate(`/job/${job.id}`);
    }
  };

  // Calculate the rotation and position based on swipe state
  const getCardStyle = () => {
    if (isExiting) {
      if (exitDirection === 'right') {
        return {
          x: window.innerWidth + 200,
          y: -100,
          rotate: 45,
          opacity: 0,
          transition: { duration: 0.3, ease: 'easeOut' }
        };
      } else if (exitDirection === 'left') {
        return {
          x: -window.innerWidth - 200,
          y: -100,
          rotate: -45,
          opacity: 0,
          transition: { duration: 0.3, ease: 'easeOut' }
        };
      }
    }

    return {
      x: offsetX,
      rotate: offsetX * 0.05,
      transition: startX ? { type: 'just' } : { duration: 0.3 }
    };
  };

  // Handle button click swipes
  const handleButtonSwipe = (direction) => {
    if (isExiting) return;

    setExitDirection(direction);
    setIsExiting(true);

    setTimeout(() => {
      onSwipe(job.id, direction);
    }, 300);
  };

  // Safely access properties with defaults
  const title = job?.title || 'No Title';
  const company = job?.company || 'Unknown Company';
  const location = job?.location || 'Location not specified';
  const salary = job?.salary || 'Salary not specified';
  const description = job?.description || 'No description available';
  const requirements = job?.requirements || [];
  const sourceWebsite = job?.sourceWebsite || '';
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        ...getCardStyle()
      }}
      ref={cardRef}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md mx-auto relative select-none cursor-pointer border border-gray-200 dark:border-gray-700 min-h-[470px] w-full  overflow-hidden touch-pan-y dark:text-white"
      onMouseEnter={() => window.innerWidth > 768 && setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onClick={showDetails}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/10 pointer-events-none" />

      {/* Content */}
      <motion.div
        animate={{ y: isHovered && !isExiting ? -5 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
          {sourceWebsite && (
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-full font-medium"
            >
              {sourceWebsite}
            </motion.span>
          )}
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-white">{company}</h3>
          <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 mt-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>{location}</p>
          </div>
          <div className="text-sm font-medium text-green-600 mt-1 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{salary}</p>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-4 overflow-hidden text-ellipsis line-clamp-3">{description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {requirements.length > 0 ? (
            <>
              {requirements.slice(0, 3).map((req, index) => (
                <motion.span
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs rounded-full font-medium text-gray-700 dark:text-gray-300"
                >
                  {req}
                </motion.span>
              ))}
              {requirements.length > 3 && (
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs rounded-full font-medium text-gray-700 dark:text-gray-300"
                >
                  +{requirements.length - 3} more
                </motion.span>
              )}
            </>
          ) : (
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs rounded-full font-medium text-gray-700 dark:text-gray-300"
            >
              No requirements listed
            </motion.span>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              handleButtonSwipe('left');
            }}
            className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-full text-red-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              handleButtonSwipe('right');
            }}
            className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full text-green-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </motion.button>
        </div>
      </motion.div>

      {/* Swipe indicators */}
      <motion.div
        animate={{
          opacity: offsetX > 50 ? 1 : 0,
          x: 20,
          y: 20,
        }}
        className="absolute  top-0 right-0 bg-green-500 text-white p-2 rounded-full"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>

      <motion.div
        animate={{
          opacity: offsetX < -50 ? 1 : 0,
          x: -20,
          y: 20,
        }}
        className="absolute top-0 left-0 bg-red-500 text-white p-2 rounded-full"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </motion.div>

      {/* Drag instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-3 left-0 right-0 text-center text-sm text-gray-400 dark:text-gray-500"
      >
        Swipe or drag to decide
      </motion.div>
    </motion.div>
  );
}

export default JobCard; 