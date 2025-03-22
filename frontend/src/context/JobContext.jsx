import { createContext, useState, useContext, useEffect } from 'react';

// Create context with a default empty value
const JobContext = createContext({
  savedJobs: [],
  appliedJobs: [],
  viewedJobs: [],
  filters: {},
  saveJob: () => {},
  unsaveJob: () => {},
  markJobAsApplied: () => {},
  markJobAsViewed: () => {},
  updateFilters: () => {}
});

// Custom hook for using the context
export function useJobContext() {
  return useContext(JobContext);
}

// Provider component
export function JobProvider({ children }) {
  const [savedJobs, setSavedJobs] = useState(() => {
    const saved = localStorage.getItem('savedJobs');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [appliedJobs, setAppliedJobs] = useState(() => {
    const applied = localStorage.getItem('appliedJobs');
    return applied ? JSON.parse(applied) : [];
  });
  
  const [viewedJobs, setViewedJobs] = useState(() => {
    const viewed = localStorage.getItem('viewedJobs');
    return viewed ? JSON.parse(viewed) : [];
  });
  
  const [filters, setFilters] = useState({
    location: '',
    minSalary: '',
    jobType: '',
    remote: false,
    keywords: []
  });
  
  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
  }, [savedJobs]);
  
  useEffect(() => {
    localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs));
  }, [appliedJobs]);
  
  useEffect(() => {
    localStorage.setItem('viewedJobs', JSON.stringify(viewedJobs));
  }, [viewedJobs]);
  
  // Context functions
  const saveJob = (job) => {
    setSavedJobs(prev => {
      // Don't add duplicate jobs
      if (prev.some(j => j.id === job.id)) {
        return prev;
      }
      // Add timestamp when job was saved
      return [...prev, { ...job, savedDate: new Date().toISOString() }];
    });
  };
  
  const unsaveJob = (jobId) => {
    setSavedJobs(prev => prev.filter(job => job.id !== jobId));
  };
  
  const markJobAsApplied = (job) => {
    setAppliedJobs(prev => {
      // Don't add duplicate jobs
      if (prev.some(j => j.id === job.id)) {
        return prev;
      }
      // Add timestamp when job was applied to
      return [...prev, { 
        ...job, 
        appliedDate: new Date().toISOString(),
        status: 'Applied' 
      }];
    });
  };
  
  const markJobAsViewed = (jobId) => {
    setViewedJobs(prev => {
      if (prev.includes(jobId)) {
        return prev;
      }
      return [...prev, jobId];
    });
  };
  
  const updateFilters = (newFilters) => {
    setFilters(newFilters);
  };
  
  // Create context value object
  const value = {
    savedJobs,
    appliedJobs,
    viewedJobs,
    filters,
    saveJob,
    unsaveJob,
    markJobAsApplied,
    markJobAsViewed,
    updateFilters
  };
  
  return (
    <JobContext.Provider value={value}>
      {children}
    </JobContext.Provider>
  );
} 