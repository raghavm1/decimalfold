import { InsertJob } from "@shared/schema";

// Job templates for generating scaled job data
const jobTemplates = {
  titles: [
    "Software Engineer", "Senior Software Engineer", "Full Stack Developer", "Frontend Developer", 
    "Backend Developer", "DevOps Engineer", "Data Scientist", "Machine Learning Engineer",
    "Product Manager", "Engineering Manager", "Tech Lead", "Principal Engineer",
    "Mobile Developer", "iOS Developer", "Android Developer", "React Developer",
    "Node.js Developer", "Python Developer", "Java Developer", "C# Developer",
    "Database Administrator", "System Administrator", "Cloud Engineer", "Security Engineer",
    "QA Engineer", "Test Automation Engineer", "UI/UX Designer", "Data Engineer",
    "Site Reliability Engineer", "Platform Engineer", "Infrastructure Engineer", "Blockchain Developer",
    "Game Developer", "Embedded Systems Engineer", "AI Research Scientist", "Computer Vision Engineer",
    "Cybersecurity Analyst", "Solutions Architect", "Enterprise Architect", "Staff Engineer"
  ],
  
  companies: [
    "TechCorp", "InnovateLabs", "DataFlow Solutions", "CloudTech Systems", "NextGen Software",
    "AI Dynamics", "CyberSecure Inc", "WebScale Technologies", "MobileTech Solutions", "DevOps Pro",
    "Analytics Plus", "FinTech Innovations", "HealthTech Solutions", "EduTech Systems", "GameDev Studios",
    "Blockchain Ventures", "IoT Solutions", "RoboTech Corp", "Quantum Computing Inc", "VR Technologies",
    "SmartCity Solutions", "GreenTech Innovations", "Autonomous Systems", "NeuralNet Corp", "DataMining Inc",
    "CloudNative Solutions", "MicroServices Ltd", "API Gateway Corp", "Container Solutions", "ServerlessTech"
  ],
  
  locations: [
    "San Francisco, CA", "New York, NY", "Seattle, WA", "Austin, TX", "Boston, MA",
    "Los Angeles, CA", "Chicago, IL", "Denver, CO", "Portland, OR", "Atlanta, GA",
    "Miami, FL", "Philadelphia, PA", "Phoenix, AZ", "Dallas, TX", "San Diego, CA",
    "Remote", "Hybrid - SF Bay Area", "Hybrid - NYC", "Remote (US Only)", "Hybrid - Seattle"
  ],
  
  experienceLevels: ["Entry Level", "Mid-Level", "Senior Level", "Leadership"],
  
  workTypes: ["Full-time", "Part-time", "Contract", "Freelance"],
  
  skills: {
    frontend: ["React", "Vue.js", "Angular", "JavaScript", "TypeScript", "HTML5", "CSS3", "Sass", "Tailwind CSS", "Bootstrap"],
    backend: ["Node.js", "Python", "Java", "C#", "Go", "Rust", "PHP", "Ruby", "Django", "Flask", "Spring Boot", "Express.js"],
    databases: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Cassandra", "DynamoDB", "Elasticsearch", "Neo4j"],
    cloud: ["AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Terraform", "Jenkins", "GitLab CI"],
    mobile: ["React Native", "Flutter", "Swift", "Kotlin", "Xamarin", "Ionic"],
    data: ["Pandas", "NumPy", "Scikit-learn", "TensorFlow", "PyTorch", "Spark", "Hadoop", "Tableau", "Power BI"],
    devops: ["Docker", "Kubernetes", "Jenkins", "GitLab CI", "Ansible", "Terraform", "Prometheus", "Grafana"]
  },
  
  industries: [
    "Technology", "Financial Services", "Healthcare", "E-commerce", "Education", "Gaming",
    "Fintech", "Biotech", "Automotive", "Aerospace", "Entertainment", "Media", "Retail",
    "Real Estate", "Energy", "Manufacturing", "Telecommunications", "Government", "Non-profit"
  ]
};

