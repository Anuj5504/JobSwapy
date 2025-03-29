import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Template preview images
const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary design with a sidebar and modern typography',
    previewBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    category: 'Professional'
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Professional, elegant resume format with clear section headers and traditional layout',
    previewBg: 'bg-gradient-to-br from-slate-700 to-gray-900',
    category: 'Traditional'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Eye-catching design with colorful accents and timeline layouts',
    previewBg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    category: 'Creative'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, minimalist design with ample white space and subtle typography',
    previewBg: 'bg-gradient-to-br from-gray-200 to-gray-400',
    category: 'Professional'
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Code-inspired design with programming syntax elements for IT professionals',
    previewBg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    category: 'Technical'
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Elegant, refined layout with balanced typography for senior professionals',
    previewBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    category: 'Professional'
  }
];

function TemplateCard({ template, onClick }) {
  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      onClick={() => onClick(template)}
    >
      <div className={`h-52 ${template.previewBg} flex items-center justify-center p-6`}>
        <div className="bg-white dark:bg-gray-800 w-full h-full rounded-lg flex flex-col p-3 opacity-80">
          <div className="w-1/3 h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="flex space-x-2 mb-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
            <div className="flex flex-col justify-center">
              <div className="w-24 h-3 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
              <div className="w-16 h-2 bg-gray-200 dark:bg-gray-500 rounded"></div>
            </div>
          </div>
          <div className="flex flex-col space-y-2 flex-grow">
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded"></div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded"></div>
            <div className="w-3/4 h-2 bg-gray-200 dark:bg-gray-600 rounded"></div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded"></div>
            <div className="w-5/6 h-2 bg-gray-200 dark:bg-gray-600 rounded"></div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{template.name}</h3>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-300">{template.category}</span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{template.description}</p>
        <button 
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          Select Template
        </button>
      </div>
    </motion.div>
  );
}

function ResumeBuilderLanding() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  
  const filteredTemplates = filter === 'All' 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === filter);

  const handleTemplateSelect = (template) => {
    navigate(`/resume-builder/${template.id}`);
  };
  
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Create Your Professional Resume
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Choose from our professionally designed templates and customize your resume in minutes.
          Our builder makes it easy to showcase your skills and experience.
        </p>
      </div>
      
      <div className="mb-8 flex justify-center space-x-2">
        <button 
          onClick={() => setFilter('All')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === 'All' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All
        </button>
        {['Professional', 'Creative', 'Technical', 'Traditional'].map(category => (
          <button 
            key={category}
            onClick={() => setFilter(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === category 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTemplates.map(template => (
          <TemplateCard 
            key={template.id} 
            template={template} 
            onClick={handleTemplateSelect}
          />
        ))}
      </div>
    </div>
  );
}

export default ResumeBuilderLanding; 