import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

function JobListings() {
  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [paginationInfo, setPaginationInfo] = useState(null);
  const [isRecommended, setIsRecommended] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [filters, setFilters] = useState({
    remote: false,
    hybrid: false,
    office: false,
    linkedin: false,
    indeed: false,
    glassdoor: false,
    naukri: false,
    internshala: false,
    other: false,
    entry: false,
    mid: false,
    senior: false,
    showLocationTypeDropdown: false,
    showSeniorityDropdown: false,
    showCompanyDropdown: false
  });
  const [skillFilter, setSkillFilter] = useState('');
  const [skillMatchPercentage, setSkillMatchPercentage] = useState(0);
  const [skillMatchRange, setSkillMatchRange] = useState('');

  // Add handlePageChange function
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Fetch jobs with filters
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user'));
        let response;

        // Build source filter parameter
        const sourceFilters = Object.entries(filters)
          .filter(([key, value]) => value && ['linkedin', 'indeed', 'glassdoor', 'naukri', 'internshala', 'other'].includes(key))
          .map(([key]) => key)
          .join(',');

        // Build work type filter parameter
        const workTypeFilters = Object.entries(filters)
          .filter(([key, value]) => value && ['remote', 'hybrid', 'office'].includes(key))
          .map(([key]) => key)
          .join(',');
          
        // Build seniority filter parameter
        const seniorityFilters = Object.entries(filters)
          .filter(([key, value]) => value && ['entry', 'mid', 'senior'].includes(key))
          .map(([key]) => key)
          .join(',');

        // Build query parameters
        const queryParams = new URLSearchParams({
          page: currentPage,
          limit: 20,
          search: searchQuery,
          location: locationQuery
        });

        // Only add parameters if they have values
        if (workTypeFilters) queryParams.append('workType', workTypeFilters);
        if (sourceFilters) queryParams.append('source', sourceFilters);
        if (skillFilter) queryParams.append('skills', skillFilter);
        if (seniorityFilters) queryParams.append('seniority', seniorityFilters);
        
        // Add skill match percentage if user is logged in and percentage > 0
        if (user?.id && skillMatchPercentage > 0) {
          queryParams.append('skillMatchPercentage', skillMatchPercentage);
          queryParams.append('userId', user.id);
        }
        
        // Add skill match range if selected and user is logged in
        if (user?.id && skillMatchRange) {
          let minMatch = 0;
          let maxMatch = 100;
          
          if (skillMatchRange === 'less5') {
            maxMatch = 5;
          } else if (skillMatchRange === '5to25') {
            minMatch = 5;
            maxMatch = 25;
          } else if (skillMatchRange === '25to50') {
            minMatch = 25;
            maxMatch = 50;
          } else if (skillMatchRange === '50to75') {
            minMatch = 50;
            maxMatch = 75;
          } else if (skillMatchRange === '75plus') {
            minMatch = 75;
            maxMatch = 100;
          }
          
          queryParams.append('skillMatchMin', minMatch);
          queryParams.append('skillMatchMax', maxMatch);
          queryParams.append('userId', user.id);
        }

        if (user?.id) {
          response = await api.get(`/api/jobs/getRecommendation/${user.id}?${queryParams}`);
          
          setIsRecommended(true);
          try {
            const savedJobsResponse = await api.get(`/api/users/${user.id}/savedJobs`);
            if (savedJobsResponse.data?.savedJobs) {
              setSavedJobIds(savedJobsResponse.data.savedJobs.map(job => job._id || job));
            }
          } catch (error) {
            console.error('Error fetching saved jobs:', error);
          }
        } else {
          response = await api.get(`/api/jobs?${queryParams}`);
          setIsRecommended(false);
        }

        if (!response.data?.data || !Array.isArray(response.data.data)) {
          console.error('Invalid API response format:', response.data);
          setJobs([]);
          return;
        }

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
          companyDetails: job.companyDetails || {},
          source: job.source || 'Unknown source',
          skillMatchPercentage: job.skillMatchPercentage
        }));

        // Sort jobs by skill match percentage if filtering by skills
        if (skillMatchPercentage > 0) {
          setJobs(processedJobs.sort((a, b) => 
            (b.skillMatchPercentage || 0) - (a.skillMatchPercentage || 0)
          ));
        } else {
          setJobs(processedJobs);
        }
        
        // Make sure pagination is set consistently regardless of endpoint
        if (response.data.pagination) {
          setPaginationInfo(response.data.pagination);
          setTotalPages(response.data.pagination.pages);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [currentPage, searchQuery, locationQuery, filters, skillFilter, skillMatchPercentage, skillMatchRange]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  const toggleFilter = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
    setCurrentPage(1);
  };

  const handleCardClick = (jobId) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  // Add handler for Apply button clicks
  const handleApplyClick = async (jobId, applyLink, e) => {
    e.preventDefault(); // Prevent the link/card click from triggering
    e.stopPropagation(); // Prevent event bubbling to parent elements
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token'); // Don't parse token as JSON

      if (user && user.id && token) {
        // Record the application
        await api.post(`/api/jobs/${jobId}/apply`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Open the apply link in a new tab
      window.open(applyLink, '_blank');
    } catch (error) {
      console.error('Error recording job application:', error);
      window.open(applyLink, '_blank');
    }
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
        className={`px-3 py-1 rounded ${currentPage === 1
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
            className={`px-3 py-1 rounded ${currentPage === i
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
            className={`px-3 py-1 rounded ${currentPage === i
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
          className={`px-3 py-1 rounded ${currentPage === paginationInfo.pages
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
          className={`px-3 py-1 rounded ${!paginationInfo.hasPrevPage
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
          className={`px-3 py-1 rounded ${!paginationInfo.hasNextPage
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
    <div className="container mx-auto p-10 md:p-20">
      {/* Search Section */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Position, title, keywords"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Location"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full md:w-auto px-6 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3">
          {skillFilter && (
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center">
              <span>Skill: {skillFilter}</span>
              <button 
                onClick={() => setSkillFilter('')}
                className="ml-2 text-white hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {skillMatchRange && (
            <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center">
              <span>
                Skill Match: {skillMatchRange === 'less5' ? 'Less than 5%' : 
                  skillMatchRange === '5to25' ? '5% - 25%' : 
                  skillMatchRange === '25to50' ? '25% - 50%' : 
                  skillMatchRange === '50to75' ? '50% - 75%' : 
                  skillMatchRange === '75plus' ? '75% or more' : ''}
              </span>
              <button 
                onClick={() => setSkillMatchRange('')}
                className="ml-2 text-white hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleFilter('remote')}
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1 ${filters.remote
                ? 'bg-yellow-400 dark:bg-yellow-500 text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                } hover:bg-yellow-500 dark:hover:bg-yellow-400 transition-colors`}
            >
              <span>Remote / WFH</span>
              {filters.remote && (
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              onClick={() => toggleFilter('hybrid')}
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1 ${filters.hybrid
                ? 'bg-yellow-400 dark:bg-yellow-500 text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                } hover:bg-yellow-500 dark:hover:bg-yellow-400 transition-colors`}
            >
              <span>Hybrid</span>
              {filters.hybrid && (
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              onClick={() => toggleFilter('office')}
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1 ${filters.office
                ? 'bg-yellow-400 dark:bg-yellow-500 text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                } hover:bg-yellow-500 dark:hover:bg-yellow-400 transition-colors`}
            >
              <span>In-Office</span>
              {filters.office && (
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleFilter('linkedin')}
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1 ${filters.linkedin
                ? 'bg-blue-500 text-white'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                } hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors`}
            >
              LinkedIn
            </button>
            <button
              onClick={() => toggleFilter('indeed')}
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1 ${filters.indeed
                ? 'bg-blue-500 text-white'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                } hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors`}
            >
              Indeed
            </button>
            <button
              onClick={() => toggleFilter('glassdoor')}
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1 ${filters.glassdoor
                ? 'bg-blue-500 text-white'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                } hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors`}
            >
              Glassdoor
            </button>
            <button
              onClick={() => toggleFilter('naukri')}
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1 ${filters.naukri
                ? 'bg-blue-500 text-white'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                } hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors`}
            >
              Naukri
            </button>
            <button
              onClick={() => toggleFilter('internshala')}
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1 ${filters.internshala
                ? 'bg-blue-500 text-white'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                } hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors`}
            >
              Internshala
            </button>
          </div>
          
          <button
            onClick={() => {
              setFilters({
                remote: false,
                hybrid: false,
                office: false,
                linkedin: false,
                indeed: false,
                glassdoor: false,
                naukri: false,
                internshala: false,
                other: false,
                entry: false,
                mid: false,
                senior: false,
                showLocationTypeDropdown: false,
                showSeniorityDropdown: false,
                showCompanyDropdown: false
              });
              setSearchQuery('');
              setLocationQuery('');
              setSkillFilter('');
              setSkillMatchPercentage(0);
              setSkillMatchRange('');
            }}
            className="px-6 py-3 rounded-full text-white hover:bg-gray-800 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Skill Match Percentage Slider */}
        {JSON.parse(localStorage.getItem('user'))?.id && (
          <div className="mt-6 px-4 py-5 bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <label className="text-white font-medium">Skill Match Range</label>
              {skillMatchRange && (
                <span className="text-white font-bold">
                  {skillMatchRange === 'less5' ? 'Less than 5%' : 
                   skillMatchRange === '5to25' ? '5% - 25%' : 
                   skillMatchRange === '25to50' ? '25% - 50%' : 
                   skillMatchRange === '50to75' ? '50% - 75%' : 
                   skillMatchRange === '75plus' ? '75% or more' : ''}
                </span>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2">
              <button 
                onClick={() => {
                  setSkillMatchRange(skillMatchRange === 'less5' ? '' : 'less5');
                  setSkillMatchPercentage(0); // Reset the old slider value
                }}
                className={`py-2 px-3 rounded text-sm ${
                  skillMatchRange === 'less5' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                &lt;5%
              </button>
              <button 
                onClick={() => {
                  setSkillMatchRange(skillMatchRange === '5to25' ? '' : '5to25');
                  setSkillMatchPercentage(0); // Reset the old slider value
                }}
                className={`py-2 px-3 rounded text-sm ${
                  skillMatchRange === '5to25' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                5-25%
              </button>
              <button 
                onClick={() => {
                  setSkillMatchRange(skillMatchRange === '25to50' ? '' : '25to50');
                  setSkillMatchPercentage(0); // Reset the old slider value
                }}
                className={`py-2 px-3 rounded text-sm ${
                  skillMatchRange === '25to50' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                25-50%
              </button>
              <button 
                onClick={() => {
                  setSkillMatchRange(skillMatchRange === '50to75' ? '' : '50to75');
                  setSkillMatchPercentage(0); // Reset the old slider value
                }}
                className={`py-2 px-3 rounded text-sm ${
                  skillMatchRange === '50to75' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                50-75%
              </button>
              <button 
                onClick={() => {
                  setSkillMatchRange(skillMatchRange === '75plus' ? '' : '75plus');
                  setSkillMatchPercentage(0); // Reset the old slider value
                }}
                className={`py-2 px-3 rounded text-sm ${
                  skillMatchRange === '75plus' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                ≥75%
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Found {paginationInfo?.totalDocs || 0} jobs
        </p>
      </div>

      {/* Job Cards */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
            No jobs found
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {jobs.map(job => (
            <Link
              key={job.id}
              to={`/job/${job.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {job.source}
                    </span>
                    {job.skillMatchPercentage !== undefined && (
                      <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {job.skillMatchPercentage}% match
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>{job.location}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{job.salary}</span>
                <span className="text-gray-400">•</span>
                <span>{job.type}</span>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  {job.companyDetails?.logo ? (
                    <img src={job.companyDetails.logo} alt={job.company} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {job.company.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{job.company}</span>
                </div>
                <a
                  href="#"
                  onClick={(e) => handleApplyClick(job.id, job.applyLink, e)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Apply
                </a>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && jobs.length > 0 && renderPagination()}
    </div>
  );
}

export default JobListings; 