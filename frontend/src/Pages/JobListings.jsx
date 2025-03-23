import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useJobContext } from '../context/JobContext';
import api from '../services/api';

function JobListings() {
  const { savedJobs, saveJob, viewedJobs, markJobAsViewed } = useJobContext();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [paginationInfo, setPaginationInfo] = useState(null);

  // Fetch jobs from API with pagination
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const user= JSON.parse(localStorage.getItem('user'));
        console.log(user.id);
        // const response = await api.get(`/api/jobs?page=${currentPage}&limit=20`);
        const response = await api.get(`/api/jobs/getRecommendation/${user.id}?page=${currentPage}&limit=20`);

        
        if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
          console.error('Invalid API response format:', response.data);
          setJobs([]);
          return;
        }

        // Process the pagination information
        setPaginationInfo(response.data.pagination);
        setTotalPages(response.data.pagination.pages);

        const processedJobs = response.data.data.map(job => ({
          id: job._id,
          title: job.title || 'No title',
          company: job.company || 'No company',
          location: job.jobDetails?.location || 'Location not specified',
          description: job.description || 'No description',
          requirements: job.skills || [],
          salary: job.jobDetails?.salary || 'Salary not specified',
          type: job.jobDetails?.employmentType || 'Type not specified',
          postedDate: job.jobDetails?.postedDate || 'Date not specified',
          applyLink: job.applyLink || '#',
          companyDetails: job.companyDetails || {}
        }));
        
        setJobs(processedJobs);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        console.error('Error details:', error.response?.data);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [currentPage]); // Re-fetch when page changes

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveJob = (job) => {
    saveJob({...job, savedDate: new Date().toISOString()});
  };
  
  const handleViewJob = (jobId) => {
    markJobAsViewed(jobId);
  };

  // Render pagination controls
  const renderPagination = () => {
    if (!paginationInfo || paginationInfo.pages <= 1) return null;
    
    const pages = [];
    // Always show first page
    pages.push(
      <button
        key="first"
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded ${
          currentPage === 1
            ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
            : 'bg-white text-blue-600 dark:bg-gray-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700'
        }`}
      >
        1
      </button>
    );

    // For many pages, add ellipsis and show pages around current page
    if (paginationInfo.pages > 7) {
      // Show dots after page 1 if current page is not close to the beginning
      if (currentPage > 3) {
        pages.push(
          <span key="dots1" className="px-3 py-1">
            ...
          </span>
        );
      }

      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(paginationInfo.pages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={`px-3 py-1 rounded ${
              currentPage === i
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-white text-blue-600 dark:bg-gray-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700'
            }`}
          >
            {i}
          </button>
        );
      }

      // Show dots before last page if current page is not close to the end
      if (currentPage < paginationInfo.pages - 2) {
        pages.push(
          <span key="dots2" className="px-3 py-1">
            ...
          </span>
        );
      }
    } else {
      // For fewer pages, show all page numbers
      for (let i = 2; i < paginationInfo.pages; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={`px-3 py-1 rounded ${
              currentPage === i
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-white text-blue-600 dark:bg-gray-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700'
            }`}
          >
            {i}
          </button>
        );
      }
    }

    // Always show last page if there's more than one page
    if (paginationInfo.pages > 1) {
      pages.push(
        <button
          key="last"
          onClick={() => handlePageChange(paginationInfo.pages)}
          disabled={currentPage === paginationInfo.pages}
          className={`px-3 py-1 rounded ${
            currentPage === paginationInfo.pages
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-white text-blue-600 dark:bg-gray-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700'
          }`}
        >
          {paginationInfo.pages}
        </button>
      );
    }

    return (
      <div className="flex justify-center items-center space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!paginationInfo.hasPrevPage}
          className={`px-3 py-1 rounded ${
            !paginationInfo.hasPrevPage
              ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
              : 'bg-white text-blue-600 dark:bg-gray-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700'
          }`}
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!paginationInfo.hasNextPage}
          className={`px-3 py-1 rounded ${
            !paginationInfo.hasNextPage
              ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
              : 'bg-white text-blue-600 dark:bg-gray-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700'
          }`}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="container mx-auto pt-8 px-4 pb-8">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Job Listings</h1>
          <p className="text-gray-600 dark:text-gray-300">Browse all available positions</p>
        </div>
      </motion.div>
      
      <div className="w-full">
        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {paginationInfo ? `${paginationInfo.total} total jobs, showing ${jobs.length}` : `${jobs.length} jobs found`}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded ${viewMode === 'cards' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Job list */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No jobs found</h2>
            <p className="text-gray-500 dark:text-gray-400">Please try again later.</p>
          </div>
        ) : (
          <div className={`grid ${viewMode === 'cards' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-2' : 'grid-cols-1'} gap-4`}>
            <AnimatePresence>
              {jobs.map(job => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 ${viewMode === 'list' ? 'flex' : ''}`}
                >
                  {viewMode === 'list' ? (
                    <>
                      <div className="p-4 flex-grow">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                          <div>
                            <Link 
                              to={`/job/${job.id}`} 
                              onClick={() => handleViewJob(job.id)}
                              className="text-lg font-semibold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              {job.title}
                            </Link>
                            
                            <div className="flex flex-wrap items-center gap-x-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <span>{job.company}</span>
                              <span>•</span>
                              <span>{job.location}</span>
                              {viewedJobs.includes(job.id) && (
                                <>
                                  <span>•</span>
                                  <span className="text-purple-600 dark:text-purple-400">Viewed</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-green-600 dark:text-green-400 font-medium">{job.salary}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{job.postedDate}</div>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex flex-wrap gap-2">
                          {job.requirements.slice(0, 3).map((req, i) => (
                            <span 
                              key={i}
                              className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs text-gray-700 dark:text-gray-300"
                            >
                              {req}
                            </span>
                          ))}
                          {job.requirements.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{job.requirements.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col justify-center border-l border-gray-100 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                        <a 
                          href={job.applyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 text-white px-4 py-2 rounded text-sm text-center hover:bg-blue-700 transition-colors mb-2"
                        >
                          Apply Now
                        </a>
                        <button
                          onClick={() => handleSaveJob(job)}
                          disabled={savedJobs.some(j => j.id === job.id)}
                          className={`px-4 py-2 rounded text-sm text-center border ${
                            savedJobs.some(j => j.id === job.id)
                              ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                          }`}
                        >
                          {savedJobs.some(j => j.id === job.id) ? 'Saved' : 'Save Job'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <Link 
                          to={`/job/${job.id}`}
                          onClick={() => handleViewJob(job.id)}
                          className="text-lg font-semibold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2"
                        >
                          {job.title}
                        </Link>
                        
                        <button
                          onClick={() => handleSaveJob(job)}
                          disabled={savedJobs.some(j => j.id === job.id)}
                          className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                        >
                          {savedJobs.some(j => j.id === job.id) ? (
                            <svg className="w-6 h-6 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {job.company} • {job.location}
                        </div>
                        <div className="text-green-600 dark:text-green-400 font-medium text-sm">
                          {job.salary}
                        </div>
                      </div>
                      
                      <p className="mt-3 text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
                        {job.description}
                      </p>
                      
                      <div className="mt-3 flex flex-wrap gap-2">
                        {job.requirements.slice(0, 3).map((req, i) => (
                          <span 
                            key={i}
                            className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs text-gray-700 dark:text-gray-300"
                          >
                            {req}
                          </span>
                        ))}
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {job.postedDate}
                          {viewedJobs.includes(job.id) && (
                            <span className="ml-2 text-purple-600 dark:text-purple-400">• Viewed</span>
                          )}
                        </span>
                        
                        <a 
                          href={job.applyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
                        >
                          Apply Now →
                        </a>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && jobs.length > 0 && renderPagination()}
      </div>
    </div>
  );
}

export default JobListings; 