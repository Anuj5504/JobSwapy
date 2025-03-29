import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useJobContext } from '../context/JobContext';
import api from '../services/api';
import { toast } from 'react-toastify';

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [job, setJob] = useState(location.state?.job || null);
  const [loading, setLoading] = useState(!location.state?.job);
  const { saveJob, savedJobs, markJobAsApplied, appliedJobs } = useJobContext();
  const [isApplying, setIsApplying] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [isSettingReminder, setIsSettingReminder] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!job) {
        try {
          setLoading(true);
          const response = await api.get(`/api/jobs/${id}`);
          console.log("job details", response.data);
          if (response.data && response.data.data) {
            setJob(response.data.data);
          }
        } catch (error) {
          console.error('Error fetching job details:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchJobDetails();

    // Fetch saved jobs for current user
    const fetchSavedJobs = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.id) {
          const savedJobsResponse = await api.get(`/api/users/${user.id}/savedJobs`);
          if (savedJobsResponse.data && savedJobsResponse.data.savedJobs) {
            setSavedJobIds(savedJobsResponse.data.savedJobs.map(job => job._id || job));
          }
        }
      } catch (error) {
        console.error('Error fetching saved jobs:', error);
      }
    };

    fetchSavedJobs();
  }, [id, job]);

  const isJobSaved = savedJobIds.includes(id) || (job && savedJobIds.includes(job._id));
  const isJobApplied = appliedJobs.includes(id);

  const handleSaveJob = async () => {
    if (!isJobSaved && job) {
      try {
        // Get user from localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
          toast.error('Please login to save jobs');
          return;
        }

        // Update UI optimistically
        setSavedJobIds(prev => [...prev, job._id]);

        // Call API to save job to user's profile
        await api.post(`/api/jobs/savejob/${job._id}/${user.id}`);
        console.log('Job saved successfully');
        toast.success('Job saved successfully');

        // Also update local context
        saveJob(job);

        // Refresh saved jobs to confirm update
        const savedJobsResponse = await api.get(`/api/users/${user.id}/savedJobs`);
        if (savedJobsResponse.data && savedJobsResponse.data.savedJobs) {
          setSavedJobIds(savedJobsResponse.data.savedJobs.map(job => job._id || job));
        }
      } catch (error) {
        console.error('Error saving job:', error);
        // Revert optimistic update
        setSavedJobIds(prev => prev.filter(id => id !== job._id));
        toast.error('Failed to save job. Please try again.');
      }
    } else if (isJobSaved) {
      toast.info('This job is already saved to your profile');
    }
  };

  const handleApplyJob = async () => {
    setIsApplying(true);

    try {
      // Get user and token from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');

      // Track the application via API if user is authenticated
      if (user && user.id && token && job) {
        await api.post(`/api/jobs/${job._id}/apply`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Update UI state
      markJobAsApplied(id);

      // Open application URL in new tab
      if (job?.applyLink) {
        window.open(job.applyLink, '_blank');
      }
    } catch (error) {
      console.error('Error recording job application:', error);
      // Still open the apply link even if tracking fails
      if (job?.applyLink) {
        window.open(job.applyLink, '_blank');
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleSetReminder = async () => {
    if (!reminderDate) {
      toast.error('Please select a date for the reminder');
      return;
    }

    try {
      setIsSettingReminder(true);
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        toast.error('Please login to set reminders');
        return;
      }

      const response = await api.post('/api/reminders/setreminder', {
        job_id: job._id,
        user_id: user.id,
        date: reminderDate
      });
      console.log(response)

      if (response.status === 201) {
        toast.success('Reminder set successfully!');
        setShowReminderModal(false);
        setReminderDate('');
      }
    } catch (error) {
      console.error('Error setting reminder:', error);
      toast.error('Failed to set reminder. Please try again.');
    } finally {
      setIsSettingReminder(false);
    }
  };

  const handleStartMockInterview = () => {
    navigate(`/mock-interview/${id}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[70vh] bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse flex flex-col w-full max-w-6xl">
          {/* Header skeleton */}
          <div className="h-64 bg-white dark:bg-gray-800 rounded-xl overflow-hidden mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-900/30 dark:to-purple-900/30"></div>
            <div className="absolute bottom-8 left-8">
              <div className="h-10 bg-white/30 dark:bg-white/10 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-white/30 dark:bg-white/10 rounded w-1/2"></div>
            </div>
            <div className="absolute top-8 right-8">
              <div className="h-20 w-20 bg-white/30 dark:bg-white/10 rounded-full"></div>
            </div>
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div className="h-[400px] bg-white dark:bg-gray-800 rounded-xl p-6">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            </div>
            <div>
              <div className="h-[350px] bg-white dark:bg-gray-800 rounded-xl p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
                <div className="space-y-4">
                  <div className="flex">
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mt-8"></div>
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center bg-gray-50 dark:bg-gray-900 min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Job Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">The job you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/jobs"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Browse Jobs
          </Link>
        </motion.div>
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
          {/* Enhanced Header Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="relative h-64">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-800 opacity-90"></div>
              <div className="absolute inset-0 flex items-center justify-between px-8">
                <div className="text-white max-w-2xl">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl md:text-4xl font-bold mb-2"
                  >
                    {job?.title}
                  </motion.h1>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl mb-2"
                  >
                    {/* {job?.company} */}
                    {job?.company}
                  </motion.div>
                  {job?.jobDetails?.location && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center text-white/90 text-sm"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {job?.jobDetails?.location}
                    </motion.div>
                  )}
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg"
                >
                  {job?.companyDetails.logo ? (
                    <img
                      src={job?.companyDetails.logo}
                      alt={`${job.company} logo`}
                      className="w-20 h-20 object-contain rounded-full"
                    />
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-full">
                      <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                        {job?.company?.charAt(0)}
                      </span>
                    </div>
                  )}
                </motion.div>
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
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
              >
                <div className="flex bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                  <button
                    onClick={() => setActiveTab('description')}
                    className={`px-6 py-4 font-medium transition-colors ${activeTab === 'description'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                  >
                    Description
                  </button>
                  <button
                    onClick={() => setActiveTab('requirements')}
                    className={`px-6 py-4 font-medium transition-colors ${activeTab === 'requirements'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                  >
                    Requirements
                  </button>
                  <button
                    onClick={() => setActiveTab('company')}
                    className={`px-6 py-4 font-medium transition-colors ${activeTab === 'company'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                  >
                    Company
                  </button>
                </div>

                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {activeTab === 'description' && (
                      <motion.div
                        key="description"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="prose dark:prose-invert max-w-none"
                      >
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Job Description</h3>
                        <div className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                          {job?.description}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'requirements' && (
                      <motion.div
                        key="requirements"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Required Skills</h3>
                        {job?.skills && job.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {job.skills.map((skill, index) => (
                              <motion.span
                                key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                              >
                                {skill}
                              </motion.span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-600 dark:text-gray-400">No specific skills listed for this position.</p>
                        )}

                        {job?.jobDetails?.experience && (
                          <div className="mt-6">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Experience</h4>
                            <p className="text-gray-600 dark:text-gray-300">{job.jobDetails.experience}</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === 'company' && (
                      <motion.div
                        key="company"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About {job?.company}</h3>
                        <div className="flex items-center space-x-4 mb-4">
                          {job?.companyLogo ? (
                            <img
                              src={job.companyLogo}
                              alt={`${job.company} logo`}
                              className="w-16 h-16 object-contain rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-lg">
                              <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                {job?.company?.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">{job?.company}</h4>
                            {job?.companyDetails?.rating && (
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
                        </div>

                        {job?.companyDetails?.about ? (
                          <p className="text-gray-600 dark:text-gray-300">{job.companyDetails.about}</p>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400">No detailed information available about this company.</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Job Details */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden sticky top-8"
              >
                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Job Details</h3>
                </div>

                <div className="p-6 space-y-6">
                  {/* Key Details Section */}
                  <div className="space-y-4">
                    {/* Employment Type */}
                    {job?.jobDetails?.employmentType && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 block">Job Type</span>
                          <span className="text-gray-900 dark:text-white font-medium">{job.jobDetails.employmentType}</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Salary */}
                    {job?.jobDetails?.salary && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center"
                      >
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 block">Salary</span>
                          <span className="text-gray-900 dark:text-white font-medium">{job.jobDetails.salary}</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Posted Date */}
                    {job?.jobDetails?.postedDate && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex items-center"
                      >
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 block">Posted</span>
                          <span className="text-gray-900 dark:text-white font-medium">{job.jobDetails.postedDate}</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Applicants */}
                    {job?.jobDetails?.applicants && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex items-center"
                      >
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 block">Applicants</span>
                          <span className="text-gray-900 dark:text-white font-medium">{job.jobDetails.applicants}</span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Source Info */}
                  <div className="border-t dark:border-gray-600 pt-4">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Source: {job?.source}
                    </div>
                    {/* <div className="text-xs text-gray-500 dark:text-gray-400">
                      Scraped: {new Date(job?.scrapedAt).toLocaleString()}
                    </div> */}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-2">
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      onClick={handleApplyJob}
                      disabled={isJobApplied || isApplying}
                      className={`w-full px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-all ${isJobApplied || isApplying
                        ? 'bg-green-600 text-white cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg transform hover:-translate-y-0.5'
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
                    </motion.button>

                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 }}
                      onClick={handleSaveJob}
                      disabled={isJobSaved}
                      className={`w-full px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-all ${isJobSaved
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:shadow transform hover:-translate-y-0.5'
                        }`}
                    >
                      <svg className={`w-5 h-5 mr-2 ${isJobSaved ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} fill={isJobSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      {isJobSaved ? 'Saved' : 'Save Job'}
                    </motion.button>

                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.1 }}
                      onClick={() => setShowReminderModal(true)}
                      className="w-full px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-all bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-800/30 hover:shadow transform hover:-translate-y-0.5"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Set Reminder
                    </motion.button>

                <button 
            onClick={handleStartMockInterview}
            className="bg-blue-600 text-white w-full px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Start Mock Interview
              </button>
                    
                    {/* {job?.applyLink && (
                      <a 
                        href={job.applyLink}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
                      >
                        View original job posting
                      </a>
                    )} */}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          {/* <button 
            onClick={handleStartMockInterview}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Mock Interview
          </button> */}
        </motion.div>
      </div>

      {/* Reminder Modal */}
      <AnimatePresence>
        {showReminderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Set Job Reminder</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Select a date to be reminded about this job application.</p>

              <div className="mb-4">
                <label htmlFor="reminderDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reminder Date
                </label>
                <input
                  type="date"
                  id="reminderDate"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetReminder}
                  disabled={isSettingReminder || !reminderDate}
                  className={`px-4 py-2 rounded-lg font-medium ${isSettingReminder || !reminderDate
                    ? 'bg-purple-300 dark:bg-purple-800 text-purple-500 dark:text-purple-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                >
                  {isSettingReminder ? 'Setting...' : 'Set Reminder'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default JobDetails; 