// Generate job descriptions based on role and skills
function generateJobDescription(title: string, skills: string[], industry: string): string {
  const responsibilities = [
    `Design and develop scalable ${title.toLowerCase()} solutions`,
    `Collaborate with cross-functional teams to deliver high-quality software`,
    `Participate in code reviews and maintain coding standards`,
    `Troubleshoot and debug complex technical issues`,
    `Contribute to architectural decisions and technical strategy`,
    `Mentor junior team members and share technical knowledge`,
    `Stay updated with latest industry trends and technologies`,
    `Work in an agile development environment with regular sprint cycles`
  ];
  
  const randomResponsibilities = responsibilities
    .sort(() => 0.5 - Math.random())
    .slice(0, 4 + Math.floor(Math.random() * 3));
  
  return `Join our ${industry} team as a ${title}. ${randomResponsibilities.join('. ')}.`;
}

// Generate job requirements based on experience level and skills
function generateJobRequirements(experienceLevel: string, skills: string[]): string {
  const baseRequirements = [
    `${experienceLevel === 'Entry Level' ? '0-2' : experienceLevel === 'Mid-Level' ? '3-5' : experienceLevel === 'Senior Level' ? '5-8' : '8+'} years of professional experience`,
    `Strong proficiency in ${skills.slice(0, 3).join(', ')}`,
    `Experience with modern development practices and methodologies`,
    `Excellent problem-solving and communication skills`,
    `Bachelor's degree in Computer Science or related field (or equivalent experience)`
  ];
  
  if (experienceLevel !== 'Entry Level') {
    baseRequirements.push(`Proven track record of delivering complex technical projects`);
  }
  
  if (experienceLevel === 'Leadership') {
    baseRequirements.push(`Experience leading and mentoring engineering teams`);
  }
  
  return baseRequirements.join('. ');
}

// Generate salary range based on experience level and location
function generateSalaryRange(experienceLevel: string, location: string): { min: number, max: number } {
  const baseRanges = {
    'Entry Level': { min: 70000, max: 95000 },
    'Mid-Level': { min: 95000, max: 140000 },
    'Senior Level': { min: 140000, max: 200000 },
    'Leadership': { min: 180000, max: 300000 }
  };
  
  const locationMultiplier = location.includes('San Francisco') || location.includes('NYC') || location.includes('Seattle') ? 1.3 :
                             location.includes('Los Angeles') || location.includes('Boston') ? 1.2 :
                             location.includes('Austin') || location.includes('Denver') ? 1.1 : 1.0;
  
  const base = baseRanges[experienceLevel as keyof typeof baseRanges];
  return {
    min: Math.round(base.min * locationMultiplier),
    max: Math.round(base.max * locationMultiplier)
  };
}

