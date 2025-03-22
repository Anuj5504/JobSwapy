import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState } from 'react';


function Home() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleFilterChange = (type, value) => {
    updateFilters({ ...filters, [type]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-700">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-16 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            Your Dream Job is One
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="block"
            >
              Interaction Away
            </motion.span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            Choose your preferred way to discover opportunities
          </p>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Swipe Jobs Card */}
            <Link to="/swipe">
              <motion.div
                whileHover={{ y: -10, scale: 1.02 }}
                onHoverStart={() => setHoveredCard('swipe')}
                onHoverEnd={() => setHoveredCard(null)}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden group cursor-pointer"
              >
                <div className="p-8">
                  <div className="flex justify-center mb-6">
                    <motion.div
                      animate={hoveredCard === 'swipe' ? { rotate: [0, -15, 15, -15, 15, 0] } : {}}
                      transition={{ duration: 1.5 }}
                      className="w-20 h-20 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center"
                    >
                      <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </motion.div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Swipe Jobs</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Discover opportunities with our innovative swipe interface. Quick, intuitive, and fun way to find your next role.
                  </p>
                  <motion.div
                    animate={hoveredCard === 'swipe' ? { x: [0, 5, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="text-blue-600 dark:text-blue-400 font-medium flex items-center"
                  >
                    Start Swiping
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </motion.div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-600/20 dark:to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </Link>

            {/* Browse Jobs Card */}
            <Link to="/jobs">
              <motion.div
                whileHover={{ y: -10, scale: 1.02 }}
                onHoverStart={() => setHoveredCard('browse')}
                onHoverEnd={() => setHoveredCard(null)}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden group cursor-pointer"
              >
                <div className="p-8">
                  <div className="flex justify-center mb-6">
                    <motion.div
                      animate={hoveredCard === 'browse' ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 1.5 }}
                      className="w-20 h-20 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center"
                    >
                      <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </motion.div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Browse Jobs</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Traditional job search with powerful filters. Perfect for targeted searches and detailed exploration.
                  </p>
                  <motion.div
                    animate={hoveredCard === 'browse' ? { x: [0, 5, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="text-purple-600 dark:text-purple-400 font-medium flex items-center"
                  >
                    Start Browsing
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </motion.div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 dark:from-purple-600/20 dark:to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </Link>
          </div>

          {/* Stats Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">10k+</div>
              <div className="text-gray-600 dark:text-gray-400">Active Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">5k+</div>
              <div className="text-gray-600 dark:text-gray-400">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-600 dark:text-pink-400 mb-2">50k+</div>
              <div className="text-gray-600 dark:text-gray-400">Job Seekers</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-blue-500/20 dark:bg-blue-400/20"
              animate={{
                x: [
                  Math.random() * window.innerWidth,
                  Math.random() * window.innerWidth,
                ],
                y: [
                  Math.random() * window.innerHeight,
                  Math.random() * window.innerHeight,
                ],
              }}
              transition={{
                duration: Math.random() * 10 + 20,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home; 