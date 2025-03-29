import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ResumeForm from '../components/resume/ResumeForm';
import ResumePreview from '../components/resume/ResumePreview';
import html2pdf from 'html2pdf.js';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Default resume data
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

function ResumeEditor() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const previewRef = useRef(null);
  
  // Initialize state with default values
  const [resumeData, setResumeData] = useState(DEFAULT_RESUME_DATA);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const handleFormChange = (section, data) => {
    setResumeData(prev => ({
      ...prev,
      [section]: data
    }));
  };
  
  const downloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const resumeElement = document.getElementById("resume-preview-container");
      
      // Create a clone of the resume element to avoid modifying the displayed element
      const clonedResume = resumeElement.cloneNode(true);
      
      // Apply specific styling for PDF export
      clonedResume.style.width = "210mm";
      clonedResume.style.height = "297mm";
      clonedResume.style.padding = "0";
      clonedResume.style.margin = "0";
      clonedResume.style.overflow = "hidden";
      clonedResume.style.position = "absolute";
      clonedResume.style.top = "-9999px";
      clonedResume.style.left = "-9999px";
      clonedResume.style.backgroundColor = "white";
      clonedResume.style.border = "none";
      
      // Append to body temporarily
      document.body.appendChild(clonedResume);
      
      // Generate canvas from the cloned element with precise dimensions
      const canvas = await html2canvas(clonedResume, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794, // A4 width in pixels (72dpi)
        windowHeight: 1123, // A4 height in pixels (72dpi)
        x: 0,
        y: 0,
        logging: false,
        imageTimeout: 0,
        onclone: (document) => {
          // Additional modifications to the cloned document if needed
        }
      });
      
      // Clean up the cloned element
      document.body.removeChild(clonedResume);
      
      // Convert to PDF with precise A4 dimensions
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
        hotfixes: ["px_scaling"],
        margins: { top: 0, right: 0, bottom: 0, left: 0 }
      });
      
      // Calculate positioning to center content on A4
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, '', 'FAST');
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `resume_${timestamp}.pdf`;
      
      // Save the PDF
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-6 flex justify-between items-center">
          <motion.button
            whileHover={{ x: -3 }}
            className="flex items-center text-blue-600 dark:text-blue-400 font-medium"
            onClick={() => navigate('/resume-builder')}
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Templates
          </motion.button>
          
          <button
            onClick={downloadPDF}
            disabled={isGeneratingPdf}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors shadow-sm"
          >
            {isGeneratingPdf ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 01-1-1v-2a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H3zm0-6a1 1 0 01-1-1v-2a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H3zm0-6a1 1 0 01-1-1V4a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H3z" clipRule="evenodd" />
                </svg>
                Download PDF
              </>
            )}
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-1/2 max-h-screen overflow-auto">
            <ResumeForm
              data={resumeData}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="w-full lg:w-1/2 max-h-screen overflow-auto sticky top-8">
            <div 
              ref={previewRef} 
              id="resume-preview-container"
              className="w-[210mm] min-h-[297mm] max-w-full mx-auto shadow-lg border border-gray-200"
              style={{ padding: '0', overflow: 'hidden' }}
            >
              <ResumePreview 
                resumeData={resumeData} 
                template={templateId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResumeEditor; 