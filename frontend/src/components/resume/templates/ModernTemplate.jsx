function ModernTemplate({ data }) {
  // Destructure data with default values for all sections
  const { 
    personal = {
      name: 'Darshan Godase',
      title: 'full stack developer',
      email: 'darshangodase10@gmail.com',
      phone: '(+91)-9699xxxxxx',
      address: 'Mumbai, India',
      website: '',
      linkedin: '',
      summary: 'Passion for growth and a drive for success fuel my ambition to continuously learn and adapt in an ever-changing world. With a focus on innovation and efficiency, I strive to contribute meaningfully in all my endeavors'
    },
    education = [
      {
        institution: 'Western Illinois University',
        degree: 'Master in Computer Science',
        field: '',
        startDate: '2023-02-01',
        endDate: '2024-02-01',
        description: ''
      }
    ],
    experience = [
      {
        company: 'Amazon',
        position: 'Full Stack Developer',
        startDate: '2021-01-01',
        endDate: '',
        description: '* Designed, developed, and maintained full-stack applications using React and Node.js.\n* Implemented responsive user interfaces with React, ensuring seamless user experiences.\n* Maintaining the React Native in-house organization application.\n* Created RESTful APIs with Node.js and Express and improved backend speed.'
      }
    ],
    skills = [
      { name: 'Angular', level: '' },
      { name: 'MySQL', level: '' },
      { name: 'React', level: '' },
      { name: 'React Native', level: '' }
    ],
    projects = [
      {
        name: 'Portfolio Website',
        link: '',
        technologies: 'React, CSS, Netlify',
        description: '* Developed a personal portfolio website.\n* Showcasing projects, skills, and contact information.'
      }
    ],
    achievements = [
      {
        title: 'GATE Qualified',
        description: 'Successfully qualified the GATE exam with excellent performance.'
      },
      {
        title: 'LeetCode Knight',
        description: 'Achieved the prestigious LeetCode Knight badge by solving numerous challenging problems.'
      }
    ]
  } = data || {};
  
  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
  };
  
  return (
    <div className="w-full h-full flex flex-col font-sans p-4 px-8 bg-white">
      {/* Header - Name and Title */}
      <header className="text-center mb-3">
        <h1 className="text-2xl font-bold text-gray-800">{personal.name}</h1>
        <p className="text-sm text-gray-600">{personal.title}</p>
      </header>
      
      {/* Contact Info */}
      <div className="flex justify-center items-center gap-6 mb-3 text-xs">
        <div className="flex items-center">
          <span className="mr-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </span>
          {personal.phone}
        </div>
        <div className="flex items-center">
          <span className="mr-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </span>
          {personal.email}
        </div>
      </div>
      
      <hr className="mb-3 border-gray-200" />
      
      {/* Main content with improved spacing */}
      <div className="flex-grow flex flex-col gap-y-3">
        {/* Profile Summary */}
        <div>
          <h2 className="text-base font-bold text-blue-600 mb-1">Profile Summary</h2>
          <p className="text-xs text-gray-700">{personal.summary}</p>
        </div>
        
        {/* Education */}
        <div>
          <h2 className="text-base font-bold text-blue-600 mb-1">Education</h2>
          {education.map((edu, index) => (
            <div key={index} className="mb-2">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 mt-1 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">{edu.degree}</h3>
                  <p className="text-xs text-gray-600">{edu.institution}</p>
                </div>
                <div className="ml-auto text-right">
                  <span className="text-xs text-gray-600">
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Work Experience */}
        <div>
          <h2 className="text-base font-bold text-blue-600 mb-1">Work Experience</h2>
          {experience.map((exp, index) => (
            <div key={index} className="mb-2">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 mt-1 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold text-gray-800">{exp.position}</h3>
                    <span className="text-xs text-gray-600 ml-2">
                      {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{exp.company}</p>
                  <div className="text-xs text-gray-700 whitespace-pre-line">{exp.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Projects */}
        <div>
          <h2 className="text-base font-bold text-blue-600 mb-1">Projects</h2>
          {projects.map((project, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold text-gray-800">{project.name}</h3>
                <div className="flex space-x-2">
                  {project.link && (
                    <>
                      <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-700 whitespace-pre-line">{project.description}</div>
              {project.technologies && (
                <p className="text-xs text-gray-600 mt-1"><span className="font-medium">Technologies:</span> {project.technologies}</p>
              )}
            </div>
          ))}
        </div>
        
        {/* Technical Skills */}
        <div>
          <h2 className="text-base font-bold text-blue-600 mb-1">Technical Skills</h2>
          <div className="grid grid-cols-2">
            {skills.map((skill, index) => (
              <div key={index} className="flex items-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs text-gray-700">{skill.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Achievements */}
        <div>
          <h2 className="text-base font-bold text-blue-600 mb-1">Achievements</h2>
          <ul className="list-disc list-inside text-xs text-gray-700">
            {achievements.map((achievement, index) => (
              <li key={index} className="ml-4 mb-1">
                <span className="font-medium">{achievement.title}:</span> {achievement.description}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ModernTemplate; 