// Main job generation function
export function generateJobs(count: number): InsertJob[] {
  const jobs: InsertJob[] = [];
  
  for (let i = 0; i < count; i++) {
    const title = jobTemplates.titles[Math.floor(Math.random() * jobTemplates.titles.length)];
    const company = jobTemplates.companies[Math.floor(Math.random() * jobTemplates.companies.length)];
    const location = jobTemplates.locations[Math.floor(Math.random() * jobTemplates.locations.length)];
    const experienceLevel = jobTemplates.experienceLevels[Math.floor(Math.random() * jobTemplates.experienceLevels.length)];
    const workType = jobTemplates.workTypes[Math.floor(Math.random() * jobTemplates.workTypes.length)];
    const industry = jobTemplates.industries[Math.floor(Math.random() * jobTemplates.industries.length)];
    
    // Select relevant skills based on job title
    let skillPool: string[] = [];
    if (title.toLowerCase().includes('frontend') || title.toLowerCase().includes('react')) {
      skillPool = [...jobTemplates.skills.frontend, ...jobTemplates.skills.cloud.slice(0, 3)];
    } else if (title.toLowerCase().includes('backend') || title.toLowerCase().includes('node') || title.toLowerCase().includes('python')) {
      skillPool = [...jobTemplates.skills.backend, ...jobTemplates.skills.databases, ...jobTemplates.skills.cloud.slice(0, 3)];
    } else if (title.toLowerCase().includes('data') || title.toLowerCase().includes('ml') || title.toLowerCase().includes('ai')) {
      skillPool = [...jobTemplates.skills.data, ...jobTemplates.skills.backend.slice(0, 3), ...jobTemplates.skills.cloud.slice(0, 2)];
    } else if (title.toLowerCase().includes('devops') || title.toLowerCase().includes('cloud') || title.toLowerCase().includes('infrastructure')) {
      skillPool = [...jobTemplates.skills.devops, ...jobTemplates.skills.cloud, ...jobTemplates.skills.backend.slice(0, 2)];
    } else if (title.toLowerCase().includes('mobile') || title.toLowerCase().includes('ios') || title.toLowerCase().includes('android')) {
      skillPool = [...jobTemplates.skills.mobile, ...jobTemplates.skills.frontend.slice(0, 3), ...jobTemplates.skills.cloud.slice(0, 2)];
    } else {
      // Full stack or general software engineer
      skillPool = [
        ...jobTemplates.skills.frontend.slice(0, 4),
        ...jobTemplates.skills.backend.slice(0, 4),
        ...jobTemplates.skills.databases.slice(0, 3),
        ...jobTemplates.skills.cloud.slice(0, 3)
      ];
    }
    
    // Select 5-8 random skills from the pool
    const selectedSkills = skillPool
      .sort(() => 0.5 - Math.random())
      .slice(0, 5 + Math.floor(Math.random() * 4));
    
    const description = generateJobDescription(title, selectedSkills, industry);
    const requirements = generateJobRequirements(experienceLevel, selectedSkills);
    const salary = generateSalaryRange(experienceLevel, location);
    
    jobs.push({
      title,
      company,
      location,
      description,
      requirements,
      skills: selectedSkills,
      experienceLevel,
      salaryMin: salary.min,
      salaryMax: salary.max,
      workType,
      postedDate: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      industry
    });
  }
  
  return jobs;
}

// Specialized generators for testing different scenarios
export function generateTechJobs(count: number): InsertJob[] {
  return generateJobs(count).filter(job => 
    job.title.toLowerCase().includes('engineer') || 
    job.title.toLowerCase().includes('developer')
  );
}

export function generateDataJobs(count: number): InsertJob[] {
  const dataRoles = jobTemplates.titles.filter(title => 
    title.toLowerCase().includes('data') || 
    title.toLowerCase().includes('ml') || 
    title.toLowerCase().includes('ai')
  );
  
  return Array.from({ length: count }, () => {
    const title = dataRoles[Math.floor(Math.random() * dataRoles.length)];
    const company = jobTemplates.companies[Math.floor(Math.random() * jobTemplates.companies.length)];
    const location = jobTemplates.locations[Math.floor(Math.random() * jobTemplates.locations.length)];
    const experienceLevel = jobTemplates.experienceLevels[Math.floor(Math.random() * jobTemplates.experienceLevels.length)];
    const skills = [...jobTemplates.skills.data, ...jobTemplates.skills.backend.slice(0, 2)]
      .sort(() => 0.5 - Math.random())
      .slice(0, 6);
    
    const salary = generateSalaryRange(experienceLevel, location);
    
    return {
      title,
      company,
      location,
      description: generateJobDescription(title, skills, "Technology"),
      requirements: generateJobRequirements(experienceLevel, skills),
      skills,
      experienceLevel,
      salaryMin: salary.min,
      salaryMax: salary.max,
      workType: "Full-time",
      postedDate: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      industry: "Technology"
    };
  });
}