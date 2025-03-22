import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SwipeableJobStack from '../components/SwipeableJobStack';
import { useJobContext } from '../context/JobContext';

function SwipeInterface() {
  const { filters, updateFilters } = useJobContext();
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [demoStep, setDemoStep] = useState(0); // 0: initial, 1: finger appears, 2: swipe right, 3: swipe left

  // Auto-play the demo animation in sequence
  useEffect(() => {
    const interval = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % 4);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const handleFilterChange = (type, value) => {
    updateFilters({ ...filters, [type]: value });
  };

  return (
    <div className="container mx-auto pt-4 px-4">
      {/* More intuitive swipe animation */}
      <div className="max-w-md mx-auto mb-10 h-36 relative">
        <div className="text-center mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {demoStep === 0 && "Swipe cards to apply or pass"}
            {demoStep === 2 && "Swipe right to apply 👍"}
            {demoStep === 3 && "Swipe left to pass 👎"}
          </span>
        </div>
        
        <div className="relative flex justify-center items-center">
          {/* Demo Card */}
          <motion.div 
            animate={{ 
              x: demoStep === 2 ? 80 : demoStep === 3 ? -80 : 0,
              rotateZ: demoStep === 2 ? 10 : demoStep === 3 ? -10 : 0,
              opacity: demoStep === 0 || demoStep === 1 ? 1 : 0.7
            }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md w-60 h-28 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700 relative z-10"
          >
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-1">
              <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Job Title</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Company Name</div>
            
            {/* Action Labels */}
            <AnimatePresence>
              {demoStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -right-3 top-1/2 -translate-y-1/2"
                >
                  <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </motion.div>
              )}
              {demoStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -left-3 top-1/2 -translate-y-1/2"
                >
                  <div className="bg-red-100 dark:bg-red-900/30 p-1 rounded-full">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Improved Hand/Cursor Animation */}
          <AnimatePresence>
            {(demoStep === 1 || demoStep === 2 || demoStep === 3) && (
              <motion.div 
                key="cursor"
                initial={{ 
                  opacity: 0, 
                  x: 0, 
                  y: 20 
                }}
                animate={{ 
                  opacity: 1,
                  x: demoStep === 1 ? 0 : demoStep === 2 ? 60 : -60,
                  y: demoStep === 1 ? 0 : demoStep === 2 || demoStep === 3 ? -5 : 0,
                  scale: demoStep === 1 ? 1 : 0.9
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: demoStep === 1 ? 0.3 : 0.5,
                  ease: "easeInOut" 
                }}
                className="absolute z-30 pointer-events-none"
                style={{ 
                  transformOrigin: "bottom center",
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))"
                }}
              >
                {/* Pointing hand icon */}
                <svg 
                  width="36" 
                  height="36" 
                  viewBox="0 0 24 24" 
                  className="text-gray-800 dark:text-gray-200"
                  style={{ 
                    transform: `rotate(${demoStep === 2 ? -30 : demoStep === 3 ? 30 : 0}deg) scale(${demoStep === 1 ? 1 : 1.2})` 
                  }}
                >
                  <path 
                    fill="currentColor" 
                    d="M12.547 20.961c1.064.02 2.453-.183 3.532-.76 1.317-.703 2.088-1.82 2.328-3.264.139-.844.045-1.683-.283-2.455.433-.277.79-.635 1.061-1.055.598-.927.758-2.018.483-3.054-.142-.532-.383-.98-.687-1.345.309-.276.568-.607.756-.975.32-.627.376-1.432.155-2.21a3.086 3.086 0 0 0-.933-1.476C18.497 3.97 18.055 3.8 17.597 3.8H5.5a1 1 0 0 0 0 2h7v1h-2.5a1 1 0 0 0 0 2h2.5v1h-.5a1 1 0 0 0 0 2h.5v1h-1a1 1 0 0 0 0 2h1v1h-2a1 1 0 0 0 0 2h2c.142 1.272.352 2.654 2.046 3.161zM5.5 9a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-1z" 
                  />
                </svg>
                
                {/* Optional trail effect */}
                {(demoStep === 2 || demoStep === 3) && (
                  <motion.div 
                    className="absolute top-0 left-0 w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.2, 0] }}
                    transition={{ duration: 0.5, repeat: 1 }}
                  >
                    <div className={`w-6 h-6 rounded-full bg-${demoStep === 2 ? 'green' : 'red'}-400 opacity-20`}></div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Left/Right indicators */}
          <motion.div 
            animate={{ opacity: demoStep === 3 ? 1 : 0.4 }}
            className="absolute left-2 top-1/3 flex flex-col items-center"
          >
            <div className="bg-red-100 dark:bg-red-900/30 p-1 rounded-full mb-1">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            <span className="text-xs font-medium text-red-600 dark:text-red-400">Pass</span>
          </motion.div>

          <motion.div 
            animate={{ opacity: demoStep === 2 ? 1 : 0.4 }}
            className="absolute right-2 top-1/3 flex flex-col items-center"
          >
            <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full mb-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400">Apply</span>
          </motion.div>
        </div>
      </div>
      
      {/* Filter Toggle Button - For Both Mobile and Desktop */}
      <div className="flex justify-center mb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>{isFilterExpanded ? 'Hide Filters' : 'Show Filters'}</span>
        </motion.button>
      </div>
      
      {/* Main Content Area - Consistent Layout */}
      <div className="flex flex-col gap-4">
        {/* Filters Panel */}
        <AnimatePresence>
          {isFilterExpanded && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full overflow-hidden"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-800 dark:text-white">Filters</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Location Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="City, state, or remote"
                      value={filters.location || ''}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  {/* Job Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Job Type
                    </label>
                    <select
                      value={filters.jobType || ''}
                      onChange={(e) => handleFilterChange('jobType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">All Types</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                  
                  {/* Experience Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Experience
                    </label>
                    <select
                      value={filters.experience || ''}
                      onChange={(e) => handleFilterChange('experience', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Any Experience</option>
                      <option value="entry">Entry Level</option>
                      <option value="mid">Mid Level</option>
                      <option value="senior">Senior Level</option>
                    </select>
                  </div>
                  
                  {/* Remote Option */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remote"
                      checked={filters.remote || false}
                      onChange={(e) => handleFilterChange('remote', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="remote" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Remote Only
                    </label>
                  </div>
                  
                  {/* Salary Range */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Min. Salary (₹LPA)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="5"
                      value={filters.minSalary || 0}
                      onChange={(e) => handleFilterChange('minSalary', e.target.value)}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>₹{filters.minSalary || 0} LPA</span>
                      <span>₹50 LPA+</span>
                    </div>
                  </div>
                  
                  {/* Reset Button */}
                  <div>
                    <button
                      onClick={() => updateFilters({
                        location: '',
                        minSalary: '',
                        jobType: '',
                        remote: false,
                        experience: ''
                      })}
                      className="w-full px-3 py-2 mt-6 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Job Stack - Centered */}
        <div className="flex justify-center">
          <div className="w-full max-w-md mx-auto">
            <SwipeableJobStack filters={filters} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SwipeInterface; 