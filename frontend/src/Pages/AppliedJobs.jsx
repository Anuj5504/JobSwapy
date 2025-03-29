import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../services/api';

function AppliedJobs() {
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAppliedJobs = async () => {
      try {
        setLoading(true);
        // Get user from localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!user || !user.id) {
          setAppliedJobs([]);
          return;
        }
        
        const response = await api.get(`/api/users/${user.id}/appliedJobs`);
        
        if (response.data && response.data.appliedJobs) {
          // Process the jobs to match the expected format
          const processedJobs = response.data.appliedJobs.map(job => ({
            id: job._id,
            title: job.title || 'No title',
            company: job.company || 'No company',
            location: job.jobDetails?.location || 'Location not specified',
            description: job.description || 'No description',
            requirements: job.skills || [],
            salary: job.jobDetails?.salary || 'Salary not specified',
            type: job.jobDetails?.employmentType || 'Type not specified',
            applyLink: job.applyLink || '#',
            companyDetails: job.companyDetails || {},
            appliedDate: job.createdAt || new Date().toISOString()
          }));
          
          setAppliedJobs(processedJobs);
        } else {
          setAppliedJobs([]);
        }
      } catch (error) {
        console.error('Error fetching applied jobs:', error);
        setAppliedJobs([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppliedJobs();
  }, []);
  
  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-3xl flex justify-center items-center" style={{ minHeight: '60vh' }}>
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (appliedJobs.length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Applications</h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No applications yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">When you apply to jobs, they'll appear here to track your applications.</p>
          <Link to="/jobs">
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
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Applications</h1>
      
      <div className="space-y-4">
        {appliedJobs.map(job => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <Link to={`/job/${job.id}`} className="block">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {job.title}
                  </h2>
                </Link>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{job.company} • {job.location}</p>
              </div>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Applied
              </span>
            </div>
            
            <div className="mt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Applied on {new Date(job.appliedDate).toLocaleDateString()}
              </p>
            </div>
            
            <div className="mt-3 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open(job.applyLink, '_blank')}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                View Original Post
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default AppliedJobs; 