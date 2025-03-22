import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import SwipeableJobStack from '../components/SwipeableJobStack';
import { useJobContext } from '../context/JobContext';

function Home() {
  const { filters, updateFilters } = useJobContext();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isVisible, setIsVisible] = useState({});

  // For scroll-triggered animations
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.animate-on-scroll');
      sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const sectionId = section.id;
        if (sectionTop < window.innerHeight * 0.75) {
          setIsVisible(prev => ({ ...prev, [sectionId]: true }));
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on initial load
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFilterChange = (type, value) => {
    updateFilters({ ...filters, [type]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-700">
      {/* Hero Section - Simplified animated elements */}
      <div className="container mx-auto px-4 pt-16 pb-24 relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto relative z-10"
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
        
        {/* Simplified animated background elements */}
        <div className="absolute inset-0 -z-10">
          <motion.div
            className="absolute top-20 right-10 w-64 h-64 rounded-full bg-blue-200/30 dark:bg-blue-900/20 blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-purple-200/30 dark:bg-purple-900/20 blur-3xl"
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5]
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </div>
      </div>

      {/* REDESIGNED: How It Works Section */}
      <div id="how-it-works" className="py-24 bg-white dark:bg-gray-800 animate-on-scroll relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible["how-it-works"] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our streamlined process makes finding your dream job faster and more engaging than ever before
            </p>
          </motion.div>

          {/* Interactive timeline */}
          <div className="max-w-5xl mx-auto relative">
            {/* Timeline center line */}
            <motion.div 
              initial={{ height: 0 }}
              animate={isVisible["how-it-works"] ? { height: '100%' } : { height: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 h-full rounded-full z-0"
            />

            {[
              {
                title: "Create Your Profile",
                description: "Build a personalized profile showcasing your skills, experience, and career preferences to help us match you with the perfect opportunities.",
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
                color: "blue",
                position: "left"
              },
              {
                title: "Discover Opportunities",
                description: "Browse through curated job listings tailored to your profile, or use our innovative swipe interface for a more interactive experience.",
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
                color: "purple",
                position: "right"
              },
              {
                title: "Apply With Ease",
                description: "Submit applications directly through our platform with just a few clicks. Your profile information is automatically formatted for employers.",
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                color: "pink",
                position: "left"
              },
              {
                title: "Track & Connect",
                description: "Monitor application status in real-time, receive feedback, and connect directly with hiring managers through our messaging system.",
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                ),
                color: "indigo",
                position: "right"
              }
            ].map((step, index) => (
              <div key={index} className="relative z-10 mb-16 flex justify-center items-center">
                <motion.div
                  initial={{ opacity: 0, x: step.position === "left" ? -50 : 50 }}
                  animate={isVisible["how-it-works"] ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.2 }}
                  className={`bg-white dark:bg-gray-700 rounded-xl shadow-xl p-6 max-w-md ${
                    step.position === "left" ? "mr-auto" : "ml-auto"
                  }`}
                  style={{ width: "calc(50% - 30px)" }}
                >
                  <div className="flex items-start">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.5 }}
                      className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center bg-${step.color}-100 dark:bg-${step.color}-900/30 mr-4`}
                    >
                      <div className={`text-${step.color}-600 dark:text-${step.color}-400`}>
                        {step.icon}
                      </div>
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
                
                {/* Timeline dot */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isVisible["how-it-works"] ? { scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.2 }}
                  className={`absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-${step.color}-500 border-4 border-white dark:border-gray-800 z-20`}
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`absolute inset-0 rounded-full bg-${step.color}-500 opacity-60`}
                  />
                </motion.div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Background animated elements */}
        <div className="absolute top-1/2 left-10 transform -translate-y-1/2">
          <motion.div
            animate={{ 
              y: [0, 20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-lg bg-blue-100 dark:bg-blue-900/20 opacity-60"
          />
        </div>
        <div className="absolute bottom-20 right-10">
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 opacity-60"
          />
        </div>
      </div>

      {/* REDESIGNED: Popular Categories Section */}
      <div id="categories" className="py-24 bg-gray-50 dark:bg-gray-900 animate-on-scroll relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible["categories"] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
              Explore Popular Categories
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Browse through the most in-demand industries and discover opportunities that match your expertise
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={isVisible["categories"] ? { opacity: 1 } : {}}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[
                { name: "Technology", icon: "💻", count: 1420, color: "blue", jobs: ["Software Engineer", "Data Scientist", "Product Manager"] },
                { name: "Healthcare", icon: "🏥", count: 853, color: "green", jobs: ["Registered Nurse", "Medical Doctor", "Physical Therapist"] },
                { name: "Finance", icon: "💰", count: 612, color: "yellow", jobs: ["Financial Analyst", "Investment Banker", "Accountant"] },
                { name: "Marketing", icon: "📊", count: 548, color: "red", jobs: ["Digital Marketer", "Brand Manager", "SEO Specialist"] },
                { name: "Education", icon: "🎓", count: 435, color: "indigo", jobs: ["Teacher", "Professor", "Education Administrator"] },
                { name: "Design", icon: "🎨", count: 327, color: "pink", jobs: ["UX Designer", "Graphic Designer", "UI Developer"] }
              ].map((category, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isVisible["categories"] ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg group`}
                >
                  <div className={`h-3 bg-gradient-to-r from-${category.color}-500 to-${category.color}-600`} />
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        className={`w-14 h-14 rounded-lg flex items-center justify-center bg-${category.color}-100 dark:bg-${category.color}-900/30 mr-4`}
                      >
                        <span className="text-2xl">{category.icon}</span>
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                          {category.name}
                        </h3>
                        <div className={`text-${category.color}-600 dark:text-${category.color}-400 font-medium`}>
                          {category.count} open positions
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      {category.jobs.map((job, jobIndex) => (
                        <motion.div
                          key={jobIndex}
                          initial={{ opacity: 0, x: -10 }}
                          animate={isVisible["categories"] ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 0.4 + index * 0.1 + jobIndex * 0.1 }}
                          className="flex items-center"
                        >
                          <svg className={`w-4 h-4 mr-2 text-${category.color}-500`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-700 dark:text-gray-300">{job}</span>
                        </motion.div>
                      ))}
                    </div>
                    
                    <motion.div 
                      className={`mt-6 text-${category.color}-600 dark:text-${category.color}-400 flex items-center font-medium`}
                      whileHover={{ x: 5 }}
                    >
                      View all positions
                      <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible["categories"] ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-12 text-center"
            >
              <Link to="/jobs">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 15px 25px -5px rgba(0,0,0,0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-10 rounded-full font-medium hover:shadow-lg transition-all"
                >
                  Explore All Categories
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
        
        {/* Background animated elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ 
              y: [0, -50, 0],
              x: [0, 30, 0],
              rotate: [0, 10, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-[10%] top-[20%] w-40 h-40 rounded-full bg-purple-200/30 dark:bg-purple-900/20 blur-2xl"
          />
          <motion.div
            animate={{ 
              y: [0, 60, 0],
              x: [0, -40, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[15%] bottom-[25%] w-52 h-52 rounded-full bg-pink-200/30 dark:bg-pink-900/20 blur-2xl"
          />
        </div>
      </div>

      {/* NEW: Testimonials Section */}
      <div id="testimonials" className="py-24 bg-white dark:bg-gray-800 animate-on-scroll">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible["testimonials"] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Success Stories
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Hear from job seekers who found their dream positions through our platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {[
              {
                name: "Alex Morgan",
                role: "Software Engineer at TechCorp",
                image: "https://randomuser.me/api/portraits/women/32.jpg",
                quote: "The swipe interface made job hunting actually enjoyable! I found my dream role at a startup within just two weeks.",
                color: "blue"
              },
              {
                name: "James Wilson",
                role: "Marketing Manager at CreativeHQ",
                image: "https://randomuser.me/api/portraits/men/46.jpg",
                quote: "After months of traditional job searching, I found my perfect match using this platform in just days. The AI matching is incredible!",
                color: "purple"
              },
              {
                name: "Sarah Chen",
                role: "UX Designer at DesignLabs",
                image: "https://randomuser.me/api/portraits/women/65.jpg",
                quote: "The detailed job listings and company information helped me find a workplace culture that truly aligns with my values.",
                color: "pink"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible["testimonials"] ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 * index }}
                whileHover={{ y: -10 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-8 shadow-lg relative"
              >
                <div className={`absolute top-0 right-0 w-20 h-20 bg-${testimonial.color}-100 dark:bg-${testimonial.color}-900/30 rounded-bl-2xl rounded-tr-2xl flex items-center justify-center`}>
                  <svg className={`w-10 h-10 text-${testimonial.color}-600 dark:text-${testimonial.color}-400`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
                <div className="mb-6 flex items-center">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name} 
                    className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-white shadow-md" 
                  />
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{testimonial.name}</h3>
                    <p className={`text-sm text-${testimonial.color}-600 dark:text-${testimonial.color}-400`}>{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic">"{testimonial.quote}"</p>
                <motion.div 
                  className={`mt-6 text-${testimonial.color}-600 dark:text-${testimonial.color}-400 flex items-center text-sm font-semibold`}
                  whileHover={{ x: 5 }}
                >
                  Read full story
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* NEW: Call to Action Section */}
      <div id="cta" className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 animate-on-scroll">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isVisible["cta"] ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto text-center text-white"
          >
            <motion.h2 
              initial={{ y: 30, opacity: 0 }}
              animate={isVisible["cta"] ? { y: 0, opacity: 1 } : {}}
              className="text-4xl font-bold mb-6"
            >
              Ready to Transform Your Career Journey?
            </motion.h2>
            <motion.p 
              initial={{ y: 30, opacity: 0 }}
              animate={isVisible["cta"] ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.1 }}
              className="text-xl mb-10 text-blue-100"
            >
              Join thousands of professionals who have found their dream positions with our innovative approach
            </motion.p>
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={isVisible["cta"] ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Link to="/profile">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.15)" }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white text-blue-600 font-medium py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  Create Your Profile
                </motion.button>
              </Link>
              <Link to="/swipe">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.15)" }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-transparent border-2 border-white text-white font-medium py-3 px-8 rounded-full hover:bg-white/10 transition-all"
                >
                  Start Discovering
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Animated Background Elements */}
        {/* <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/10"
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: Math.random() * 100 + '%',
                scale: Math.random() * 0.5 + 0.5
              }}
              animate={{
                x: [
                  Math.random() * 100 + '%',
                  Math.random() * 100 + '%'
                ],
                y: [
                  Math.random() * 100 + '%',
                  Math.random() * 100 + '%'
                ],
              }}
              transition={{
                duration: Math.random() * 10 + 15,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                width: (Math.random() * 150 + 50) + 'px',
                height: (Math.random() * 150 + 50) + 'px',
              }}
            />
          ))}
        </div> */}
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