import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaTimes, FaTag, FaPlus } from 'react-icons/fa';
import Spinner from '../common/Spinner';

const CreateBowl = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    rules: '',
    isPublic: true
  });
  const [errors, setErrors] = useState({});
  const [currentTags, setCurrentTags] = useState([]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const addTag = () => {
    if (formData.tags.trim() && !currentTags.includes(formData.tags.trim())) {
      setCurrentTags([...currentTags, formData.tags.trim()]);
      setFormData({
        ...formData,
        tags: ''
      });
    }
  };

  const removeTag = (tagToRemove) => {
    setCurrentTags(currentTags.filter(tag => tag !== tagToRemove));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Get current user from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setErrors({ form: 'You must be logged in to create a bowl.' });
        setLoading(false);
        return;
      }
      
      const user = JSON.parse(userStr);
      const token = localStorage.getItem('token');
      console.log(token);
      
      const bowlData = {
        ...formData,
        tags: currentTags.join(','),
        createdBy: user.id
      };
      
      const response = await axios.post(
        'http://localhost:5000/api/community/bowls', 
        bowlData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      navigate(`/community/bowl/${response.data.data._id}`);
    } catch (error) {
      console.error('Failed to create bowl:', error);
      setErrors({ 
        form: error.response?.data?.message || 'Failed to create bowl. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 my-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Create a New Bowl</h1>
      
      {errors.form && (
        <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
          {errors.form}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2" htmlFor="title">
            Bowl Title*
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white`}
            placeholder="Give your bowl a descriptive title"
          />
          {errors.title && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.title}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2" htmlFor="description">
            Description*
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className={`w-full px-3 py-2 border rounded-md ${
              errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white`}
            placeholder="Describe what your bowl is about"
          ></textarea>
          {errors.description && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.description}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
            Tags
          </label>
          <div className="flex items-center mb-2">
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Add tags"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button
              type="button"
              onClick={addTag}
              className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
            >
              <FaPlus />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {currentTags.map((tag, index) => (
              <span 
                key={index} 
                className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded-md flex items-center"
              >
                <FaTag className="mr-1 text-xs" />
                {tag}
                <button 
                  type="button" 
                  className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                  onClick={() => removeTag(tag)}
                >
                  <FaTimes className="text-xs" />
                </button>
              </span>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2" htmlFor="rules">
            Rules (Optional)
          </label>
          <textarea
            id="rules"
            name="rules"
            value={formData.rules}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Add any specific rules for your bowl"
          ></textarea>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
            />
            <label className="ml-2 block text-gray-700 dark:text-gray-300" htmlFor="isPublic">
              Make this bowl public (visible to everyone)
            </label>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/community')}
            className="px-4 py-2 mr-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                <span className="ml-2">Creating...</span>
              </>
            ) : (
              'Create Bowl'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateBowl; 