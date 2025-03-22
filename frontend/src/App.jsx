import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import JobDetails from './pages/JobDetails'
import SavedJobs from './pages/SavedJobs'
import AppliedJobs from './pages/AppliedJobs'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import JobListings from './pages/JobListings'
import SwipeInterface from './pages/SwipeInterface'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ResumeUpload from './pages/ResumeUpload'
import { JobProvider } from './context/JobContext'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <JobProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={
                  <Home />
          } />
              <Route path="/swipe" element={
                <ProtectedRoute>
                  <SwipeInterface />
                </ProtectedRoute>
              } />
              <Route path="/jobs" element={<JobListings />} />
              <Route path="/job/:id" element={<JobDetails />} />
              <Route path="/saved" element={<SavedJobs />} />
              <Route path="/applied" element={<AppliedJobs />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/resume-upload" element={<ResumeUpload />} />
            </Routes>
          </main>
          <ToastContainer 
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </div>
      </Router>
    </JobProvider>
  )
}

export default App
