import { useMemo } from 'react';
import ModernTemplate from './templates/ModernTemplate';
import ClassicTemplate from './templates/ClassicTemplate';
import MinimalTemplate from './templates/MinimalTemplate';
import CreativeTemplate from './templates/CreativeTemplate';
import TechTemplate from './templates/TechTemplate';
import ExecutiveTemplate from './templates/ExecutiveTemplate';

// Default resume data with sample values
const DEFAULT_RESUME_DATA = {
  personal: {
    name: 'Darshan Godase',
    title: 'full stack developer',
    email: 'darshangodase10@gmail.com',
    phone: '(+91)-9699xxxxxx',
    address: 'Mumbai, India',
    website: '',
    linkedin: '',
    summary: 'Passion for growth and a drive for success fuel my ambition to continuously learn and adapt in an ever-changing world. With a focus on innovation and efficiency, I strive to contribute meaningfully in all my endeavors'
  },
  education: [
    {
      institution: 'Western Illinois University',
      degree: 'Master in Computer Science',
      field: '',
      startDate: '2023-02-01',
      endDate: '2024-02-01',
      description: ''
    }
  ],
  experience: [
    {
      company: 'Amazon',
      position: 'Full Stack Developer',
      startDate: '2021-01-01',
      endDate: '',
      description: '* Designed, developed, and maintained full-stack applications using React and Node.js.\n* Implemented responsive user interfaces with React, ensuring seamless user experiences.\n* Maintaining the React Native in-house organization application.\n* Created RESTful APIs with Node.js and Express and improved backend speed.'
    }
  ],
  skills: [
    { name: 'Angular', level: '' },
    { name: 'MySQL', level: '' },
    { name: 'React', level: '' },
    { name: 'React Native', level: '' }
  ],
  projects: [
    {
      name: 'Portfolio Website',
      link: '',
      technologies: 'React, CSS, Netlify',
      description: '* Developed a personal portfolio website.\n* Showcasing projects, skills, and contact information.'
    }
  ],
  achievements: [
    {
      title: 'GATE Qualified',
      description: 'Successfully qualified the GATE exam with excellent performance.'
    },
    {
      title: 'LeetCode Knight',
      description: 'Achieved the prestigious LeetCode Knight badge by solving numerous challenging problems.'
    }
  ],
  certifications: []
};

// Import placeholder for templates that don't exist yet
const PlaceholderTemplate = ({ data, templateName }) => {
  // Merge default data with any provided data
  const mergedData = {
    personal: { ...DEFAULT_RESUME_DATA.personal, ...data.personal },
    education: data.education?.length ? data.education : DEFAULT_RESUME_DATA.education,
    experience: data.experience?.length ? data.experience : DEFAULT_RESUME_DATA.experience,
    skills: data.skills?.length ? data.skills : DEFAULT_RESUME_DATA.skills,
    projects: data.projects?.length ? data.projects : DEFAULT_RESUME_DATA.projects,
    achievements: data.achievements?.length ? data.achievements : DEFAULT_RESUME_DATA.achievements,
    certifications: data.certifications?.length ? data.certifications : DEFAULT_RESUME_DATA.certifications
  };

  return (
    <div className="w-full h-full p-8 flex flex-col items-center justify-center">
      <div className="p-8 max-w-lg bg-white border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-yellow-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {templateName} Template
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            This template is coming soon! We're working hard to make it available for you soon.
          </p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-700/30 mb-4">
          <div className="font-medium text-blue-700 dark:text-blue-400 mb-2">Preview Details:</div>
          <p className="text-gray-800 dark:text-gray-200 font-semibold">{mergedData.personal.name}</p>
          <p className="text-gray-600 dark:text-gray-400">{mergedData.personal.title}</p>
          <div className="mt-2 text-sm">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {mergedData.personal.email}
            </div>
          </div>
        </div>
        
        <div className="flex justify-center">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
            Try Another Template
          </button>
        </div>
      </div>
    </div>
  );
};

function ResumePreview({ resumeData = {}, template }) {
  // Merge default data with any provided data to ensure all expected fields exist
  const completeData = {
    personal: { ...DEFAULT_RESUME_DATA.personal, ...resumeData.personal },
    education: resumeData.education?.length ? resumeData.education : DEFAULT_RESUME_DATA.education,
    experience: resumeData.experience?.length ? resumeData.experience : DEFAULT_RESUME_DATA.experience,
    skills: resumeData.skills?.length ? resumeData.skills : DEFAULT_RESUME_DATA.skills,
    projects: resumeData.projects?.length ? resumeData.projects : DEFAULT_RESUME_DATA.projects,
    achievements: resumeData.achievements?.length ? resumeData.achievements : DEFAULT_RESUME_DATA.achievements,
    certifications: resumeData.certifications?.length ? resumeData.certifications : DEFAULT_RESUME_DATA.certifications
  };

  // Determine which template to render based on template
  const Template = useMemo(() => {
    switch (template) {
      case 'modern':
        return ModernTemplate;
      case 'classic':
        return ClassicTemplate;
      case 'creative':
        return CreativeTemplate;
      case 'minimal':
        return MinimalTemplate;
      case 'tech':
        return TechTemplate;
      case 'executive':
        return ExecutiveTemplate;
      default:
        return ModernTemplate; // Default to modern if no match
    }
  }, [template]);

  return (
    <div className="resume-preview bg-white">
      <Template data={completeData} />
    </div>
  );
}

export default ResumePreview; 