import { useState } from 'react';
import { motion } from 'framer-motion';

function JobFilters({ onFilterChange, filters }) {
  const [localFilters, setLocalFilters] = useState({
    location: filters?.location || '',
    minSalary: filters?.minSalary || '',
    jobType: filters?.jobType || '',
    remote: filters?.remote || false,
    experience: filters?.experience || '',
    skills: filters?.skills || [],
    jobCategory: filters?.jobCategory || '',
    companySize: filters?.companySize || '',
    workSchedule: filters?.workSchedule || '',
    postedWithin: filters?.postedWithin || ''
  });

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    const updatedFilters = {
      ...localFilters,
      [name]: newValue
    };
    
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleSkillAdd = (skill) => {
    if (skill && !localFilters.skills.includes(skill)) {
      const updatedFilters = {
        ...localFilters,
        skills: [...localFilters.skills, skill]
      };
      setLocalFilters(updatedFilters);
      onFilterChange(updatedFilters);
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    const updatedFilters = {
      ...localFilters,
      skills: localFilters.skills.filter(skill => skill !== skillToRemove)
    };
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const resetFilters = () => {
    const resetFilters = {
      location: '',
      minSalary: '',
      jobType: '',
      remote: false,
      experience: '',
      skills: [],
      jobCategory: '',
      companySize: '',
      workSchedule: '',
      postedWithin: ''
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="space-y-6">
        {/* Location Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={localFilters.location}
            onChange={handleFilterChange}
            placeholder="Enter city or region"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Remote Work Option */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="remote"
            id="remote"
            checked={localFilters.remote}
            onChange={handleFilterChange}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600"
          />
          <label htmlFor="remote" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Remote Jobs Only
          </label>
        </div>

        {/* Job Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Job Type
          </label>
          <div className="space-y-2">
            {['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'].map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="radio"
                  name="jobType"
                  value={type}
                  checked={localFilters.jobType === type}
                  onChange={handleFilterChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Experience Level
          </label>
          <div className="space-y-2">
            {['Entry Level', 'Mid Level', 'Senior Level', 'Manager', 'Executive'].map((level) => (
              <label key={level} className="flex items-center">
                <input
                  type="radio"
                  name="experience"
                  value={level}
                  checked={localFilters.experience === level}
                  onChange={handleFilterChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{level}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Salary Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Minimum Salary (Annual)
          </label>
          <input
            type="number"
            name="minSalary"
            value={localFilters.minSalary}
            onChange={handleFilterChange}
            placeholder="Enter amount"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Job Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Job Category
          </label>
          <select
            name="jobCategory"
            value={localFilters.jobCategory}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Categories</option>
            <option value="technology">Technology</option>
            <option value="design">Design</option>
            <option value="marketing">Marketing</option>
            <option value="sales">Sales</option>
            <option value="customer-service">Customer Service</option>
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
          </select>
        </div>

        {/* Company Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company Size
          </label>
          <div className="space-y-2">
            {['1-50', '51-200', '201-500', '501-1000', '1000+'].map((size) => (
              <label key={size} className="flex items-center">
                <input
                  type="radio"
                  name="companySize"
                  value={size}
                  checked={localFilters.companySize === size}
                  onChange={handleFilterChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{size} employees</span>
              </label>
            ))}
          </div>
        </div>

        {/* Posted Within */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Posted Within
          </label>
          <div className="space-y-2">
            {[
              { label: 'Last 24 hours', value: '24h' },
              { label: 'Last 3 days', value: '3d' },
              { label: 'Last 7 days', value: '7d' },
              { label: 'Last 14 days', value: '14d' },
              { label: 'Last 30 days', value: '30d' }
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="postedWithin"
                  value={option.value}
                  checked={localFilters.postedWithin === option.value}
                  onChange={handleFilterChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Skills
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {localFilters.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
              >
                {skill}
                <button
                  onClick={() => handleSkillRemove(skill)}
                  className="ml-1 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add a skill"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSkillAdd(e.target.value);
                e.target.value = '';
              }
            }}
          />
        </div>

        {/* Reset Button */}
        <div className="pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetFilters}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Reset Filters
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default JobFilters; 