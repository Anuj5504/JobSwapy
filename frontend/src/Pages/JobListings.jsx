import React,{ useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { jobs } from '../data/sampleJobs';
import { useJobContext } from '../context/JobContext';
import JobFilters from '../components/JobFilters';

function JobListings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { filters, updateFilters, savedJobs, saveJob, viewedJobs, markJobAsViewed } = useJobContext();
  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || 'newest');
  const [viewMode, setViewMode] = useState(searchParams.get('view') || 'cards');

  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters = {
      location: searchParams.get('location') || '',
      jobType: searchParams.get('type') || '',
      remote: searchParams.get('remote') === 'true',
      experience: searchParams.get('exp') || '',
      minSalary: searchParams.get('salary') || '',
      keywords: searchParams.get('keywords')?.split(',').filter(Boolean) || []
    };
    updateFilters(urlFilters);
  }, []);

  // Update URL when filters change
  const handleFilterChange = (newFilters) => {
    const params = new URLSearchParams();
    
    if (newFilters.location) params.set('location', newFilters.location);
    if (newFilters.jobType) params.set('type', newFilters.jobType);
    if (newFilters.remote) params.set('remote', 'true');
    if (newFilters.experience) params.set('exp', newFilters.experience);
    if (newFilters.minSalary) params.set('salary', newFilters.minSalary);
    if (newFilters.keywords?.length) params.set('keywords', newFilters.keywords.join(','));
    
    params.set('sort', sortOption);
    params.set('view', viewMode);
    
    setSearchParams(params);
    updateFilters(newFilters);
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSortOption(newSort);
    searchParams.set('sort', newSort);
    setSearchParams(searchParams);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    searchParams.set('view', mode);
    setSearchParams(searchParams);
  };

  // Generate shareable link
  const getShareableLink = () => {
    const baseUrl = window.location.origin;
    const currentParams = searchParams.toString();
    return `${baseUrl}/jobs${currentParams ? `?${currentParams}` : ''}`;
  };

  // Copy link to clipboard
  const handleShareLink = async () => {
    const link = getShareableLink();
    try {
      await navigator.clipboard.writeText(link);
      // You could add a toast notification here
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    
    setTimeout(() => {
      let results = [...jobs];
      
      // Apply filters
      if (filters) {
        // Location filter
        if (filters.location) {
          const location = filters.location.toLowerCase();
          results = results.filter(job => 
            job.location.toLowerCase().includes(location)
          );
        }
        
        // Salary filter
        if (filters.minSalary) {
          const minSalary = parseInt(filters.minSalary);
          results = results.filter(job => {
            if (job.salary === 'Not Specified') return true;
            const salaryMatch = job.salary.match(/₹(\d+)-(\d+)/);
            if (salaryMatch) {
              const minJobSalary = parseInt(salaryMatch[1]) * 100000;
              return minJobSalary >= minSalary;
            }
            return true;
          });
        }
        
        // Remote filter
        if (filters.remote) {
          results = results.filter(job => 
            job.location.toLowerCase().includes('remote')
          );
        }
        
        // Keywords filter
        if (filters.keywords && filters.keywords.length > 0) {
          results = results.filter(job => {
            const jobText = `${job.title} ${job.company} ${job.description} ${job.requirements.join(' ')}`.toLowerCase();
            return filters.keywords.some(keyword => 
              jobText.includes(keyword.toLowerCase())
            );
          });
        }
      }
      
      // Apply sorting
      if (sortOption === 'newest') {
        results.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
      } else if (sortOption === 'salary-high') {
        results.sort((a, b) => {
          const getSalary = (job) => {
            if (job.salary === 'Not Specified') return 0;
            const match = job.salary.match(/₹(\d+)-(\d+)/);
            return match ? parseInt(match[2]) * 100000 : 0;
          };
          return getSalary(b) - getSalary(a);
        });
      } else if (sortOption === 'salary-low') {
        results.sort((a, b) => {
          const getSalary = (job) => {
            if (job.salary === 'Not Specified') return Infinity;
            const match = job.salary.match(/₹(\d+)-(\d+)/);
            return match ? parseInt(match[1]) * 100000 : Infinity;
          };
          return getSalary(a) - getSalary(b);
        });
      }
      
      setFilteredJobs(results);
      setLoading(false);
    }, 600);
  }, [filters, sortOption]);

  const handleSaveJob = (job) => {
    saveJob({...job, savedDate: new Date().toISOString()});
  };
  
  const handleViewJob = (jobId) => {
    markJobAsViewed(jobId);
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
        
        {/* Share Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShareLink}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Filters
        </motion.button>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-fit lg:sticky lg:top-20">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Filters</h2>
          <JobFilters filters={filters} onFilterChange={handleFilterChange} expanded />
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3">
          {/* Controls */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
              </span>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleViewModeChange('cards')}
                  className={`p-2 rounded ${viewMode === 'cards' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button 
                  onClick={() => handleViewModeChange('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
              
              <select
                value={sortOption}
                onChange={handleSortChange}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <option value="newest">Newest first</option>
                <option value="salary-high">Highest salary</option>
                <option value="salary-low">Lowest salary</option>
              </select>
            </div>
          </div>
          
          {/* Job list */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No jobs found</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Try adjusting your filters to see more results.</p>
              <button 
                onClick={() => updateFilters({
                  location: '',
                  minSalary: '',
                  jobType: '',
                  remote: false,
                  keywords: []
                })}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className={`grid ${viewMode === 'cards' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-2' : 'grid-cols-1'} gap-4`}>
              <AnimatePresence>
                {filteredJobs.map(job => (
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
                          <Link 
                            to={`/job/${job.id}`}
                            onClick={() => handleViewJob(job.id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm text-center hover:bg-blue-700 transition-colors mb-2"
                          >
                            View Details
                          </Link>
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
                          
                          <Link 
                            to={`/job/${job.id}`}
                            onClick={() => handleViewJob(job.id)}
                            className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
                          >
                            View Details →
                          </Link>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobListings; 