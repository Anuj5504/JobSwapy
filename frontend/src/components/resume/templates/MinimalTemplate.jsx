import React from 'react';

function MinimalTemplate({ data }) {
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
    <div className="w-full h-full flex flex-col font-sans p-8 px-10 bg-white">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-light text-gray-800">{personal.name}</h1>
        <p className="text-sm font-light text-gray-500 mt-1">{personal.title}</p>
        
        {/* Contact Info - Horizontal Line */}
        <div className="mt-3 text-xs text-gray-600 flex flex-wrap gap-4">
          {personal.phone && <span>{personal.phone}</span>}
          {personal.email && <span>{personal.email}</span>}
          {personal.website && <span>{personal.website}</span>}
          {personal.linkedin && <span>{personal.linkedin}</span>}
          {personal.github && <span>{personal.github}</span>}
        </div>
      </header>
      
      {/* Summary */}
      {personal.summary && (
        <div className="mb-6">
          <p className="text-xs text-gray-600 font-light leading-relaxed">{personal.summary}</p>
        </div>
      )}
      
      {/* Main Grid */}
      <div className="flex-grow grid grid-cols-1 gap-y-4">
        {/* Experience */}
        {experience.length > 0 && (
          <section>
            <h2 className="text-base font-normal text-gray-800 mb-3">Experience</h2>
            <div className="space-y-3">
              {experience.map((exp, index) => (
                <div key={index}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-medium text-gray-700">{exp.position}</h3>
                    <span className="text-xs text-gray-500">
                      {formatDate(exp.startDate)} — {formatDate(exp.endDate)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 italic mb-1">{exp.company}</p>
                  <p className="text-xs text-gray-600 whitespace-pre-line">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Education */}
        {education.length > 0 && (
          <section>
            <h2 className="text-base font-normal text-gray-800 mb-3">Education</h2>
            <div className="space-y-3">
              {education.map((edu, index) => (
                <div key={index}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-medium text-gray-700">{edu.degree}</h3>
                    <span className="text-xs text-gray-500">
                      {formatDate(edu.startDate)} — {formatDate(edu.endDate)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 italic mb-1">{edu.institution}</p>
                  {edu.gpa && <p className="text-xs text-gray-600">CGPA: {edu.gpa}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Projects */}
        {projects.length > 0 && (
          <section>
            <h2 className="text-base font-normal text-gray-800 mb-3">Projects</h2>
            <div className="space-y-3">
              {projects.map((project, index) => (
                <div key={index}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-medium text-gray-700">{project.name}</h3>
                    {project.link && (
                      <a href={project.link} className="text-xs text-gray-500 underline hover:text-gray-700">
                        View Project
                      </a>
                    )}
                  </div>
                  {project.technologies && (
                    <p className="text-xs text-gray-600 italic mb-1">{project.technologies}</p>
                  )}
                  <p className="text-xs text-gray-600 whitespace-pre-line">{project.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Skills */}
        {skills.length > 0 && (
          <section>
            <h2 className="text-base font-normal text-gray-800 mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                  {skill.name}
                </span>
              ))}
            </div>
          </section>
        )}
        
        {/* Achievements */}
        {achievements.length > 0 && (
          <section>
            <h2 className="text-base font-normal text-gray-800 mb-3">Achievements</h2>
            <ul className="list-inside text-xs text-gray-600 space-y-1">
              {achievements.map((achievement, index) => (
                <li key={index}>
                  <span className="font-medium">{achievement.title}</span>
                  {achievement.description && ` — ${achievement.description}`}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

export default MinimalTemplate; 