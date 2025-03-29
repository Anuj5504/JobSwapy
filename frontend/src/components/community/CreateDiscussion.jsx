import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCommunity } from '../../context/CommunityContext';
import { FaArrowLeft, FaTags, FaPoll, FaPlus, FaTrash } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import Spinner from '../common/Spinner';

const CreateDiscussion = () => {
  const { bowlId } = useParams();
  const navigate = useNavigate();
  const { createDiscussion, fetchBowlById, currentBowl, loading, error } = useCommunity();
  
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    tags: '',
    bowlId,
    includePoll: false,
    pollQuestion: '',
    pollOptions: ['', '']
  });
  
  const [errors, setErrors] = useState({});
  const [previewMode, setPreviewMode] = useState(false);
  
  useEffect(() => {
    if (bowlId) {
      fetchBowlById(bowlId);
    }
  }, [bowlId, fetchBowlById]);
  
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
  
  const handlePollOptionChange = (index, value) => {
    const newOptions = [...formData.pollOptions];
    newOptions[index] = value;
    setFormData({ ...formData, pollOptions: newOptions });
  };
  
  const addPollOption = () => {
    if (formData.pollOptions.length < 10) {
      setFormData({
        ...formData,
        pollOptions: [...formData.pollOptions, '']
      });
    }
  };
  
  const removePollOption = (index) => {
    if (formData.pollOptions.length > 2) {
      const newOptions = [...formData.pollOptions];
      newOptions.splice(index, 1);
      setFormData({ ...formData, pollOptions: newOptions });
    }
  };
  
  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.body.trim()) {
      newErrors.body = 'Content is required';
    }
    
    if (formData.includePoll) {
      if (!formData.pollQuestion.trim()) {
        newErrors.pollQuestion = 'Poll question is required';
      }
      
      const validOptions = formData.pollOptions.filter(option => option.trim());
      if (validOptions.length < 2) {
        newErrors.pollOptions = 'At least 2 poll options are required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    try {
      // Log the form data for debugging
      console.log("Submitting with form data:", formData);
      
      // Send the discussionData with tags as a string (not pre-processed)
      const discussionData = {
        title: formData.title.trim(),
        body: formData.body.trim(),
        tags: formData.tags, // Send as string, let backend handle splitting
        bowlId: bowlId // Ensure we're using the bowlId from URL params
      };
      
      console.log("Prepared discussion data:", discussionData);
      
      // Add poll data if poll is included
      if (formData.includePoll) {
        const validOptions = formData.pollOptions
          .filter(option => option.trim())
          .map(option => ({ text: option.trim() }));
          
        if (validOptions.length < 2) {
          setErrors({
            ...errors,
            pollOptions: 'At least 2 poll options are required'
          });
          return;
        }
        
        discussionData.poll = {
          question: formData.pollQuestion.trim(),
          options: validOptions,
          isActive: true
        };
      }
      
      // Get token for debugging
      const token = localStorage.getItem('token');
      console.log("Using token:", token);
      
      const result = await createDiscussion(discussionData);
      console.log("Discussion created successfully:", result);
      navigate(`/community/discussion/${result.data._id}`);
    } catch (err) {
      console.error('Failed to create discussion:', err);
      
      // Display error to user
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred creating the discussion';
      setErrors({
        ...errors,
        submit: errorMessage
      });
    }
  };
  
  if (loading && !currentBowl) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!currentBowl) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Bowl not found</h3>
        <Link to="/community" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Community
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link 
          to={`/community/bowl/${bowlId}`} 
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" />
          Back to {currentBowl.title}
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Create Discussion in {currentBowl.title}</h1>
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 p-4 rounded-md mb-6">
            {error}
          </div>
        )}
        
        {errors.submit && (
          <div className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 p-4 rounded-md mb-6">
            <h3 className="font-semibold mb-1">Error Creating Discussion</h3>
            <p>{errors.submit}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2" htmlFor="title">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Give your discussion a descriptive title"
            />
            {errors.title && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.title}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2" htmlFor="tags">
              <div className="flex items-center">
                <FaTags className="mr-2" />
                Tags (comma separated, optional)
              </div>
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., question, help, announcement"
            />
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-700 dark:text-gray-300 font-medium" htmlFor="body">
                Content (Markdown supported)
              </label>
              <button
                type="button"
                onClick={togglePreview}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
              >
                {previewMode ? 'Edit' : 'Preview'}
              </button>
            </div>
            
            {previewMode ? (
              <div className="border border-gray-300 dark:border-gray-600 rounded-md p-4 min-h-[200px] prose dark:prose-invert max-w-none dark:text-gray-200">
                {formData.body ? (
                  <ReactMarkdown>{formData.body}</ReactMarkdown>
                ) : (
                  <p className="text-gray-400 dark:text-gray-500 italic">Nothing to preview</p>
                )}
              </div>
            ) : (
              <textarea
                id="body"
                name="body"
                value={formData.body}
                onChange={handleChange}
                rows="8"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.body ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Write your discussion content here..."
              ></textarea>
            )}
            
            {errors.body && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.body}</p>
            )}
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="includePoll"
                name="includePoll"
                checked={formData.includePoll}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 rounded dark:border-gray-600"
              />
              <label className="ml-2 text-gray-700 dark:text-gray-300 font-medium" htmlFor="includePoll">
                <div className="flex items-center">
                  <FaPoll className="mr-2" />
                  Include a Poll
                </div>
              </label>
            </div>
            
            {formData.includePoll && (
              <div className="pl-6 mt-4 border-l-2 border-blue-200 dark:border-blue-700">
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2" htmlFor="pollQuestion">
                    Poll Question
                  </label>
                  <input
                    type="text"
                    id="pollQuestion"
                    name="pollQuestion"
                    value={formData.pollQuestion}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                      errors.pollQuestion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Ask your question here..."
                  />
                  {errors.pollQuestion && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.pollQuestion}</p>
                  )}
                </div>
                
                <div className="mb-2">
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Poll Options
                  </label>
                  {formData.pollOptions.map((option, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handlePollOptionChange(index, e.target.value)}
                        className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder={`Option ${index + 1}`}
                      />
                      {formData.pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removePollOption(index)}
                          className="ml-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          title="Remove option"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {errors.pollOptions && (
                    <p className="text-red-500 dark:text-red-400 text-sm mb-2">{errors.pollOptions}</p>
                  )}
                  
                  {formData.pollOptions.length < 10 && (
                    <button
                      type="button"
                      onClick={addPollOption}
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <FaPlus className="mr-1" />
                      Add Option
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Link
              to={`/community/bowl/${bowlId}`}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 mr-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Discussion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDiscussion; 