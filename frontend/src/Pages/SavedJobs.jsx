import { useJobContext } from '../context/JobContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function SavedJobs() {
  const { savedJobs, unsaveJob, markJobAsApplied } = useJobContext();
  
  if (savedJobs.length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Saved Jobs</h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No saved jobs yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Jobs you save will appear here for easy access.</p>
          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Find Jobs
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Saved Jobs</h1>
      
      <div className="space-y-4">
        {savedJobs.map(job => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col sm:flex-row gap-4"
          >
            <div className="flex-1">
              <Link to={`/job/${job.id}`} className="block">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {job.title}
                </h2>
              </Link>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">{job.company} • {job.location}</p>
              <p className="text-green-600 dark:text-green-400 text-sm mb-2">{job.salary}</p>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {job.requirements.slice(0, 3).map((req, i) => (
                  <span key={i} className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                    {req}
                  </span>
                ))}
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Saved on {new Date(job.savedDate || Date.now()).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex sm:flex-col gap-2 justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open(job.postUrl, '_blank')}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Apply
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => unsaveJob(job.id)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
              >
                Remove
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default SavedJobs; 