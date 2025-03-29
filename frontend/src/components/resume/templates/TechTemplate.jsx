import React from 'react';

function TechTemplate({ data }) {
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
    <div className="w-full h-full flex flex-col font-mono bg-gray-50 p-6 px-8">
      {/* Header with code-like styling */}
      <header className="mb-6 border-b-2 border-cyan-500 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              <span className="text-cyan-600">&lt;</span>
              {personal.name}
              <span className="text-cyan-600">/&gt;</span>
            </h1>
            <p className="text-sm text-gray-600 mt-1 ml-4">
              <span className="text-cyan-600">// </span>
              {personal.title}
            </p>
          </div>
          <div className="flex flex-col items-end text-xs text-gray-600">
            {personal.phone && <span>{personal.phone}</span>}
            {personal.email && <span>{personal.email}</span>}
            {personal.github && <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              {personal.github}
            </span>}
            {personal.linkedin && <span>{personal.linkedin}</span>}
          </div>
        </div>
        
        {/* Summary in code comment style */}
        {personal.summary && (
          <div className="mt-4 bg-gray-100 border-l-4 border-cyan-500 p-3 rounded-r">
            <p className="text-xs text-gray-700 font-light">
              <span className="text-cyan-600">/**</span><br />
              <span className="text-cyan-600"> * </span>{personal.summary}<br />
              <span className="text-cyan-600"> */</span>
            </p>
          </div>
        )}
      </header>
      
      {/* Technical Skills displayed prominently */}
      {skills.length > 0 && (
        <section className="mb-5">
          <h2 className="text-base font-bold text-gray-800 mb-2 flex items-center">
            <span className="text-cyan-600 mr-2">const</span>
            TECHNICAL_SKILLS
            <span className="text-cyan-600 ml-2">= {`{`}</span>
          </h2>
          <div className="ml-4 grid grid-cols-2 gap-1">
            {skills.map((skill, index) => (
              <div key={index} className="flex items-center">
                <span className="text-xs text-cyan-600 mr-2">•</span>
                <span className="text-xs">{skill.name}{index !== skills.length - 1 ? ',' : ''}</span>
              </div>
            ))}
          </div>
          <div className="text-cyan-600 text-right">{`}`};</div>
        </section>
      )}
      
      {/* Experience */}
      {experience.length > 0 && (
        <section className="mb-5">
          <h2 className="text-base font-bold text-gray-800 mb-2">
            <span className="text-cyan-600">function</span> ProfessionalExperience() {`{`}
          </h2>
          <div className="ml-4 space-y-3">
            {experience.map((exp, index) => (
              <div key={index} className="border-l-2 border-gray-200 pl-3 pb-2">
                <div className="flex justify-between">
                  <h3 className="text-sm font-semibold">
                    <span className="text-cyan-600">.</span>
                    {exp.position} <span className="font-normal">@ {exp.company}</span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                  </p>
                </div>
                <div className="text-xs whitespace-pre-line mt-1">{exp.description}</div>
              </div>
            ))}
          </div>
          <div className="text-cyan-600 text-right">{`}`};</div>
        </section>
      )}
      
      {/* Projects */}
      {projects.length > 0 && (
        <section className="mb-5">
          <h2 className="text-base font-bold text-gray-800 mb-2">
            <span className="text-cyan-600">class</span> Projects {`{`}
          </h2>
          <div className="ml-4 space-y-3">
            {projects.map((project, index) => (
              <div key={index}>
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-semibold">
                    <span className="text-cyan-600">.</span>
                    {project.name}
                  </h3>
                  {project.link && (
                    <a href={project.link} className="text-xs text-cyan-600 hover:underline">
                      {`<Link />`}
                    </a>
                  )}
                </div>
                {project.technologies && (
                  <p className="text-xs text-gray-600 ml-4">
                    <span className="text-cyan-600">tech:</span> {project.technologies}
                  </p>
                )}
                <p className="text-xs whitespace-pre-line ml-4 mt-1">{project.description}</p>
              </div>
            ))}
          </div>
          <div className="text-cyan-600 text-right">{`}`};</div>
        </section>
      )}
      
      {/* Education */}
      {education.length > 0 && (
        <section className="mb-5">
          <h2 className="text-base font-bold text-gray-800 mb-2">
            <span className="text-cyan-600">import</span> Education {`{`}
          </h2>
          <div className="ml-4 space-y-2">
            {education.map((edu, index) => (
              <div key={index} className="flex flex-col">
                <div className="flex justify-between">
                  <h3 className="text-sm font-semibold">
                    <span className="text-cyan-600">.</span>
                    {edu.degree}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                  </p>
                </div>
                <p className="text-xs text-gray-600 ml-4">{edu.institution}</p>
                {edu.gpa && (
                  <p className="text-xs text-gray-600 ml-4">
                    <span className="text-cyan-600">CGPA:</span> {edu.gpa}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="text-cyan-600 text-right">{`}`};</div>
        </section>
      )}
      
      {/* Achievements */}
      {achievements.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">
            <span className="text-cyan-600">const</span> Achievements = [
          </h2>
          <div className="ml-4 space-y-1">
            {achievements.map((achievement, index) => (
              <div key={index} className="text-xs">
                {`{`}
                <span className="text-xs ml-2">
                  <span className="text-cyan-600">title:</span> "{achievement.title}",
                </span>
                {achievement.description && (
                  <span className="text-xs">
                    <span className="text-cyan-600"> desc:</span> "{achievement.description}"
                  </span>
                )}
                {`}`}{index !== achievements.length - 1 ? ',' : ''}
              </div>
            ))}
          </div>
          <div className="text-cyan-600 text-right">];</div>
        </section>
      )}
      
      {/* Footer with code-like comment */}
      <footer className="mt-auto pt-4 text-xs text-center text-gray-500">
        <span className="text-cyan-600">// </span>
        Last updated: {new Date().toLocaleDateString()}
      </footer>
    </div>
  );
}

export default TechTemplate; 