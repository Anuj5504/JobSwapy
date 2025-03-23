import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useJobContext } from '../context/JobContext';
import api from '../services/api';

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [job, setJob] = useState(location.state?.job || null);
  const [loading, setLoading] = useState(!location.state?.job);
  const [similarJobs, setSimilarJobs] = useState([]);
  const { saveJob, savedJobs, markJobAsApplied, appliedJobs } = useJobContext();
  const [isApplying, setIsApplying] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!job) {
        try {
    setLoading(true);
          const response = await api.get(`/api/jobs/${id}`);
          if (response.data) {
            setJob(response.data);
          }
        } catch (error) {
          console.error('Error fetching job details:', error);
        } finally {
      setLoading(false);
        }
      }
    };

    fetchJobDetails();
  }, [id, job]);

  // Fetch similar jobs
  useEffect(() => {
    const fetchSimilarJobs = async () => {
      if (job) {
        try {
          const response = await api.get(`/api/jobs/similar/${id}`);
          if (response.data) {
            setSimilarJobs(response.data);
          }
        } catch (error) {
          console.error('Error fetching similar jobs:', error);
        }
      }
    };

    fetchSimilarJobs();
  }, [id, job]);

  const isJobSaved = savedJobs.some(j => String(j.id) === String(id));
  const isJobApplied = appliedJobs.includes(id);

  const handleSaveJob = () => {
    if (!isJobSaved && job) {
      saveJob(job);
    }
  };

  const handleApplyJob = () => {
    setIsApplying(true);
    // Simulate application submission
    setTimeout(() => {
      markJobAsApplied(id);
      setIsApplying(false);
      // Open application URL in new tab
      if (job?.applyLink) {
        window.open(job.applyLink, '_blank');
      }
    }, 1000);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[70vh] bg-white dark:bg-gray-900">
        <div className="animate-pulse flex flex-col w-full max-w-6xl">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center bg-white dark:bg-gray-900 min-h-screen">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Job Not Found</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">The job you're looking for doesn't exist or has been removed.</p>
        <Link 
          to="/jobs"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Browse Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="relative h-48 md:h-64">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 opacity-90"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl md:text-4xl font-bold mb-4"
                  >
                    {job.title}
                  </motion.h1>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl"
                  >
                    {job.company}
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="md:col-span-2 space-y-8">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => setActiveTab('description')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'description'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    Description
                  </button>
                  <button
                    onClick={() => setActiveTab('requirements')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'requirements'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    Requirements
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === 'description' && (
                    <motion.div
                      key="description"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="prose dark:prose-invert max-w-none"
                    >
                      <div className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {job.description}
              </div>
                    </motion.div>
                  )}

                  {activeTab === 'requirements' && (
                    <motion.div
                      key="requirements"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      {job.skills && job.skills.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Required Skills</h3>
                          <div className="flex flex-wrap gap-2">
                            {job.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                              >
                                {skill}
                              </span>
                ))}
              </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Company Details */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About {job.company}</h3>
                {job.companyDetails && (
                  <div className="space-y-4">
                    {job.companyDetails.about && (
                      <p className="text-gray-600 dark:text-gray-300">{job.companyDetails.about}</p>
                    )}
                    {job.companyDetails.rating && (
                      <div className="flex items-center">
                        <span className="text-yellow-400">★</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-300">{job.companyDetails.rating}</span>
                        {job.companyDetails.reviews && (
                          <span className="ml-2 text-gray-500 dark:text-gray-400">
                            ({job.companyDetails.reviews} reviews)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
            
            {/* Right Column - Job Details */}
            <div className="space-y-8">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-8"
              >
                <div className="space-y-6">
                  {/* Job Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Job Details</h3>
                    <div className="space-y-3">
                      {/* Source */}
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Source: {job.source}
                      </div>

                      {/* Apply Link */}
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <a 
                          href={job.applyLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                        >
                          {job.applyLink}
                        </a>
                      </div>

                      {/* Company */}
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Company: {job.company}
                      </div>

                      {/* Title */}
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Title: {job.title}
                      </div>

                      {/* Job Details Section */}
                      {job.jobDetails && (
                        <>
                          {job.jobDetails.location && (
                            <div className="flex items-center text-gray-600 dark:text-gray-300">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Location: {job.jobDetails.location}
                            </div>
                          )}
                          {job.jobDetails.employmentType && (
                            <div className="flex items-center text-gray-600 dark:text-gray-300">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Employment Type: {job.jobDetails.employmentType}
                            </div>
                          )}
                          {job.jobDetails.salary && (
                            <div className="flex items-center text-gray-600 dark:text-gray-300">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Salary: {job.jobDetails.salary}
                            </div>
                          )}
                          {job.jobDetails.experience && (
                            <div className="flex items-center text-gray-600 dark:text-gray-300">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Experience: {job.jobDetails.experience}
                            </div>
                          )}
                          {job.jobDetails.postedDate && (
                            <div className="flex items-center text-gray-600 dark:text-gray-300">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Posted Date: {job.jobDetails.postedDate}
                            </div>
                          )}
                          {job.jobDetails.startDate && (
                            <div className="flex items-center text-gray-600 dark:text-gray-300">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Start Date: {job.jobDetails.startDate}
                            </div>
                          )}
                          {job.jobDetails.applicants && (
                            <div className="flex items-center text-gray-600 dark:text-gray-300">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Applicants: {job.jobDetails.applicants}
                            </div>
                          )}
                          {job.jobDetails.openings && (
                            <div className="flex items-center text-gray-600 dark:text-gray-300">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Openings: {job.jobDetails.openings}
              </div>
                          )}
                        </>
                      )}

                      {/* Skills */}
                      {job.skills && job.skills.length > 0 && (
                        <div className="flex items-start text-gray-600 dark:text-gray-300">
                          <svg className="w-5 h-5 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                          <div>
                            <span className="font-medium">Skills:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {job.skills.map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                </div>
              </div>
            )}
            
                      {/* Timestamps */}
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Scraped: {new Date(job.scrapedAt).toLocaleString()}
                      </div>
                    </div>
                </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                  <button
                    onClick={handleApplyJob}
                    disabled={isJobApplied || isApplying}
                      className={`w-full px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-colors ${
                      isJobApplied || isApplying
                        ? 'bg-green-600 text-white cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isApplying ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Applying...
                      </>
                    ) : isJobApplied ? (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Applied
                      </>
                    ) : (
                      'Apply Now'
                    )}
                  </button>
                    <button
                      onClick={handleSaveJob}
                      disabled={isJobSaved}
                      className={`w-full px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-colors ${
                        isJobSaved 
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      <svg className={`w-5 h-5 mr-2 ${isJobSaved ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} fill={isJobSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      {isJobSaved ? 'Saved' : 'Save Job'}
                    </button>
              </div>
                </div>
              </motion.div>

              {/* Similar Jobs */}
              {similarJobs.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Similar Jobs</h3>
                  <div className="space-y-4">
                    {similarJobs.map(similarJob => (
              <Link 
                        key={similarJob._id} 
                        to={`/job/${similarJob._id}`}
                        state={{ job: similarJob }}
                        className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">{similarJob.title}</h4>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {similarJob.company} • {similarJob.jobDetails?.location}
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <span className="mr-2">{similarJob.jobDetails?.postedDate}</span>
                          <span className={`px-2 py-0.5 rounded-full ${
                            similarJob.jobDetails?.employmentType === 'Remote' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}>
                            {similarJob.jobDetails?.employmentType || 'Full-time'}
                  </span>
                </div>
              </Link>
            ))}
                  </div>
                </motion.div>
              )}
          </div>
        </div>
        </motion.div>
      </div>
    </div>
  );
}

export default JobDetails; 