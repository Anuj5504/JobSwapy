import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import JobCard from './JobCard';
import TiltControls from './TiltControls';
import GestureControls from './GestureControls';
import Webcam from 'react-webcam';
import api from '../services/api';

function SwipeableJobStack({ filters }) {
  const [currentJobs, setCurrentJobs] = useState([]);
  const [swipedJobIds, setSwipedJobIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTiltEnabled, setIsTiltEnabled] = useState(false);
  const [isHandGestureEnabled, setIsHandGestureEnabled] = useState(false);
  const [saveNotification, setSaveNotification] = useState({ show: false, message: '', type: '' });

  // Hand gesture related states
  const [handModel, setHandModel] = useState(null);
  const [lastHandX, setLastHandX] = useState(0);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // Clear notification after 2 seconds
  useEffect(() => {
    if (saveNotification.show) {
      const timer = setTimeout(() => {
        setSaveNotification({ show: false, message: '', type: '' });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [saveNotification]);

  // Fetch jobs from the database
  useEffect(() => {
    const fetchJobsForSwipe = async () => {
      try {
        setLoading(true);

        // Get user from localStorage for personalized recommendations if logged in
        const user = JSON.parse(localStorage.getItem('user'));
        let response;

        if (user && user.id) {
          // Get personalized job recommendations
          response = await api.get(`/api/jobs/swipe/${user.id}`);
        } else {
          // Get general job recommendations
          response = await api.get('/api/jobs/swipe');
        }

        if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
          console.error('Invalid API response format:', response.data);
          setCurrentJobs([]);
          return;
        }

        // Process and filter the jobs
        let apiJobs = response.data.data.map(job => ({
          id: job._id,
          title: job.title || 'No title',
          company: job.company || 'No company',
          location: job.jobDetails?.location || 'Location not specified',
          description: job.description || 'No description',
          skills: job.skills || [],
          salary: job.jobDetails?.salary || 'Salary not specified',
          type: job.jobDetails?.employmentType || 'Type not specified',
          postedDate: job.jobDetails?.postedDate || 'Date not specified',
          postUrl: job.applyLink || '#',
          companyLogo: job.companyDetails?.logo || null,
          requirements: job.requirements || job.skills || [], // Use skills as fallback for requirements
          sourceWebsite: job.source || 'TLE Jobs' // Add source website with fallback
        }));

        // Apply filters if provided
        if (filters) {
          // Filter by location
          if (filters.location) {
            const location = filters.location.toLowerCase();
            apiJobs = apiJobs.filter(job =>
              job.location.toLowerCase().includes(location)
            );
          }

          // Filter by job type
          if (filters.jobType) {
            apiJobs = apiJobs.filter(job =>
              job.type.toLowerCase().includes(filters.jobType.toLowerCase())
            );
          }

          // Filter by remote
          if (filters.remote) {
            apiJobs = apiJobs.filter(job =>
              job.location.toLowerCase().includes('remote')
            );
          }

          // Filter by experience
          if (filters.experience) {
            apiJobs = apiJobs.filter(job =>
              job.description.toLowerCase().includes(filters.experience.toLowerCase())
            );
          }
        }

        // Filter out already swiped jobs
        apiJobs = apiJobs.filter(job => !swipedJobIds.includes(job.id));
        
        setCurrentJobs(apiJobs);
      } catch (error) {
        console.error('Error fetching jobs for swipe:', error);
        setCurrentJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobsForSwipe();
  }, [filters, swipedJobIds]);

  // Add a function to dynamically load TensorFlow if needed
  const loadTensorFlowDynamically = async () => {
    try {
      // Load TensorFlow.js dynamically if not available
      if (!window.tf) {
        const tfScript = document.createElement('script');
        tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.20.0/dist/tf.min.js';
        tfScript.async = true;

        await new Promise((resolve, reject) => {
          tfScript.onload = resolve;
          tfScript.onerror = reject;
          document.head.appendChild(tfScript);
        });
      }

      // Load handpose dynamically if not available
      if (!window.handpose) {
        const handposeScript = document.createElement('script');
        handposeScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/handpose@0.0.7/dist/handpose.min.js';
        handposeScript.async = true;

        await new Promise((resolve, reject) => {
          handposeScript.onload = resolve;
          handposeScript.onerror = reject;
          document.head.appendChild(handposeScript);
        });
      }

      // Wait a moment for scripts to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

      return true;
    } catch (error) {
      console.error("Error loading TensorFlow dynamically:", error);
      return false;
    }
  };

  // Add a delayed check for TensorFlow
  useEffect(() => {
    const checkTensorFlow = async () => {
      // Wait for 2 seconds after component mount to check
      await new Promise(resolve => setTimeout(resolve, 2000));

      const tfAvailable = !!window.tf;
      const handposeAvailable = !!window.handpose;

      console.log("TF available after delay:", tfAvailable);
      console.log("Handpose available after delay:", handposeAvailable);
    };

    checkTensorFlow();
  }, []);

  // Load the handpose model when gesture mode is enabled
  useEffect(() => {
    if (isHandGestureEnabled && !handModel && !isModelLoading) {
      // Check if TensorFlow is available globally
      if (!window.tf) {
        alert('TensorFlow.js not loaded. Please refresh the page and try again.');
        setIsHandGestureEnabled(false);
        return;
      }

      if (!window.handpose) {
        alert('Handpose model not loaded. Please refresh the page and try again.');
        setIsHandGestureEnabled(false);
        return;
      }

      setIsModelLoading(true);
      console.log("Gesture mode enabled, loading handpose model...");

      const loadModel = async () => {
        try {
          console.log("Starting model load");
          // Use the global handpose object
          const model = await window.handpose.load();
          console.log("Handpose model loaded successfully");
          setHandModel(model);
        } catch (error) {
          console.error("Failed to load handpose model:", error);
          alert(`Error loading hand detection model: ${error.message}`);
          setIsHandGestureEnabled(false);
        } finally {
          setIsModelLoading(false);
        }
      };

      loadModel();
    }

    return () => {
      if (isHandGestureEnabled) {
        console.log("Cleaning up gesture detection");
      }
    };
  }, [isHandGestureEnabled, handModel, isModelLoading]);

  // Run hand detection when the model is loaded
  useEffect(() => {
    let detectionInterval;

    if (handModel && isHandGestureEnabled && webcamRef.current) {
      console.log("Starting hand detection interval");

      const detectHands = async () => {
        if (
          webcamRef.current &&
          webcamRef.current.video &&
          webcamRef.current.video.readyState === 4 &&
          canvasRef.current
        ) {
          try {
            // Get video properties
            const video = webcamRef.current.video;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // Make detections
            const hands = await handModel.estimateHands(video);

            if (hands.length > 0) {
              console.log("Hand detected:", hands[0].landmarks[8]); // Debug output

              // Get the position of the index finger tip
              const fingerTip = hands[0].landmarks[8]; // Index finger tip
              const currentX = fingerTip[0];

              // If we have a previous position, check for swipe
              if (lastHandX) {
                const moveDistance = currentX - lastHandX;
                console.log(`Hand moved: ${moveDistance}px`);

                // REVERSED LOGIC to account for mirrored webcam
                if (moveDistance < -100) {  // Changed from > 100
                  console.log("RIGHT SWIPE DETECTED!");
                  // Right swipe = Apply to job (save it and mark as applied)
                  if (currentJobs.length > 0) {
                    handleSwipe(currentJobs[0].id, 'right');
                  }
                } else if (moveDistance > 100) {  // Changed from < -100
                  console.log("LEFT SWIPE DETECTED!");
                  // Left swipe = Pass on job
                  if (currentJobs.length > 0) {
                    handleSwipe(currentJobs[0].id, 'left');
                  }
                }
              }

              // Update last position
              setLastHandX(currentX);

              // Draw hand landmarks on canvas for debugging
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = "red";
              hands[0].landmarks.forEach(point => {
                ctx.beginPath();
                ctx.arc(point[0], point[1], 5, 0, 2 * Math.PI);
                ctx.fill();
              });
            } else {
              // Clear canvas when no hands
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          } catch (error) {
            console.error("Error detecting hands:", error);
          }
        }
      };

      // Run detection at regular intervals
      detectionInterval = setInterval(detectHands, 200); // Slowed down to 200ms for better performance
    }

    return () => {
      if (detectionInterval) {
        clearInterval(detectionInterval);
        console.log("Cleared detection interval");
      }
    };
  }, [handModel, isHandGestureEnabled, lastHandX, currentJobs]);

  // Configure canvas
  useEffect(() => {
    if (canvasRef.current && isHandGestureEnabled) {
      // Match canvas to webcam dimensions
      canvasRef.current.width = 640;
      canvasRef.current.height = 480;
      console.log("Canvas configured:", canvasRef.current.width, canvasRef.current.height);
    }
  }, [isHandGestureEnabled]);

  const handleSwipe = async (jobId, direction) => {
    // Find the job that was swiped
    const swipedJob = currentJobs.find(job => job.id === jobId);
    if (!swipedJob) return;

    // Add to swiped jobs to avoid showing it again
    setSwipedJobIds(prev => [...prev, jobId]);

    // Get the user if logged in
    const user = JSON.parse(localStorage.getItem('user'));

    if (direction === 'right' && user && user.id) {
      try {
        // When swiped right and user is logged in:
        // Call API to save the job
        await api.post(`/api/jobs/savejob/${jobId}/${user.id}`);
        console.log(`Saved job: ${swipedJob.title}`);
        
        // Show success notification
        setSaveNotification({
          show: true,
          message: `${swipedJob.title} at ${swipedJob.company} saved to your profile!`,
          type: 'success'
        });
        
        // No longer open the job posting URL
        // Instead just show a notification via console log
      } catch (error) {
        console.error('Error saving job:', error);
        // Show error notification
        setSaveNotification({
          show: true,
          message: 'Error saving job, please try again',
          type: 'error'
        });
        // Continue with local UI update even if API call fails
      }
    } else if (direction === 'right' && (!user || !user.id)) {
      // User not logged in but swiped right
      setSaveNotification({
        show: true,
        message: 'Please log in to save jobs',
        type: 'warning'
      });
    }

    if (direction === 'right') {
      console.log(`Applied to: ${swipedJob.title}`);
    } else {
      console.log(`Passed on: ${swipedJob.title}`);
    }

    // Remove from current jobs list (visual update)
    setCurrentJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const handleTiltAction = (direction) => {
    if (currentJobs.length > 0) {
      handleSwipe(currentJobs[0].id, direction);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Add GestureControls component at the top */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <GestureControls
            onToggleTilt={() => setIsTiltEnabled(!isTiltEnabled)}
            onToggleHandGesture={() => setIsHandGestureEnabled(!isHandGestureEnabled)}
            isTiltEnabled={isTiltEnabled}
            isHandGestureEnabled={isHandGestureEnabled}
          />
        </div>
      </div>

      {/* Notification for job saving */}
      <AnimatePresence>
        {saveNotification.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-0 left-0 right-0 z-50 p-3 rounded-lg text-white text-center mx-auto max-w-sm ${
              saveNotification.type === 'success' ? 'bg-green-500' :
              saveNotification.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'
            }`}
          >
            {saveNotification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : currentJobs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
            No more jobs to show
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your filters or come back later for more opportunities.
          </p>
        </div>
      ) : (
        <AnimatePresence>
          {currentJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute w-full"
              style={{ zIndex: currentJobs.length - index }}
            >
              <JobCard
                job={job}
                onSwipe={handleSwipe}
                index={index}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Add TiltControls component */}
      <TiltControls
        onTiltAction={handleTiltAction}
        enabled={isTiltEnabled}
      />

      {/* Camera feed with improved error handling */}
      {isHandGestureEnabled && (
        <div className="fixed bottom-4 right-4 w-64 h-48 bg-black rounded-lg overflow-hidden shadow-lg border-2 border-purple-500">
          <Webcam
            ref={webcamRef}
            mirrored={true}
            className="w-full h-full object-cover"
            videoConstraints={{
              width: 640,
              height: 480,
              facingMode: "user"
            }}
            onUserMediaError={(error) => {
              console.error("Webcam error:", error);
              alert(`Error accessing camera: ${error.message}`);
              setIsHandGestureEnabled(false);
            }}
            onUserMedia={(stream) => {
              console.log("Webcam stream active");
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center">
            Wave your hand left or right to swipe
          </div>
        </div>
      )}
    </div>
  );
}

export default SwipeableJobStack; 