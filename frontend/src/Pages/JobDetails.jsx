import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { jobs } from '../data/sampleJobs';
import { useJobContext } from '../context/JobContext';

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const { saveJob, savedJobs, markJobAsApplied, appliedJobs } = useJobContext();
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      // Convert both IDs to strings for proper comparison
      const foundJob = jobs.find(j => String(j.id) === String(id));
      setJob(foundJob);
      setLoading(false);
    }, 800);
  }, [id]);

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
      if (job?.applyUrl) {
        window.open(job.applyUrl, '_blank');
      }
    }, 1000);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[70vh] bg-white dark:bg-gray-900">
        <div className="animate-pulse flex flex-col w-full max-w-3xl">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-6"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded w-full mb-6"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-36 mb-2"></div>
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
        >
          {/* Job Header */}
          <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <button 
                onClick={() => navigate(-1)}
                className="text-blue-600 dark:text-blue-400 flex items-center hover:underline"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${job.featured ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                  {job.featured ? 'Featured' : job.type}
                </span>
                {job.remote && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                    Remote
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-14 h-14 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-4">
                {job.companyLogo ? (
                  <img src={job.companyLogo} alt={`${job.company} logo`} className="w-10 h-10 object-contain" />
                ) : (
                  <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">{job.title}</h1>
                <div className="flex flex-wrap items-center text-gray-600 dark:text-gray-300 text-sm mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{job.company}</span>
                  <span className="mx-2">•</span>
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Posted {job.postedDate}</span>
                  <span className="mx-2">•</span>
                  <span>{job.applicants} applicants</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Job Details */}
          <div className="p-4 md:p-6">
            {job.salary && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">Salary Range</h3>
                <div className="text-blue-800 dark:text-blue-200 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{job.salary}</span>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Job Description</h3>
              <div className="text-gray-600 dark:text-gray-300">
                {job.description?.split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </div>
            
            {job.requirements && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Requirements</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
                  {job.requirements.map((requirement, i) => (
                    <li key={i}>{requirement}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {job.benefits && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Benefits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {job.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Application Section */}
            <div className="mt-8 border-t border-gray-100 dark:border-gray-700 pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-4 sm:mb-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Interested in this job?</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Apply now or save for later
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSaveJob}
                    disabled={isJobSaved}
                    className={`px-4 py-2 rounded-lg flex items-center justify-center transition-colors ${
                      isJobSaved 
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    <svg className={`w-5 h-5 mr-2 ${isJobSaved ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} fill={isJobSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    {isJobSaved ? 'Saved' : 'Save'}
                  </button>
                  
                  <button
                    onClick={handleApplyJob}
                    disabled={isJobApplied || isApplying}
                    className={`px-6 py-2 rounded-lg font-medium flex items-center justify-center transition-colors ${
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
                </div>
              </div>
              
              {job.applicationDeadline && (
                <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Applications close on {job.applicationDeadline}
                </div>
              )}
            </div>
          </div>
          
          {/* Company Section */}
          {job.companyDescription && (
            <div className="border-t border-gray-100 dark:border-gray-700 p-4 md:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">About {job.company}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{job.companyDescription}</p>
              {job.companyWebsite && (
                <a 
                  href={job.companyWebsite} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                >
                  Visit company website
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </motion.div>
        
        {/* Similar Jobs Section */}
        <div className="max-w-3xl mx-auto mt-10">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Similar Jobs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.filter(j => j.id !== id && j.category === job.category).slice(0, 4).map(similarJob => (
              <Link 
                key={similarJob.id} 
                to={`/job/${similarJob.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">{similarJob.title}</h4>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {similarJob.company} • {similarJob.location}
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <span className="mr-2">{similarJob.postedDate}</span>
                  <span className={`px-2 py-0.5 rounded-full ${similarJob.remote ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                    {similarJob.remote ? 'Remote' : similarJob.type}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDetails; 