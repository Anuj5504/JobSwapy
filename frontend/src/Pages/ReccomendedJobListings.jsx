import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';

const ReccomendedJobListings = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobsPerPage, setJobsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [viewMode, setViewMode] = useState('row');

  const handleApplyClick = async (jobId, applyLink, e) => {
    e.preventDefault(); // Prevent the link/card click from triggering
    e.stopPropagation(); // Prevent event bubbling to parent elements
    console.log(jobId)
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

  useEffect(() => {
    fetchRecommendedJobs();
  }, [jobsPerPage]);

  const fetchRecommendedJobs = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        console.log("Please login");
        return;
      }
      setLoading(true);
      const response = await axios.get(`http://127.0.0.1:3000/api/recommendations/${user.id}`);
      if (response.data?.recommendations) {
        setJobs(response.data.recommendations);
      }
      console.log(`http://127.0.0.1:3000/api/recommendations/${user.id}`);
      console.log("Recommended jobs fetched:", response.data.recommendations);
    } catch (error) {
      console.error('Error fetching recommended jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs
    .filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = !locationFilter ||
        (job.location && job.location.toLowerCase().includes(locationFilter.toLowerCase()));
      return matchesSearch && matchesLocation;
    })
    .slice(0, jobsPerPage === 'all' ? undefined : jobsPerPage);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Top job picks for you
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Based on your profile and preferences
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('row')}
            className={`p-2 rounded ${viewMode === 'row'
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'text-gray-600 dark:text-gray-400'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid'
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'text-gray-600 dark:text-gray-400'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by title or company"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            placeholder="Filter by location"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={jobsPerPage}
          onChange={(e) => setJobsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value={10}>10 jobs</option>
          <option value={20}>20 jobs</option>
          <option value={50}>50 jobs</option>
          <option value="all">All jobs</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredJobs.length} recommended jobs
        </p>
      </div>

      {/* Job Cards */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
            No recommended jobs found
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search criteria
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8'
          : 'flex flex-col gap-4'
        }>
          {filteredJobs.map((job, index) => (
            <Link
              key={job.job_id}
              to={`/job/${job.job_id}`}
              className={`group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 
                ${viewMode === 'grid' ? 'p-4 sm:p-6' : 'p-4'} transform transition-all duration-300 hover:shadow-lg
                ${index < 3 ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
            >
              <div className={`flex ${viewMode === 'grid' ? 'flex-col h-full' : 'flex-col sm:flex-row items-start sm:items-center gap-4'}`}>
                {viewMode === 'grid' ? (
                  <>
                    {/* Grid Layout */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-lg sm:text-xl font-semibold text-gray-600 dark:text-gray-300">
                            {job.company?.charAt(0) || 'J'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400 truncate">{job.company}</p>
                        <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span className="truncate">{job.jobDetails.location}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="text-sm sm:text-base text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap">
                          {(job.score * 100).toFixed(0)}% match
                        </span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start gap-2 mb-3">
                        {index < 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 whitespace-nowrap">
                            Top {index + 1}
                          </span>
                        )}
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                          {job.title}
                        </h3>
                      </div>
                    </div>

                    <div className="mt-auto pt-3">
                      <button
                        onClick={(e) => handleApplyClick(job.job_id, job.applyLink, e)}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors
                          ${index < 3
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                      >
                        Apply Now
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Row Layout */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-xl font-semibold text-gray-600 dark:text-gray-300">
                          {job.company?.charAt(0) || 'J'}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {index < 3 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Top {index + 1}
                          </span>
                        )}
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                          {job.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{job.company}</p>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span>{job.jobDetails.location}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {(job.score * 100).toFixed(0)}% match
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 w-full sm:w-auto">
                      <button
                        onClick={(e) => handleApplyClick(job.job_id, job.applyLink, e)}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors
                          ${index < 3
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                      >
                        Apply Now
                      </button>
                    </div>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReccomendedJobListings;