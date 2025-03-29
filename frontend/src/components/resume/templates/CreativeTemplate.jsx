import React from 'react';

function CreativeTemplate({ data }) {
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
    <div className="w-full h-full flex flex-col font-sans bg-white">
      {/* Header with gradient background */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 rounded-b-3xl">
        <h1 className="text-2xl font-bold tracking-wide">{personal.name}</h1>
        <p className="text-sm mt-1 text-purple-100">{personal.title}</p>
        
        {/* Contact Info */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          {personal.phone && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {personal.phone}
            </div>
          )}
          {personal.email && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {personal.email}
            </div>
          )}
          {personal.website && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              {personal.website}
            </div>
          )}
          {personal.linkedin && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {personal.linkedin}
            </div>
          )}
        </div>
        
        {/* Summary */}
        {personal.summary && (
          <div className="mt-4 border-t border-purple-400 pt-3">
            <p className="text-xs leading-relaxed text-purple-100">{personal.summary}</p>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <div className="p-8 flex-grow grid grid-cols-1 gap-6">
        {/* Experience */}
        {experience.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-indigo-700 mb-3 flex items-center">
              <span className="w-6 h-6 bg-indigo-600 rounded-full flex justify-center items-center text-white mr-2 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              Experience
            </h2>
            <div className="space-y-4 ml-8">
              {experience.map((exp, index) => (
                <div key={index} className="relative pb-4 border-l-2 border-indigo-200 pl-4">
                  {/* Dot at the start of timeline */}
                  <div className="absolute -left-[5px] top-0 w-2 h-2 bg-indigo-400 rounded-full"></div>
                  
                  <div className="flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-800">{exp.position}</h3>
                    <p className="text-xs text-indigo-600 italic">{exp.company}</p>
                    <p className="text-xs text-gray-600 mb-2">
                      {formatDate(exp.startDate)} — {formatDate(exp.endDate)}
                    </p>
                    <p className="text-xs text-gray-600 whitespace-pre-line">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Two-column layout for Education and Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Education */}
          {education.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-indigo-700 mb-3 flex items-center">
                <span className="w-6 h-6 bg-indigo-600 rounded-full flex justify-center items-center text-white mr-2 text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                </span>
                Education
              </h2>
              <div className="space-y-3 ml-8">
                {education.map((edu, index) => (
                  <div key={index} className="relative pb-3 border-l-2 border-indigo-200 pl-4">
                    {/* Dot at the start of timeline */}
                    <div className="absolute -left-[5px] top-0 w-2 h-2 bg-indigo-400 rounded-full"></div>
                    
                    <h3 className="text-sm font-semibold text-gray-800">{edu.degree}</h3>
                    <p className="text-xs text-indigo-600 italic">{edu.institution}</p>
                    <p className="text-xs text-gray-600">
                      {formatDate(edu.startDate)} — {formatDate(edu.endDate)}
                    </p>
                    {edu.gpa && <p className="text-xs text-gray-600">CGPA: {edu.gpa}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {/* Skills */}
          {skills.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-indigo-700 mb-3 flex items-center">
                <span className="w-6 h-6 bg-indigo-600 rounded-full flex justify-center items-center text-white mr-2 text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                Skills
              </h2>
              <div className="flex flex-wrap gap-2 ml-8">
                {skills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="text-xs px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full border border-indigo-200"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
        
        {/* Projects */}
        {projects.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-indigo-700 mb-3 flex items-center">
              <span className="w-6 h-6 bg-indigo-600 rounded-full flex justify-center items-center text-white mr-2 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </span>
              Projects
            </h2>
            <div className="grid grid-cols-1 gap-4 ml-8">
              {projects.map((project, index) => (
                <div key={index} className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-indigo-800">{project.name}</h3>
                    {project.link && (
                      <a href={project.link} className="text-xs text-indigo-600 hover:text-indigo-800 underline flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View
                      </a>
                    )}
                  </div>
                  {project.technologies && (
                    <p className="text-xs text-indigo-600 mb-1">{project.technologies}</p>
                  )}
                  <p className="text-xs text-gray-600 whitespace-pre-line">{project.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Achievements */}
        {achievements.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-indigo-700 mb-3 flex items-center">
              <span className="w-6 h-6 bg-indigo-600 rounded-full flex justify-center items-center text-white mr-2 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </span>
              Achievements
            </h2>
            <div className="space-y-2 ml-8">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full flex items-center justify-center mr-2 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">{achievement.title}</h3>
                    <p className="text-xs text-gray-600">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default CreativeTemplate; 