import React,{ useState, useRef, useEffect } from 'react';
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
      if (direction === 'right') {
        window.open(job.postUrl, '_blank');
      }
    }, 300);
  };
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        ...getCardStyle()
      }}
      ref={cardRef}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md mx-auto relative select-none cursor-pointer border border-gray-200 dark:border-gray-700 min-h-[360px] w-full  overflow-hidden touch-pan-y dark:text-white"
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
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{job.title}</h2>
          <motion.span 
            whileHover={{ scale: 1.05 }}
            className="bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-full font-medium"
          >
            {job.sourceWebsite}
          </motion.span>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-white">{job.company}</h3>
          <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 mt-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>{job.location}</p>
          </div>
          <div className="text-sm font-medium text-green-600 mt-1 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{job.salary}</p>
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 overflow-hidden text-ellipsis line-clamp-3">{job.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {job.requirements.slice(0, 3).map((req, index) => (
            <motion.span
              key={index}
              whileHover={{ scale: 1.05 }}
              className="bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs rounded-full font-medium text-gray-700 dark:text-gray-300"
            >
              {req}
            </motion.span>
          ))}
          {job.requirements.length > 3 && (
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs rounded-full font-medium text-gray-700 dark:text-gray-300"
            >
              +{job.requirements.length - 3} more
            </motion.span>
          )}
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-300 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Posted: {job.postedDate}
        </div>
      </motion.div>

      {/* Swipe indicators */}
      <AnimatePresence>
        {(Math.abs(offsetX) > 50 || isExiting) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className={`absolute top-4 ${(offsetX > 0 || exitDirection === 'right') ? 'right-4' : 'left-4'} ${
              (offsetX > 0 || exitDirection === 'right') ? 'rotate-12 text-green-500 border-green-500' : '-rotate-12 text-red-500 border-red-500'
            } text-2xl font-bold p-2 rounded-lg border-4 backdrop-blur-sm bg-white/30 dark:bg-gray-800`}
          >
            {(offsetX > 0 || exitDirection === 'right') ? 'APPLY' : 'PASS'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered && !isExiting && !isDragging ? 1 : 0 }}
        className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-gray-800 dark:via-gray-800/90"
      >
        <div className="flex justify-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="bg-red-500 text-white px-6 py-2 rounded-full font-medium shadow-lg hover:bg-red-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleButtonSwipe('left');
            }}
          >
            Pass
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="bg-green-500 text-white px-6 py-2 rounded-full font-medium shadow-lg hover:bg-green-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleButtonSwipe('right');
            }}
          >
            Apply
          </motion.button>
        </div>
      </motion.div>
      
      {/* Swipe instruction overlay - shown briefly when card appears */}
      <AnimatePresence>
        {index === 0 && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: startX || isHovered ? 0 : 0.7 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-xl pointer-events-none"
          >
            <div className="text-white text-center">
              <div className="flex justify-center items-center gap-16 mb-4">
                {/* Pass (Left) Arrow */}
                <motion.div
                  className="flex flex-col items-center"
                  animate={{ 
                    x: [-10, 0, -10],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    ease: "easeInOut"
                  }}
                >
                  <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="text-sm mt-1 font-medium text-red-300">Pass</span>
                </motion.div>

                {/* Apply (Right) Arrow */}
                <motion.div
                  className="flex flex-col items-center"
                  animate={{ 
                    x: [10, 0, 10],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    ease: "easeInOut"
                  }}
                >
                  <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <span className="text-sm mt-1 font-medium text-green-300">Apply</span>
                </motion.div>
              </div>
              <p className="text-xl font-medium">Swipe to decide</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default JobCard; 