import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import JobCard from './JobCard';
import TiltControls from './TiltControls';
import GestureControls from './GestureControls';
import { jobs } from '../data/sampleJobs';
import { useJobContext } from '../context/JobContext';
import Webcam from 'react-webcam';

function SwipeableJobStack({ filters }) {
  const [currentJobs, setCurrentJobs] = useState([]);
  const [swipedJobIds, setSwipedJobIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTiltEnabled, setIsTiltEnabled] = useState(false);
  const [isHandGestureEnabled, setIsHandGestureEnabled] = useState(false);
  const { saveJob, markJobAsApplied, markJobAsViewed } = useJobContext();

  // Hand gesture related states
  const [handModel, setHandModel] = useState(null);
  const [lastHandX, setLastHandX] = useState(0);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // Add debug state for troubleshooting
  const [debug, setDebug] = useState([]);

  // Apply filters and load jobs
  useEffect(() => {
    setLoading(true);

    setTimeout(() => {
      let filteredJobs = [...jobs];

      // Apply filters
      if (filters) {
        // Filter by location
        if (filters.location) {
          const location = filters.location.toLowerCase();
          filteredJobs = filteredJobs.filter(job =>
            job.location.toLowerCase().includes(location)
          );
        }

        // Other filters (add as needed)
        if (filters.jobType) {
          filteredJobs = filteredJobs.filter(job =>
            job.title.toLowerCase().includes(filters.jobType.toLowerCase())
          );
        }

        if (filters.remote) {
          filteredJobs = filteredJobs.filter(job =>
            job.location.toLowerCase().includes('remote')
          );
        }
      }

      // Filter out already swiped jobs
      filteredJobs = filteredJobs.filter(job => !swipedJobIds.includes(job.id));

      setCurrentJobs(filteredJobs);
      setLoading(false);
    }, 800);
  }, [filters, swipedJobIds]);

  // Add a function to dynamically load TensorFlow if needed
  const loadTensorFlowDynamically = async () => {
    try {
      setDebug(prev => [...prev, "Loading TensorFlow dynamically..."]);

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

        setDebug(prev => [...prev, "TensorFlow.js loaded dynamically"]);
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

        setDebug(prev => [...prev, "Handpose loaded dynamically"]);
      }

      // Wait a moment for scripts to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

      return true;
    } catch (error) {
      console.error("Error loading TensorFlow dynamically:", error);
      setDebug(prev => [...prev, `Dynamic load error: ${error.message}`]);
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

      setDebug(prev => [
        ...prev,
        `TensorFlow available after delay: ${tfAvailable}`,
        `Handpose available after delay: ${handposeAvailable}`
      ]);
    };

    checkTensorFlow();
  }, []);

  // Load the handpose model when gesture mode is enabled
  useEffect(() => {
    if (isHandGestureEnabled && !handModel && !isModelLoading) {
      // Check if TensorFlow is available globally
      if (!window.tf) {
        alert('TensorFlow.js not loaded. Please refresh the page and try again.');
        setDebug(prev => [...prev, "TensorFlow not found"]);
        setIsHandGestureEnabled(false);
        return;
      }

      if (!window.handpose) {
        alert('Handpose model not loaded. Please refresh the page and try again.');
        setDebug(prev => [...prev, "Handpose not found"]);
        setIsHandGestureEnabled(false);
        return;
      }

      setIsModelLoading(true);
      setDebug(prev => [...prev, "Starting model load"]);
      console.log("Gesture mode enabled, loading handpose model...");

      const loadModel = async () => {
        try {
          console.log("Starting model load");
          // Use the global handpose object
          const model = await window.handpose.load();
          console.log("Handpose model loaded successfully");
          setHandModel(model);
          setDebug(prev => [...prev, "Model loaded successfully"]);
        } catch (error) {
          console.error("Failed to load handpose model:", error);
          setDebug(prev => [...prev, `Model load error: ${error.message}`]);
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

  const handleSwipe = (jobId, direction) => {
    // Find the job that was swiped
    const swipedJob = jobs.find(job => job.id === jobId);
    if (!swipedJob) return;

    // Add to swiped jobs to avoid showing it again
    setSwipedJobIds(prev => [...prev, jobId]);

    // Mark as viewed regardless of direction
    markJobAsViewed(jobId);

    if (direction === 'right') {
      // When swiped right:
      // 1. Save the job and mark as applied
      saveJob(swipedJob);
      markJobAsApplied(swipedJob);

      // 2. Open the job posting URL in a new tab
      if (swipedJob.postUrl) {
        window.open(swipedJob.postUrl, '_blank');
      }

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

      {/* Add TiltControls component */}
      <TiltControls
        onTiltAction={handleTiltAction}
        enabled={isTiltEnabled}
      />

      {/* Debug panel - make this more visible */}
      {debug.length > 0 && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-md w-full text-sm border-2 border-blue-500">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <ul className="list-disc pl-5">
            {debug.map((msg, i) => (
              <li key={i} className="text-xs py-1">{msg}</li>
            ))}
          </ul>
          <div className="flex space-x-2 mt-2">
            <button
              onClick={() => setDebug([])}
              className="text-xs text-blue-500"
            >
              Clear
            </button>
            <button
              onClick={loadTensorFlowDynamically}
              className="text-xs text-green-500"
            >
              Force Load TensorFlow
            </button>
          </div>
        </div>
      )}

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
              setDebug(prev => [...prev, `Webcam error: ${error.name}`]);
              alert(`Error accessing camera: ${error.message}`);
              setIsHandGestureEnabled(false);
            }}
            onUserMedia={(stream) => {
              console.log("Webcam stream active");
              setDebug(prev => [...prev, "Webcam stream active"]);
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