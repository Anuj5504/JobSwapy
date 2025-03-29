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
import RoadmapList from './Pages/RoadmapList'
import RoadmapDetail from './Pages/RoadmapDetail'
import CreateRoadmap from './Pages/CreateRoadmap'
import MigrationGuide from './Pages/MigrationGuide'
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
              <Route path="/saved" element={
                <ProtectedRoute>
                  <SavedJobs />
                </ProtectedRoute>
              } />
              <Route path="/applied" element={
                <ProtectedRoute>
                  <AppliedJobs />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/resume-upload" element={
                  <ResumeUpload />
              } />
              <Route path="/roadmaps" element={<RoadmapList />} />
              <Route path="/roadmap/:id" element={<RoadmapDetail />} />
              <Route path="/create-roadmap" element={<CreateRoadmap />} />
              <Route path="/migration-guide" element={<MigrationGuide />} />
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
