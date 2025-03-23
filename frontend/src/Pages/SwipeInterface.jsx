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
    <div className="container mx-auto pt-2 px-4">
      {/* More intuitive swipe animation */}
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