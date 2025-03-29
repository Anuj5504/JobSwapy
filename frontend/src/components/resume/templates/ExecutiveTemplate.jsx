import React from 'react';

function ExecutiveTemplate({ data }) {
  // Destructure data with default values for all sections
  const { 
    personal = {},
    education = [],
    experience = [],
    skills = [],
    projects = [],
    achievements = []
  } = data || {};
  
  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };
  
  return (
    <div className="w-full h-full flex flex-col font-serif p-8 px-10 bg-white">
      {/* Header with elegant styling */}
      <header className="mb-6 pb-6 border-b border-gray-300">
        <h1 className="text-2xl font-bold text-gray-800 text-center tracking-wide uppercase">
          {personal.name}
        </h1>
        <p className="text-sm text-center text-gray-600 mt-1 uppercase tracking-wider">
          {personal.title}
        </p>
        
        {/* Contact Info in centered row */}
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 text-xs text-gray-600">
          {personal.phone && <span>{personal.phone}</span>}
          {personal.email && <span>{personal.email}</span>}
          {personal.linkedin && <span>{personal.linkedin}</span>}
          {personal.address && <span>{personal.address}</span>}
        </div>
      </header>
      
      {/* Executive Summary / Professional Profile */}
      {personal.summary && (
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-800 uppercase tracking-wider mb-2 border-b border-gray-300 pb-1">
            Executive Summary
          </h2>
          <p className="text-xs text-gray-700 leading-relaxed">{personal.summary}</p>
        </section>
      )}
      
      {/* Core Competencies / Areas of Expertise */}
      {skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-800 uppercase tracking-wider mb-2 border-b border-gray-300 pb-1">
            Areas of Expertise
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {skills.map((skill, index) => (
              <div key={index} className="flex items-center">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                <span className="text-xs">{skill.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* Professional Experience */}
      {experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-800 uppercase tracking-wider mb-2 border-b border-gray-300 pb-1">
            Professional Experience
          </h2>
          <div className="space-y-4">
            {experience.map((exp, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline">
                  <h3 className="text-sm font-bold text-gray-800">{exp.position}</h3>
                  <p className="text-xs text-gray-600">
                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                  </p>
                </div>
                <p className="text-xs font-semibold text-gray-700 mb-1">{exp.company}</p>
                <p className="text-xs text-gray-700 whitespace-pre-line">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* Key Projects / Leadership Initiatives */}
      {projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-800 uppercase tracking-wider mb-2 border-b border-gray-300 pb-1">
            Key Projects & Initiatives
          </h2>
          <div className="space-y-3">
            {projects.map((project, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline">
                  <h3 className="text-sm font-bold text-gray-800">{project.name}</h3>
                  {project.link && (
                    <a href={project.link} className="text-xs text-gray-600 italic">
                      Reference Link
                    </a>
                  )}
                </div>
                {project.technologies && (
                  <p className="text-xs italic text-gray-600 mb-1">
                    {project.technologies}
                  </p>
                )}
                <p className="text-xs text-gray-700 whitespace-pre-line">{project.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* Education & Certifications */}
      {education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-800 uppercase tracking-wider mb-2 border-b border-gray-300 pb-1">
            Education & Credentials
          </h2>
          <div className="space-y-2">
            {education.map((edu, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">{edu.degree}</h3>
                  <p className="text-xs text-gray-700">{edu.institution}</p>
                  {edu.gpa && <p className="text-xs text-gray-600 italic">CGPA: {edu.gpa}</p>}
                </div>
                <p className="text-xs text-gray-600">
                  {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* Achievements & Recognition */}
      {achievements.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-gray-800 uppercase tracking-wider mb-2 border-b border-gray-300 pb-1">
            Achievements & Recognition
          </h2>
          <ul className="list-inside space-y-1">
            {achievements.map((achievement, index) => (
              <li key={index} className="text-xs flex items-baseline">
                <div className="w-1 h-1 bg-gray-500 rounded-full mr-2 inline-block"></div>
                <span className="font-semibold">{achievement.title}</span>
                {achievement.description && (
                  <span className="text-gray-700">: {achievement.description}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default ExecutiveTemplate; 