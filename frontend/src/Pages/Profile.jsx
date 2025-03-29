import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJobContext } from '../context/JobContext';
import { toast } from 'react-toastify';
import api from '../services/api';

function Profile() {
  const { savedJobs, appliedJobs, viewedJobs } = useJobContext();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    photoURL: '',
    skills: [],
    interests: []
  });
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [updating, setUpdating] = useState(false);

  // Fetch user profile function
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      console.log('Fetching profile data...');
      
      const response = await api.get('/api/auth/profile');
      
      console.log('Profile data response:', response.data);
      
      if (response.data && response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        
        // Make sure arrays are initialized even if they come as null or undefined
        const skills = Array.isArray(userData.skills) ? userData.skills : [];
        const interests = Array.isArray(userData.interests) ? userData.interests : [];

        
        // Initialize form data with current values
        setFormData({
          name: userData.name || '',
          photoURL: userData.photoURL || '',
          skills: skills,
          interests: interests
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const handleOpenEditModal = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    // Refresh profile data when modal is closed
    fetchProfile();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      const updatedSkills = [...formData.skills, newSkill.trim()];
      console.log('Adding skill:', newSkill.trim());
      console.log('Updated skills array:', updatedSkills);
      
      setFormData(prev => ({
        ...prev,
        skills: updatedSkills
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill) => {
    const updatedSkills = formData.skills.filter(s => s !== skill);
    console.log('Removing skill:', skill);
    console.log('Updated skills array:', updatedSkills);
    
    setFormData(prev => ({
      ...prev,
      skills: updatedSkills
    }));
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      const updatedInterests = [...formData.interests, newInterest.trim()];
      console.log('Adding interest:', newInterest.trim());
      console.log('Updated interests array:', updatedInterests);
      
      setFormData(prev => ({
        ...prev,
        interests: updatedInterests
      }));
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest) => {
    const updatedInterests = formData.interests.filter(i => i !== interest);
    console.log('Removing interest:', interest);
    console.log('Updated interests array:', updatedInterests);
    
    setFormData(prev => ({
      ...prev,
      interests: updatedInterests
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      
      // Debug logging
      console.log('Sending profile update with data:', formData);
      
      // Force refresh user data after update
      const response = await api.put('/api/auth/profile', formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Debug response
      console.log('Profile update response:', response.data);
      
      if (response.data && response.data.success) {
        // Force refresh user data to see changes
        const profileResponse = await api.get('/api/auth/profile');
        setUser(profileResponse.data.data);
        
        toast.success('Profile updated successfully');
        handleCloseEditModal();
        
        // Update user in localStorage
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        const updatedUser = {
          ...storedUser,
          name: formData.name,
          photoURL: formData.photoURL,
          skills: formData.skills,
          interests: formData.interests
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center" style={{ minHeight: '60vh' }}>
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Please log in to view your profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-white/20 p-1 backdrop-blur-sm">
              <div className="w-full h-full rounded-full bg-white overflow-hidden">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.name || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 text-4xl font-bold text-blue-600">
                    {user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold">{user.name || 'User'}</h1>
            <p className="text-blue-100 mt-1">{user.email}</p>
            
            <motion.button
              onClick={handleOpenEditModal}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 px-5 py-2 rounded-full text-sm font-medium border border-white/20 flex items-center gap-2 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Profile
            </motion.button>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-b-xl shadow-lg">
        <div className="grid md:grid-cols-2 gap-8 p-8">
          {/* Skills Section */}
          <div className="bg-blue-50 dark:bg-gray-700 rounded-xl p-6 border border-blue-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Professional Skills</h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {user.skills && user.skills.length > 0 ? (
                user.skills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-medium shadow-sm border border-blue-100 dark:border-gray-600"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <div className="w-full p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No skills added yet</p>
                  <button 
                    onClick={handleOpenEditModal}
                    className="mt-2 text-blue-600 dark:text-blue-400 text-sm hover:underline"
                  >
                    Add your professional skills
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Interests Section */}
          <div className="bg-purple-50 dark:bg-gray-700 rounded-xl p-6 border border-purple-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Areas of Interest</h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {user.interests && user.interests.length > 0 ? (
                user.interests.map((interest, index) => (
                  <span 
                    key={index} 
                    className="bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-lg text-sm font-medium shadow-sm border border-purple-100 dark:border-gray-600"
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <div className="w-full p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No interests added yet</p>
                  <button 
                    onClick={handleOpenEditModal}
                    className="mt-2 text-purple-600 dark:text-purple-400 text-sm hover:underline"
                  >
                    Add your areas of interest
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Profile Completeness */}
          <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Profile Completeness</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.min(100, (
                  (user.name ? 25 : 0) + 
                  (user.photoURL ? 25 : 0) + 
                  (user.skills && user.skills.length > 0 ? 25 : 0) + 
                  (user.interests && user.interests.length > 0 ? 25 : 0)
                ))}% Complete
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full"
                style={{ width: `${Math.min(100, (
                  (user.name ? 25 : 0) + 
                  (user.photoURL ? 25 : 0) + 
                  (user.skills && user.skills.length > 0 ? 25 : 0) + 
                  (user.interests && user.interests.length > 0 ? 25 : 0)
                ))}%` }}
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className={`p-3 rounded-lg ${user.name ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                <div className="text-xl mb-1">
                  {user.name ? (
                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div className="text-sm font-medium">Name</div>
              </div>
              
              <div className={`p-3 rounded-lg ${user.photoURL ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                <div className="text-xl mb-1">
                  {user.photoURL ? (
                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div className="text-sm font-medium">Photo</div>
              </div>
              
              <div className={`p-3 rounded-lg ${user.skills && user.skills.length > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                <div className="text-xl mb-1">
                  {user.skills && user.skills.length > 0 ? (
                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div className="text-sm font-medium">Skills</div>
              </div>
              
              <div className={`p-3 rounded-lg ${user.interests && user.interests.length > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                <div className="text-xl mb-1">
                  {user.interests && user.interests.length > 0 ? (
                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div className="text-sm font-medium">Interests</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-xl p-5">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Edit Your Profile</h2>
                  <button 
                    onClick={handleCloseEditModal}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                {/* Name */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                
                {/* Photo URL */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Profile Picture URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="photoURL"
                      value={formData.photoURL}
                      onChange={handleInputChange}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full pl-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                    />
                  </div>
                  {formData.photoURL && (
                    <div className="mt-3 flex justify-center">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md">
                        <img 
                          src={formData.photoURL} 
                          alt="Profile preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/150?text=Error";
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Skills */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Professional Skills
                  </label>
                  <div className="p-3 bg-blue-50 dark:bg-gray-700 rounded-lg border border-blue-100 dark:border-blue-900/30 mb-3">
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.length > 0 ? (
                        formData.skills.map((skill, index) => (
                          <div 
                            key={index}
                            className="bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm flex items-center border border-blue-200 dark:border-blue-800/50 shadow-sm"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="ml-1.5 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="w-full text-center py-2 text-gray-500 dark:text-gray-400">
                          No skills added yet
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a professional skill"
                      className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Add skills like "React", "JavaScript", "Project Management", etc.
                  </p>
                </div>
                
                {/* Interests */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Areas of Interest
                  </label>
                  <div className="p-3 bg-purple-50 dark:bg-gray-700 rounded-lg border border-purple-100 dark:border-purple-900/30 mb-3">
                    <div className="flex flex-wrap gap-2">
                      {formData.interests.length > 0 ? (
                        formData.interests.map((interest, index) => (
                          <div 
                            key={index}
                            className="bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm flex items-center border border-purple-200 dark:border-purple-800/50 shadow-sm"
                          >
                            {interest}
                            <button
                              type="button"
                              onClick={() => handleRemoveInterest(interest)}
                              className="ml-1.5 text-purple-500 hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="w-full text-center py-2 text-gray-500 dark:text-gray-400">
                          No interests added yet
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      placeholder="Add an area of interest"
                      className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddInterest();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddInterest}
                      className="px-4 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 transition-colors flex items-center"
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Add interests like "AI", "Mobile Development", "UI/UX Design", etc.
                  </p>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg transition-all font-medium hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
                  >
                    {updating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Profile; 