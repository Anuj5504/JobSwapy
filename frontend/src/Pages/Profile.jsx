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
        
        console.log('Initializing form with skills:', skills);
        console.log('Initializing form with interests:', interests);
        
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
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Your Profile</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-3xl font-bold text-blue-600 dark:text-blue-300 overflow-hidden">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.name || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">{user.name || 'User'}</h2>
              <p className="text-gray-500 dark:text-gray-300">{user.email}</p>
            </div>
          </div>
          
          {/* Skills Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {user.skills && user.skills.length > 0 ? (
                user.skills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No skills added yet</p>
              )}
            </div>
          </div>
          
          {/* Interests Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {user.interests && user.interests.length > 0 ? (
                user.interests.map((interest, index) => (
                  <span 
                    key={index} 
                    className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No interests added yet</p>
              )}
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <span className="block text-2xl font-bold text-blue-600 dark:text-blue-400">{savedJobs.length}</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">Saved Jobs</span>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
              <span className="block text-2xl font-bold text-green-600 dark:text-green-400">{appliedJobs.length}</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">Applications</span>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
              <span className="block text-2xl font-bold text-purple-600 dark:text-purple-400">{viewedJobs.length}</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">Viewed</span>
            </div>
          </div>
          
          <div className="mt-8">
            <motion.button
              onClick={handleOpenEditModal}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Profile
            </motion.button>
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit Profile</h2>
                  <button 
                    onClick={handleCloseEditModal}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                  {/* Name */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                  </div>
                  
                  {/* Photo URL */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Photo URL
                    </label>
                    <input
                      type="text"
                      name="photoURL"
                      value={formData.photoURL}
                      onChange={handleInputChange}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                    {formData.photoURL && (
                      <div className="mt-2 flex justify-center">
                        <img 
                          src={formData.photoURL} 
                          alt="Profile preview" 
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/150?text=Error";
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Skills */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Skills
                    </label>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <div 
                          key={index}
                          className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm flex items-center"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-1 text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a skill"
                        className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
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
                        className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  {/* Interests */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Interests
                    </label>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {formData.interests.map((interest, index) => (
                        <div 
                          key={index}
                          className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm flex items-center"
                        >
                          {interest}
                          <button
                            type="button"
                            onClick={() => handleRemoveInterest(interest)}
                            className="ml-1 text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        type="text"
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        placeholder="Add an interest"
                        className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
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
                        className="px-4 py-2 bg-purple-600 text-white rounded-r-md hover:bg-purple-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCloseEditModal}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {updating ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Profile; 