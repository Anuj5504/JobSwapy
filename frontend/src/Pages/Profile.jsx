import { useState } from 'react';
import { motion } from 'framer-motion';
import { useJobContext } from '../context/JobContext';

function Profile() {
  const { savedJobs, appliedJobs, viewedJobs } = useJobContext();
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'user@example.com',
    title: 'Frontend Developer',
    location: 'Bangalore, India',
    bio: 'Passionate web developer with 3+ years of experience building modern web applications.'
  });

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Your Profile</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-3xl font-bold text-blue-600 dark:text-blue-300">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">{user.name}</h2>
              <p className="text-gray-500 dark:text-gray-300">{user.email}</p>
              <p className="text-gray-700 dark:text-gray-300 mt-1">{user.title}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{user.location}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">About</h3>
            <p className="text-gray-600 dark:text-gray-300">{user.bio}</p>
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
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Profile
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile; 