function ClassicTemplate({ data }) {
  // Destructure data with default values for all sections
  const { 
    personal = {
      name: 'Darshan Godase',
      title: 'Software Engineer',
      email: 'darshangodase10@gmail.com',
      phone: '(+91)-9699xxxxxx',
      website: 'Portfolio',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      leetcode: 'LeetCode',
      summary: 'Passion for growth and a drive for success fuel my ambition to continuously learn and adapt in an ever-changing world.'
    },
    education = [
      {
        institution: 'Pimpri Chinchwad College Of Engineering',
        degree: 'B.Tech - Information Technology',
        gpa: '8.31',
        location: 'Pimpri Chinchwad, Maharashtra',
        startDate: '2022-01-01',
        endDate: '2026-01-01'
      }
    ],
    experience = [
      {
        company: 'Hirer',
        position: 'Frontend Intern',
        startDate: '2021-10-01',
        endDate: '2021-11-01',
        description: '• Engineered 20+ reusable UI components using React.js and Tailwind CSS, enhancing code scalability and maintainability, reducing development time for future features by 30%.\n• Optimized website performance by improving code efficiency, achieving a 25% reduction in load times and increasing user responsiveness by 15%.\n• Diagnosed and resolved over 10 critical UI issues, ensuring 100% cross-browser compatibility and delivering a consistent user experience across daily active users.'
      }
    ],
    skills = [
      { name: 'C', level: '' },
      { name: 'C++', level: '' },
      { name: 'JavaScript', level: '' }
    ],
    projects = [
      {
        name: 'MossBuddy',
        technologies: 'Tailwind CSS, React, Node.js, Express.js, MongoDB',
        startDate: '2024-10-01',
        description: '• Developed a full-stack application for moss management to display real-time data menus with user ratings and availability status, enhancing data accessibility and decision-making.\n• Integrated a pre-booking feature for users, enabling advance meal reservations and improving booking efficiency by 40% while streamlining operations management for mess owners.\n• Showcased top-rated dishes on the landing page, increasing user engagement and session duration by 30% and enhancing overall website usability and customer satisfaction.'
      }
    ],
    achievements = [
      {
        title: 'Demonstrated competitive programming expertise',
        description: 'with a 3-star CodeChef rating and 1700+ LeetCode rating, showcasing skills in data structures, algorithms, and optimization.'
      }
    ]
  } = data || {};
  
  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };
  
  return (
    <div className="w-full h-full flex flex-col font-serif p-8 px-10 bg-white">
      {/* Header with name centered */}
      <header className="text-center mb-4">
        <h1 className="text-2xl font-bold tracking-wider uppercase">
          {personal.name}
        </h1>
        
        {/* Contact information row */}
        <div className="flex justify-center items-center gap-2 mt-2 text-xs">
          {personal.phone && <span>{personal.phone}</span>}
          {personal.email && <span> • {personal.email}</span>}
          {personal.website && <span> • {personal.website}</span>}
          {personal.linkedin && <span> • {personal.linkedin}</span>}
          {personal.github && <span> • {personal.github}</span>}
          {personal.leetcode && <span> • {personal.leetcode}</span>}
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-grow">
        {/* EDUCATION */}
        <section className="mb-4">
          <h2 className="text-base font-bold mb-2 tracking-wider uppercase">EDUCATION</h2>
          <div className="w-full h-px bg-gray-400 mb-2"></div>
          {education.map((edu, index) => (
            <div key={index} className="mb-1">
              <div className="flex justify-between">
                <div>
                  <div className="text-sm font-bold">{edu.institution}</div>
                  <div className="italic text-xs">
                    B.Tech - {edu.degree} {edu.gpa && `- CGPA - ${edu.gpa}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{edu.startDate && edu.endDate ? `${new Date(edu.startDate).getFullYear()} - ${new Date(edu.endDate).getFullYear()}` : ''}</div>
                  <div className="text-xs">{edu.location}</div>
                </div>
              </div>
            </div>
          ))}
        </section>
        
        {/* WORK EXPERIENCE */}
        <section className="mb-4">
          <h2 className="text-base font-bold mb-2 tracking-wider uppercase">WORK EXPERIENCE</h2>
          <div className="w-full h-px bg-gray-400 mb-2"></div>
          {experience.map((exp, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between">
                <div className="text-sm font-bold">{exp.company} {exp.company === "Hirer" && <span>↗</span>}</div>
                <div className="text-xs">{formatDate(exp.startDate)} - {formatDate(exp.endDate)}</div>
              </div>
              <div className="italic text-xs">{exp.position}</div>
              <div className="text-xs whitespace-pre-line">{exp.description}</div>
            </div>
          ))}
        </section>
        
        {/* PROJECTS */}
        <section className="mb-4">
          <h2 className="text-base font-bold mb-2 tracking-wider uppercase">PROJECTS</h2>
          <div className="w-full h-px bg-gray-400 mb-2"></div>
          {projects.map((project, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between">
                <div className="text-sm font-bold">{project.name}</div>
                <div className="text-xs">{project.startDate ? formatDate(project.startDate) : ''}</div>
              </div>
              <div className="italic text-xs">{project.technologies}</div>
              <div className="text-xs whitespace-pre-line">{project.description}</div>
            </div>
          ))}
        </section>
        
        {/* TECHNICAL SKILLS */}
        <section className="mb-4">
          <h2 className="text-base font-bold mb-2 tracking-wider uppercase">TECHNICAL SKILLS</h2>
          <div className="w-full h-px bg-gray-400 mb-2"></div>
          <div className="text-xs">
            <div>
              <span className="font-bold">Languages: </span>
              {skills.map((skill, index) => (
                <span key={index}>{skill.name}{index < skills.length - 1 ? ', ' : ''}</span>
              ))}
            </div>
            <div>
              <span className="font-bold">Technologies/Frameworks: </span>
              GitHub, Tailwind CSS, ReactJS, NodeJS, ExpressJS
            </div>
            <div>
              <span className="font-bold">Developer Tools: </span>
              VS Code, Git
            </div>
            <div>
              <span className="font-bold">Database: </span>
              MongoDB, MySQL
            </div>
            <div>
              <span className="font-bold">Others: </span>
              Data Structures & Algorithms, Database Management System, OOPS Concepts, Operating System
            </div>
          </div>
        </section>
        
        {/* ACHIEVEMENTS */}
        <section className="mb-4">
          <h2 className="text-base font-bold mb-2 tracking-wider uppercase">ACHIEVEMENTS</h2>
          <div className="w-full h-px bg-gray-400 mb-2"></div>
          <ul className="text-xs">
            {achievements.map((achievement, index) => (
              <li key={index} className="mb-1">
                • <span className="font-medium">{achievement.title}</span> {achievement.description}
              </li>
            ))}
            <li>• <span className="font-medium">Secured 3rd place</span> in ByteMe Technical Event among 30+ teams, recognized for collaboration, critical analysis, and technical expertise under tight deadlines.</li>
            <li>• <span className="font-medium">Authored</span> a research paper on AI for Dyslexia, accepted for presentation at <span className="font-bold">CONFLUENCE 2023</span>.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default ClassicTemplate; 