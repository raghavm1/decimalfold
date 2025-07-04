import { faker } from '@faker-js/faker';

interface JobCategory {
  titles: string[];
  techStacks: string[][];
  experienceLevels: string[];
  salaryRanges: { min: number; max: number }[];
}

interface CompanyType {
  names: string[];
  sizes: string[];
  descriptions: string[];
}

// Expanded job categories with business and non-technical roles
const JOB_CATEGORIES: Record<string, JobCategory> = {
  engineering: {
    titles: [
      "Senior Software Engineer", "Full Stack Developer", "Frontend Developer", 
      "Backend Developer", "Mobile Developer", "DevOps Engineer", "Site Reliability Engineer",
      "Principal Engineer", "Engineering Manager", "Tech Lead", "Software Architect",
      "Platform Engineer", "Infrastructure Engineer", "Security Engineer", "QA Engineer",
      "Machine Learning Engineer", "Data Engineer", "Cloud Engineer", "Embedded Systems Engineer",
      "Staff Software Engineer", "Senior Engineering Manager", "VP of Engineering"
    ],
    techStacks: [
      ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS"],
      ["Vue.js", "Python", "Django", "MySQL", "GCP"],
      ["Angular", "Java", "Spring", "MongoDB", "Azure"],
      ["React Native", "Flutter", "Firebase", "Kotlin", "Swift"],
      ["Python", "TensorFlow", "Kubernetes", "Docker", "Redis"],
      ["Go", "Microservices", "Kafka", "Elasticsearch", "Terraform"],
      ["C++", "Linux", "Embedded Systems", "Real-time Systems"],
      ["Rust", "WebAssembly", "GraphQL", "Prisma", "Vercel"]
    ],
    experienceLevels: ["Entry Level (0-2 years)", "Mid Level (2-5 years)", "Senior (5-8 years)", "Staff (8-12 years)", "Principal (12+ years)"],
    salaryRanges: [
      { min: 60, max: 90 },   // Entry
      { min: 80, max: 120 },  // Mid
      { min: 120, max: 180 }, // Senior
      { min: 160, max: 250 }, // Staff
      { min: 220, max: 350 }  // Principal
    ]
  },

  data: {
    titles: [
      "Data Scientist", "Data Analyst", "Senior Data Scientist", "Principal Data Scientist",
      "Machine Learning Engineer", "Data Engineer", "Analytics Engineer", "Business Intelligence Analyst",
      "Research Scientist", "Quantitative Analyst", "Data Science Manager", "Head of Data",
      "MLOps Engineer", "AI Researcher", "Statistical Analyst", "Product Analyst",
      "Senior Data Engineer", "Staff Data Scientist", "Director of Data Science"
    ],
    techStacks: [
      ["Python", "Pandas", "Scikit-learn", "SQL", "Tableau"],
      ["R", "TensorFlow", "PyTorch", "Spark", "Hadoop"],
      ["Python", "Jupyter", "AWS SageMaker", "Airflow", "dbt"],
      ["SQL", "Power BI", "Excel", "Looker", "Snowflake"],
      ["Scala", "Apache Spark", "Kafka", "Databricks", "MLflow"],
      ["Julia", "Statistics", "Bayesian Analysis", "SPSS", "SAS"]
    ],
    experienceLevels: ["Entry Level (0-2 years)", "Associate (1-3 years)", "Senior (3-6 years)", "Principal (6-10 years)", "Director (10+ years)"],
    salaryRanges: [
      { min: 70, max: 95 },   // Entry
      { min: 90, max: 130 },  // Associate
      { min: 130, max: 180 }, // Senior
      { min: 170, max: 250 }, // Principal
      { min: 220, max: 300 }  // Director
    ]
  },

  product: {
    titles: [
      "Product Manager", "Senior Product Manager", "Principal Product Manager", "Director of Product",
      "Product Owner", "Technical Product Manager", "Growth Product Manager", "Product Marketing Manager",
      "Associate Product Manager", "VP of Product", "Head of Product", "Product Analyst",
      "Product Designer", "UX Designer", "UI Designer", "Design Manager", "Senior UX Designer",
      "Principal Designer", "Head of Design", "UX Researcher", "Design System Manager"
    ],
    techStacks: [
      ["Figma", "Analytics", "A/B Testing", "SQL", "Mixpanel"],
      ["Sketch", "Principle", "InVision", "Zeplin", "Miro"],
      ["ProductBoard", "Amplitude", "Looker", "Tableau", "Jira"],
      ["Adobe Creative Suite", "Framer", "ProtoPie", "UserTesting"],
      ["Confluence", "Notion", "Linear", "Productboard", "Roadmunk"],
      ["User Research", "Usability Testing", "Journey Mapping", "Personas"]
    ],
    experienceLevels: ["Entry Level (0-2 years)", "Associate (1-3 years)", "Senior (3-6 years)", "Principal (6-10 years)", "Director (10+ years)"],
    salaryRanges: [
      { min: 80, max: 110 },  // Entry
      { min: 100, max: 140 }, // Associate
      { min: 140, max: 190 }, // Senior
      { min: 180, max: 250 }, // Principal
      { min: 230, max: 320 }  // Director
    ]
  },

  marketing: {
    titles: [
      "Marketing Manager", "Digital Marketing Manager", "Content Marketing Manager", "Growth Marketing Manager",
      "Social Media Manager", "Email Marketing Specialist", "SEO Specialist", "PPC Specialist",
      "Brand Manager", "Product Marketing Manager", "Marketing Director", "CMO",
      "Marketing Analyst", "Marketing Coordinator", "Demand Generation Manager", "Field Marketing Manager",
      "Senior Marketing Manager", "VP of Marketing", "Head of Growth", "Content Creator",
      "Influencer Marketing Manager", "Community Manager", "Marketing Operations Manager"
    ],
    techStacks: [
      ["Google Analytics", "HubSpot", "Salesforce", "Marketo", "Hootsuite"],
      ["Facebook Ads", "Google Ads", "LinkedIn Ads", "Mailchimp", "Klaviyo"],
      ["SEMrush", "Ahrefs", "Moz", "WordPress", "Unbounce"],
      ["Adobe Creative Suite", "Canva", "Buffer", "Sprout Social"],
      ["Pardot", "Eloqua", "Segment", "Mixpanel", "Amplitude"],
      ["Content Management", "CRM", "Marketing Automation", "Social Media"]
    ],
    experienceLevels: ["Entry Level (0-2 years)", "Associate (1-3 years)", "Senior (3-6 years)", "Manager (5-8 years)", "Director (8+ years)"],
    salaryRanges: [
      { min: 45, max: 70 },   // Entry
      { min: 65, max: 90 },   // Associate
      { min: 85, max: 120 },  // Senior
      { min: 110, max: 160 }, // Manager
      { min: 150, max: 220 }  // Director
    ]
  },

  sales: {
    titles: [
      "Sales Representative", "Account Executive", "Senior Account Executive", "Sales Manager",
      "Business Development Representative", "Sales Development Representative", "Inside Sales Rep",
      "Outside Sales Rep", "Key Account Manager", "Regional Sales Manager", "VP of Sales",
      "Sales Director", "Customer Success Manager", "Account Manager", "Enterprise Sales",
      "Senior Sales Manager", "Principal Account Executive", "Head of Sales", "Chief Revenue Officer",
      "Sales Operations Manager", "Channel Partner Manager", "Strategic Account Manager"
    ],
    techStacks: [
      ["Salesforce", "HubSpot", "Outreach", "SalesLoft", "LinkedIn Sales Navigator"],
      ["Pipedrive", "Zoom", "Slack", "Microsoft Office", "CRM"],
      ["ZoomInfo", "Apollo", "Gong", "Chorus", "PandaDoc"],
      ["Sales Analytics", "Lead Generation", "Pipeline Management", "Forecasting"],
      ["Customer Success Platforms", "Renewal Management", "Upselling", "Cross-selling"]
    ],
    experienceLevels: ["Entry Level (0-2 years)", "Associate (1-3 years)", "Senior (3-6 years)", "Manager (5-8 years)", "Director (8+ years)"],
    salaryRanges: [
      { min: 45, max: 70 },   // Entry (base + commission)
      { min: 65, max: 100 },  // Associate
      { min: 90, max: 140 },  // Senior
      { min: 120, max: 180 }, // Manager
      { min: 160, max: 250 }  // Director
    ]
  },

  finance: {
    titles: [
      "Financial Analyst", "Senior Financial Analyst", "Finance Manager", "Senior Finance Manager",
      "Controller", "Senior Controller", "CFO", "VP of Finance", "Director of Finance",
      "Investment Analyst", "Portfolio Manager", "Risk Analyst", "Budget Analyst",
      "Corporate Development Analyst", "FP&A Analyst", "Treasury Analyst", "Tax Manager",
      "Internal Auditor", "Compliance Manager", "Financial Planning Manager"
    ],
    techStacks: [
      ["Excel", "SQL", "Tableau", "PowerBI", "QuickBooks"],
      ["SAP", "Oracle", "NetSuite", "Workday", "Hyperion"],
      ["Python", "R", "Financial Modeling", "Forecasting", "Budgeting"],
      ["Bloomberg Terminal", "FactSet", "Capital IQ", "PitchBook"],
      ["Risk Management", "Compliance", "Financial Analysis", "Reporting"]
    ],
    experienceLevels: ["Entry Level (0-2 years)", "Associate (1-3 years)", "Senior (3-6 years)", "Manager (5-8 years)", "Director (8+ years)"],
    salaryRanges: [
      { min: 55, max: 75 },   // Entry
      { min: 70, max: 95 },   // Associate
      { min: 90, max: 130 },  // Senior
      { min: 120, max: 170 }, // Manager
      { min: 160, max: 250 }  // Director
    ]
  },

  operations: {
    titles: [
      "Operations Manager", "Senior Operations Manager", "Director of Operations", "VP of Operations",
      "COO", "Business Operations Manager", "Process Improvement Manager", "Supply Chain Manager",
      "Logistics Manager", "Operations Analyst", "Business Analyst", "Strategy & Operations Manager",
      "Program Manager", "Project Manager", "Senior Project Manager", "Portfolio Manager",
      "Operations Coordinator", "Administrative Manager", "Facilities Manager"
    ],
    techStacks: [
      ["Excel", "SQL", "Tableau", "Process Improvement", "Lean Six Sigma"],
      ["Project Management", "Jira", "Asana", "Monday.com", "Smartsheet"],
      ["Supply Chain Management", "Inventory Management", "ERP Systems"],
      ["Business Analysis", "Data Analysis", "Process Mapping", "KPI Tracking"],
      ["Operations Research", "Optimization", "Workflow Management"]
    ],
    experienceLevels: ["Entry Level (0-2 years)", "Associate (1-3 years)", "Senior (3-6 years)", "Manager (5-8 years)", "Director (8+ years)"],
    salaryRanges: [
      { min: 50, max: 70 },   // Entry
      { min: 65, max: 90 },   // Associate
      { min: 85, max: 120 },  // Senior
      { min: 110, max: 150 }, // Manager
      { min: 140, max: 200 }  // Director
    ]
  },

  hr: {
    titles: [
      "HR Generalist", "Senior HR Generalist", "HR Manager", "Senior HR Manager",
      "HR Director", "VP of People", "Chief People Officer", "Talent Acquisition Manager",
      "Recruiter", "Senior Recruiter", "Technical Recruiter", "Executive Recruiter",
      "HR Business Partner", "Compensation Analyst", "Benefits Administrator", "Training Manager",
      "Employee Relations Manager", "Diversity & Inclusion Manager", "People Operations Manager"
    ],
    techStacks: [
      ["HRIS", "Workday", "BambooHR", "ADP", "UltiPro"],
      ["Recruiting", "LinkedIn Recruiter", "Greenhouse", "Lever", "Jobvite"],
      ["Performance Management", "Learning Management", "Employee Engagement"],
      ["Compensation Analysis", "Benefits Administration", "Payroll"],
      ["People Analytics", "HR Metrics", "Employee Surveys", "Training"]
    ],
    experienceLevels: ["Entry Level (0-2 years)", "Associate (1-3 years)", "Senior (3-6 years)", "Manager (5-8 years)", "Director (8+ years)"],
    salaryRanges: [
      { min: 45, max: 65 },   // Entry
      { min: 60, max: 85 },   // Associate
      { min: 80, max: 110 },  // Senior
      { min: 100, max: 140 }, // Manager
      { min: 130, max: 180 }  // Director
    ]
  },

  legal: {
    titles: [
      "Legal Counsel", "Senior Legal Counsel", "Associate General Counsel", "General Counsel",
      "Corporate Attorney", "Contract Manager", "Compliance Manager", "Paralegal",
      "Senior Paralegal", "Legal Operations Manager", "IP Attorney", "Employment Attorney",
      "Securities Attorney", "Privacy Counsel", "Regulatory Affairs Manager"
    ],
    techStacks: [
      ["Contract Management", "Legal Research", "Compliance", "Risk Management"],
      ["Document Review", "Legal Writing", "Litigation Support", "eDiscovery"],
      ["Intellectual Property", "Patent Law", "Trademark Law", "Copyright"],
      ["Corporate Law", "Securities Law", "Employment Law", "Privacy Law"],
      ["Legal Technology", "Case Management", "Document Management"]
    ],
    experienceLevels: ["Entry Level (0-2 years)", "Associate (1-4 years)", "Senior (4-8 years)", "Principal (8-12 years)", "Partner (12+ years)"],
    salaryRanges: [
      { min: 60, max: 90 },   // Entry
      { min: 85, max: 120 },  // Associate
      { min: 115, max: 160 }, // Senior
      { min: 150, max: 220 }, // Principal
      { min: 200, max: 350 }  // Partner
    ]
  }
};

const COMPANY_TYPES: Record<string, CompanyType> = {
  tech_startup: {
    names: [
      "InnovateTech", "DataFlow Systems", "CloudPivot", "NexGen Solutions", "TechForward",
      "ByteStream", "CodeCraft", "DevNova", "TechPulse", "DigitalEdge", "CloudScape",
      "InnovateLab", "TechSphere", "CodeWave", "DataBridge", "TechNest", "CloudForge",
      "StreamTech", "PivotLabs", "NeoSoft", "QuantumLeap", "CyberFlow", "TechVault"
    ],
    sizes: ["10-50 employees", "50-100 employees", "100-250 employees"],
    descriptions: [
      "A fast-growing startup focused on revolutionizing how businesses handle data and analytics.",
      "An innovative company building the next generation of cloud-based solutions for modern enterprises.",
      "A cutting-edge startup developing AI-powered tools that transform business operations.",
      "A technology startup creating innovative solutions for the digital transformation era."
    ]
  },
  
  enterprise: {
    names: [
      "GlobalTech Corporation", "Enterprise Solutions Inc", "MegaCorp Industries", "WorldWide Systems",
      "International Business Group", "Global Dynamics", "Corporate Solutions Ltd", "Enterprise Holdings",
      "Business Systems Corp", "Global Operations Inc", "Enterprise Technologies", "Worldwide Industries",
      "Fortune Systems", "Corporate Dynamics", "Global Business Solutions", "Enterprise Innovations"
    ],
    sizes: ["1000-5000 employees", "5000-10000 employees", "10000+ employees"],
    descriptions: [
      "A Fortune 500 company providing enterprise software solutions to organizations worldwide.",
      "A global leader in business technology with operations across 50+ countries.",
      "An established enterprise serving major corporations with mission-critical business solutions.",
      "A multinational corporation with a strong presence in multiple industry sectors."
    ]
  },
  
  midsize: {
    names: [
      "TechAdvantage", "BusinessFlow", "InnovateNow", "GrowthTech", "ScaleSolutions",
      "TechPartners", "BusinessCentric", "GrowthDynamics", "InnovateFirst", "TechGrowth",
      "BusinessTech", "ScaleForward", "GrowthSolutions", "InnovatePlus", "TechScale",
      "BusinessForward", "GrowthFirst", "ScaleNow", "TechCentric", "BusinessGrowth"
    ],
    sizes: ["250-500 employees", "500-1000 employees", "1000-2500 employees"],
    descriptions: [
      "A growing technology company serving mid-market businesses with innovative solutions.",
      "An established firm helping companies optimize their operations through technology.",
      "A successful company with a strong track record of delivering results for clients.",
      "A mid-sized organization focused on sustainable growth and customer success."
    ]
  },

  financial_services: {
    names: [
      "Capital Partners", "Investment Solutions", "Financial Dynamics", "Wealth Management Group",
      "Strategic Investments", "Financial Advisors Inc", "Capital Growth", "Investment Partners",
      "Financial Planning Solutions", "Wealth Strategies", "Capital Management", "Investment Group"
    ],
    sizes: ["100-500 employees", "500-2000 employees", "2000-10000 employees"],
    descriptions: [
      "A leading financial services firm providing investment and wealth management solutions.",
      "A comprehensive financial services company serving institutional and individual clients.",
      "A trusted financial partner helping clients achieve their investment goals.",
      "A full-service financial firm with expertise across multiple asset classes."
    ]
  }
};

const DESCRIPTION_TEMPLATES = {
  intro: [
    "We are seeking a {experience_level} {title} to join our {team_type} team.",
    "Join our dynamic team as a {title} where you'll {main_responsibility}.",
    "We're looking for an experienced {title} to help us {company_goal}.",
    "Exciting opportunity for a {title} to make a significant impact in a {company_culture} environment.",
    "Our {department} team is expanding and we need a talented {title} to {main_contribution}."
  ],
  
  responsibilities: [
    "Lead strategic initiatives and drive key business outcomes",
    "Collaborate with cross-functional teams to deliver high-quality results",
    "Analyze complex data and provide actionable insights to stakeholders",
    "Manage projects from conception to completion with attention to detail",
    "Develop and implement best practices and process improvements",
    "Mentor team members and contribute to organizational knowledge",
    "Work closely with leadership to understand and execute business strategy",
    "Build and maintain relationships with internal and external stakeholders",
    "Monitor performance metrics and drive continuous improvement",
    "Ensure compliance with industry standards and regulatory requirements"
  ],
  
  company_goals: [
    "scale our operations to serve millions of customers",
    "revolutionize the industry with innovative solutions",
    "build the next generation of business solutions",
    "transform how organizations operate through strategic initiatives",
    "create exceptional value for our clients and stakeholders",
    "expand our market presence and drive sustainable growth"
  ]
};

export class DiverseJobGenerator {
  
  /**
   * Generate realistic company distribution with dynamic startup names
   */
  private static generateRealisticCompanyDistribution(jobCount: number): { 
    companyName: string; 
    companySize: string; 
    maxJobs: number; 
    allowDuplicateRoles: boolean 
  }[] {
    console.log(`🏢 Creating realistic company ecosystem for ${jobCount} jobs...`);
    
    const distribution: { companyName: string; companySize: string; maxJobs: number; allowDuplicateRoles: boolean }[] = [];
    
    // 1. Big Tech Companies (real names, multiple jobs including duplicates)
    const bigTechCompanies = [
      "Google", "Microsoft", "Amazon", "Apple", "Meta", "Netflix", "Tesla", "Uber", "Airbnb", "Stripe",
      "Salesforce", "Oracle", "IBM", "Intel", "NVIDIA", "Adobe", "Zoom", "Slack", "Spotify", "Twitter",
      "LinkedIn", "Pinterest", "Snapchat", "TikTok", "Discord", "Shopify", "Square", "PayPal",
      "Goldman Sachs", "JPMorgan Chase", "Morgan Stanley", "BlackRock", "Citadel", "Bank of America",
      "McKinsey & Company", "Boston Consulting Group", "Deloitte", "PwC", "KPMG", "Accenture"
    ];
    
    bigTechCompanies.forEach(company => {
      distribution.push({
        companyName: company,
        companySize: "1000+ employees",
        maxJobs: faker.number.int({ min: 5, max: 12 }), // More jobs for big companies
        allowDuplicateRoles: true
      });
    });
    
    // 2. Established Tech Companies (mix of real + generated names)
    const establishedCompanyPrefixes = [
      "Cloud", "Data", "Tech", "Cyber", "Digital", "Smart", "Next", "Future", "Advanced", "Global",
      "Enterprise", "Business", "Secure", "Rapid", "Agile", "Quantum", "Neural", "AI", "Blockchain"
    ];
    
    const establishedCompanySuffixes = [
      "Systems", "Solutions", "Technologies", "Dynamics", "Innovations", "Labs", "Corp", "Inc",
      "Group", "Partners", "Ventures", "Works", "Hub", "Studio", "Platform", "Network"
    ];
    
    // Generate ~100 medium-sized companies
    for (let i = 0; i < 100; i++) {
      const prefix = faker.helpers.arrayElement(establishedCompanyPrefixes);
      const suffix = faker.helpers.arrayElement(establishedCompanySuffixes);
      
      distribution.push({
        companyName: `${prefix} ${suffix}`,
        companySize: "100-999 employees",
        maxJobs: faker.number.int({ min: 2, max: 5 }),
        allowDuplicateRoles: false
      });
    }
    
    // 3. Generate tons of unique startups (realistic startup names)
    const startupPatterns = [
      // Pattern 1: [Adjective][Noun] (modern tech style)
      () => {
        const adjectives = ["Swift", "Bright", "Smart", "Quick", "Fresh", "Bold", "Clear", "Deep", "Fast", "Pure", "Sharp", "Live", "True", "Open", "Core"];
        const nouns = ["Flow", "Sync", "Link", "Path", "Wave", "Grid", "Edge", "Node", "Code", "Base", "Loop", "Shift", "Spark", "Flux", "Beam"];
        return faker.helpers.arrayElement(adjectives) + faker.helpers.arrayElement(nouns);
      },
      
      // Pattern 2: [Tech term] + [Action/Object]
      () => {
        const techTerms = ["Data", "Cloud", "AI", "Crypto", "Quantum", "Neural", "Cyber", "Digital", "Smart", "Auto"];
        const actions = ["Flow", "Forge", "Build", "Cast", "Craft", "Drive", "Sync", "Scale", "Boost", "Launch"];
        return faker.helpers.arrayElement(techTerms) + faker.helpers.arrayElement(actions);
      },
      
      // Pattern 3: [Color/Nature] + [Tech suffix]
      () => {
        const nature = ["Ocean", "River", "Mountain", "Forest", "Storm", "Lightning", "Solar", "Lunar", "Arctic", "Desert"];
        const techSuffixes = ["Labs", "Tech", "AI", "Systems", "Works", "Hub", "Studio", "Platform"];
        return faker.helpers.arrayElement(nature) + " " + faker.helpers.arrayElement(techSuffixes);
      },
      
      // Pattern 4: Made-up modern names (like Spotify, Shopify style)
      () => {
        const prefixes = ["Zap", "Flux", "Apex", "Vibe", "Maze", "Zen", "Arc", "Echo", "Orb", "Pulse", "Hex", "Nova"];
        const suffixes = ["ify", "ly", "io", "ai", "co", "lab", "app", "hub", "box", "kit", "pro", "dev"];
        return faker.helpers.arrayElement(prefixes) + faker.helpers.arrayElement(suffixes);
      },
      
      // Pattern 5: [Person name] + [Tech term] (founder-named startups)
      () => {
        const founder = faker.person.lastName();
        const terms = ["Labs", "Tech", "Systems", "Solutions", "Innovations", "Ventures", "Works", "Studio"];
        return `${founder} ${faker.helpers.arrayElement(terms)}`;
      }
    ];
    
    // Calculate how many startups we need
    const currentJobCapacity = distribution.reduce((sum, comp) => sum + comp.maxJobs, 0);
    const remainingJobs = Math.max(0, jobCount - currentJobCapacity);
    const startupsNeeded = Math.ceil(remainingJobs * 1.5); // Generate extra to ensure variety
    
    console.log(`📊 Generating ${startupsNeeded} unique startups for remaining ${remainingJobs} jobs...`);
    
    const generatedNames = new Set<string>();
    
    for (let i = 0; i < startupsNeeded; i++) {
      let companyName: string;
      let attempts = 0;
      
      // Try to generate a unique name
      do {
        const pattern = faker.helpers.arrayElement(startupPatterns);
        companyName = pattern();
        attempts++;
      } while (generatedNames.has(companyName) && attempts < 10);
      
      // If we couldn't generate unique name, add a number
      if (generatedNames.has(companyName)) {
        companyName = `${companyName} ${faker.number.int({ min: 1, max: 99 })}`;
      }
      
      generatedNames.add(companyName);
      
      distribution.push({
        companyName,
        companySize: "10-99 employees",
        maxJobs: faker.number.int({ min: 1, max: 2 }), // Small companies, 1-2 jobs max
        allowDuplicateRoles: false
      });
    }
    
    console.log(`✅ Created ecosystem with:`);
    console.log(`   • ${bigTechCompanies.length} big tech companies (5-12 jobs each)`);
    console.log(`   • 100 established companies (2-5 jobs each)`);
    console.log(`   • ${generatedNames.size} unique startups (1-2 jobs each)`);
    
    return faker.helpers.shuffle(distribution); // Randomize order
  }

  /**
   * Generate jobs with realistic company distribution
   */
  static async generateJobBatchWithCompanyDistribution(count: number): Promise<any[]> {
    const jobs = [];
    const companyDistribution = this.generateRealisticCompanyDistribution(count);
    const usedCombinations = new Set<string>();
    
    console.log(`🚀 Starting generation of ${count} jobs with realistic company ecosystem...`);
    
    // Shuffle companies for random selection
    const shuffledCompanies = faker.helpers.shuffle(companyDistribution);
    
    let jobsGenerated = 0;
    let companyIndex = 0;
    
    while (jobsGenerated < count && companyIndex < shuffledCompanies.length) {
      const companyInfo = shuffledCompanies[companyIndex];
      const jobsForThisCompany = Math.min(companyInfo.maxJobs, count - jobsGenerated);
      
      console.log(`🏢 Generating ${jobsForThisCompany} jobs for ${companyInfo.companyName} (${companyInfo.companySize})`);
      
      const companyJobs = [];
      const usedRolesForCompany = new Set<string>();
      
      for (let i = 0; i < jobsForThisCompany; i++) {
        let job;
        let attempts = 0;
        
        do {
          job = this.generateUniqueJob();
          job.company = companyInfo.companyName;
          job.companySize = companyInfo.companySize;
          
          const roleKey = `${job.title}`;
          const jobKey = `${job.title}-${job.company}-${job.location}`;
          
          // For large companies, allow duplicate roles with different locations/requirements
          if (companyInfo.allowDuplicateRoles) {
            // Allow same role if it's in a different location or has different experience level
            if (!usedCombinations.has(jobKey)) {
              usedCombinations.add(jobKey);
              break;
            }
          } else {
            // For smaller companies, ensure unique roles
            if (!usedRolesForCompany.has(roleKey)) {
              usedRolesForCompany.add(roleKey);
              usedCombinations.add(jobKey);
              break;
            }
          }
          
          attempts++;
        } while (attempts < 20);
        
        if (attempts < 20) {
          companyJobs.push(job);
        }
      }
      
      jobs.push(...companyJobs);
      jobsGenerated += companyJobs.length;
      companyIndex++;
      
      if (jobsGenerated % 500 === 0) {
        console.log(`✅ Generated ${jobsGenerated} jobs so far...`);
      }
    }
    
    // Fill remaining jobs with random single-job companies if needed
    while (jobsGenerated < count) {
      const job = this.generateUniqueJob();
      
      // Generate a quick startup name for remaining jobs
      const quickStartups = ["Zap", "Flow", "Sync", "Edge", "Nova", "Flux"];
      const quickSuffixes = ["ly", "io", "co", "lab", "dev", "pro"];
      job.company = faker.helpers.arrayElement(quickStartups) + faker.helpers.arrayElement(quickSuffixes);
      job.companySize = "10-99 employees";
      
      jobs.push(job);
      jobsGenerated++;
    }
    
    console.log(`🎉 Generated ${jobs.length} jobs with realistic company distribution!`);
    
    // Log company distribution summary
    const companyJobCounts = jobs.reduce((acc, job) => {
      acc[job.company] = (acc[job.company] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const companiesWithMultipleJobs = Object.entries(companyJobCounts)
      .filter(([, count]) => (count as number) > 1)
      .sort(([,a], [,b]) => (b as number) - (a as number));
    
    console.log(`\n📊 Companies with multiple job openings:`);
    companiesWithMultipleJobs.slice(0, 15).forEach(([company, count]) => {
      console.log(`   ${company}: ${count} jobs`);
    });
    
    // Show distribution by company size
    const sizeDistribution = jobs.reduce((acc, job) => {
      const size = job.companySize || 'Unknown';
      acc[size] = (acc[size] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`\n📈 Distribution by company size:`);
    Object.entries(sizeDistribution).forEach(([size, count]) => {
      const percentage = (((count as number) / jobs.length) * 100).toFixed(1);
      console.log(`   ${size}: ${count} jobs (${percentage}%)`);
    });
    
    return jobs;
  }

  /**
   * Match job title seniority level with appropriate experience level and salary range
   */
  private static getMatchingExperienceAndSalary(title: string, categoryData: JobCategory): { experienceLevel: string; salaryRange: { min: number; max: number } } {
    const titleLower = title.toLowerCase();
    
    // Define seniority levels based on title keywords (order matters - most specific first)
    const seniorityKeywords = [
      // Leadership level (highest)
      { level: 'leadership', keywords: ['director', 'vp', 'vice president', 'head of', 'chief', 'ceo', 'cto', 'cfo', 'cmo', 'coo', 'partner'] },
      // Principal/Staff level
      { level: 'principal', keywords: ['principal', 'staff', 'distinguished'] },
      // Senior level
      { level: 'senior', keywords: ['senior', 'lead', 'sr.', 'sr '] },
      // Manager level
      { level: 'manager', keywords: ['manager', 'mgr'] },
      // Entry level
      { level: 'entry', keywords: ['entry', 'junior', 'jr.', 'jr ', 'associate', 'coordinator', 'assistant', 'trainee', 'intern', 'analyst'] }
    ];
    
    // Determine seniority level (first match wins)
    let seniorityLevel = 'mid'; // default for roles like "Engineer", "Developer", etc.
    
    for (const { level, keywords } of seniorityKeywords) {
      if (keywords.some(keyword => titleLower.includes(keyword))) {
        seniorityLevel = level;
        break;
      }
    }
    
    // Map seniority level to experience level index
    let experienceIndex = 1; // default to mid-level
    
    switch (seniorityLevel) {
      case 'entry':
        experienceIndex = 0;
        break;
      case 'mid':
        experienceIndex = Math.min(1, categoryData.experienceLevels.length - 1);
        break;
      case 'manager':
        experienceIndex = Math.min(2, categoryData.experienceLevels.length - 1);
        break;
      case 'senior':
        experienceIndex = Math.min(2, categoryData.experienceLevels.length - 1);
        break;
      case 'principal':
        experienceIndex = Math.min(3, categoryData.experienceLevels.length - 1);
        break;
      case 'leadership':
        experienceIndex = categoryData.experienceLevels.length - 1; // Highest level
        break;
    }
    
    // Ensure we don't go out of bounds
    experienceIndex = Math.max(0, Math.min(experienceIndex, categoryData.experienceLevels.length - 1));
    
    return {
      experienceLevel: categoryData.experienceLevels[experienceIndex],
      salaryRange: categoryData.salaryRanges[experienceIndex]
    };
  }

  static generateUniqueJob(): any {
    // 1. Randomly select category
    const categories = Object.keys(JOB_CATEGORIES);
    const selectedCategory = faker.helpers.arrayElement(categories);
    const categoryData = JOB_CATEGORIES[selectedCategory];
    
    // 2. Randomly select company type and specific company
    const companyTypes = Object.keys(COMPANY_TYPES);
    const selectedCompanyType = faker.helpers.arrayElement(companyTypes);
    const companyTypeData: CompanyType = COMPANY_TYPES[selectedCompanyType];
    
    // 3. Generate unique combinations with proper title-experience matching
    const title = faker.helpers.arrayElement(categoryData.titles);
    const { experienceLevel, salaryRange } = this.getMatchingExperienceAndSalary(title, categoryData);
    const techStack = faker.helpers.arrayElement(categoryData.techStacks);
    
    const companyName = faker.helpers.arrayElement(companyTypeData.names);
    const companySize = faker.helpers.arrayElement(companyTypeData.sizes);
    const companyDescription = faker.helpers.arrayElement(companyTypeData.descriptions);
    
    // 4. Generate dynamic content
    const salary = faker.number.int({ min: salaryRange.min, max: salaryRange.max });
    const location = `${faker.location.city()}, ${faker.location.state()}`;
    const remote = faker.datatype.boolean({ probability: 0.6 });
    
    // 5. Create unique description by combining templates
    const introTemplate = faker.helpers.arrayElement(DESCRIPTION_TEMPLATES.intro);
    const responsibilities = faker.helpers.arrayElements(
      DESCRIPTION_TEMPLATES.responsibilities, 
      faker.number.int({ min: 5, max: 8 })
    );
    const companyGoal = faker.helpers.arrayElement(DESCRIPTION_TEMPLATES.company_goals);
    
    const description = this.buildDescription({
      intro: introTemplate,
      title,
      experienceLevel,
      responsibilities,
      companyName,
      companyDescription,
      companySize,
      companyGoal,
      techStack
    });
    
    const requirements = this.buildRequirements({
      experienceLevel,
      techStack,
      category: selectedCategory
    });
    
    return {
      title,
      company: companyName,
      companySize: companySize, // Now included in schema
      location,
      workType: faker.helpers.arrayElement(['Full-time', 'Contract', 'Part-time', 'Contract-to-hire']),
      experienceLevel: this.formatExperienceLevel(experienceLevel),
      salaryMin: salary * 1000,
      salaryMax: (salary + faker.number.int({ min: 15, max: 30 })) * 1000,
      description,
      requirements,
      skills: techStack,
      postedDate: faker.date.recent({ days: 30 }).toISOString(),
      industry: this.getIndustryForCategory(selectedCategory),
      companyLogo: null // Set to null as per schema
    };
  }

  /**
   * Format experience level to match database schema expectations
   */
  private static formatExperienceLevel(experienceLevel: string): string {
    // Convert "Senior (5-8 years)" to "Senior Level" etc.
    if (experienceLevel.includes('Entry')) return 'Entry Level';
    if (experienceLevel.includes('Associate') || experienceLevel.includes('Mid')) return 'Mid Level';
    if (experienceLevel.includes('Senior')) return 'Senior Level';
    if (experienceLevel.includes('Principal') || experienceLevel.includes('Director') || experienceLevel.includes('VP')) return 'Leadership';
    return 'Mid Level'; // fallback
  }

  private static buildDescription(params: any): string {
    const { intro, title, responsibilities, companyName, companyDescription, companySize, companyGoal, techStack } = params;
    
    return `${intro.replace('{title}', title).replace('{company_goal}', companyGoal).replace('{experience_level}', 'talented').replace('{team_type}', 'growing').replace('{main_responsibility}', 'drive key initiatives').replace('{company_culture}', 'collaborative').replace('{department}', 'dynamic').replace('{main_contribution}', 'contribute to our success')}

Key Responsibilities:
${responsibilities.map((r: string) => `• ${r}`).join('\n')}

About ${companyName}:
${companyDescription}

Company Size: ${companySize}

What We Offer:
${this.generateBenefits()}

Required Skills & Technologies:
${techStack.join(', ')}`;
  }
  
  private static buildRequirements(params: any): string {
    const { experienceLevel, techStack, category } = params;
    
    const baseRequirements = [
      `${experienceLevel} of relevant professional experience`,
      `Strong proficiency in ${techStack.slice(0, 3).join(', ')}`,
      `Experience with ${techStack.slice(3).join(', ')}`,
      "Excellent problem-solving and analytical skills",
      "Strong communication and interpersonal skills",
      "Ability to work effectively in a fast-paced, collaborative environment",
      "Bachelor's degree in relevant field or equivalent practical experience"
    ];
    
    // Add category-specific requirements
    const categoryRequirements = this.getCategoryRequirements(category);
    
    return [...baseRequirements, ...categoryRequirements]
      .map(req => `• ${req}`)
      .join('\n');
  }
  
  private static generateBenefits(): string {
    const allBenefits = [
      "Competitive salary and performance-based bonuses",
      "Comprehensive health, dental, and vision insurance",
      "Flexible work arrangements and remote work options",
      "Professional development budget and learning opportunities",
      "Generous PTO and flexible time off policy",
      "401(k) retirement plan with company matching",
      "Stock options or equity participation program",
      "Wellness programs and fitness benefits",
      "Team building events and company social activities",
      "State-of-the-art technology and equipment",
      "Tuition reimbursement and continuing education support",
      "Employee assistance program and mental health resources"
    ];
    
    return faker.helpers.arrayElements(allBenefits, faker.number.int({ min: 5, max: 8 }))
      .map(benefit => `• ${benefit}`)
      .join('\n');
  }
  
  private static getCategoryRequirements(category: string): string[] {
    const requirements: Record<string, string[]> = {
      engineering: [
        "Experience with version control systems and collaborative development workflows",
        "Knowledge of software development best practices and design patterns",
        "Familiarity with agile development methodologies and CI/CD practices",
        "Understanding of system architecture and scalability considerations"
      ],
      data: [
        "Strong statistical analysis and quantitative modeling skills",
        "Experience with data visualization tools and dashboard creation",
        "Knowledge of machine learning algorithms and statistical methods",
        "Ability to translate business requirements into analytical solutions"
      ],
      product: [
        "Experience with product management frameworks and methodologies",
        "Strong analytical and data-driven decision making capabilities",
        "Understanding of user experience principles and design thinking",
        "Ability to work with technical teams and translate requirements"
      ],
      marketing: [
        "Experience with digital marketing platforms and campaign management",
        "Strong content creation and brand communication skills",
        "Knowledge of marketing analytics and performance measurement",
        "Understanding of customer acquisition and retention strategies"
      ],
      sales: [
        "Proven track record of meeting or exceeding sales targets and quotas",
        "Strong negotiation and relationship building capabilities",
        "Experience with CRM systems and sales process optimization",
        "Ability to understand customer needs and present value propositions"
      ],
      finance: [
        "Strong financial modeling and analysis capabilities",
        "Experience with financial planning and budgeting processes",
        "Knowledge of accounting principles and financial regulations",
        "Proficiency in financial reporting and variance analysis"
      ],
      operations: [
        "Experience with process improvement and operational efficiency initiatives",
        "Strong project management and cross-functional collaboration skills",
        "Knowledge of business operations and supply chain management",
        "Ability to analyze workflows and implement scalable solutions"
      ],
      hr: [
        "Experience with talent acquisition and employee lifecycle management",
        "Knowledge of employment law and HR compliance requirements",
        "Strong interpersonal skills and conflict resolution abilities",
        "Understanding of compensation and benefits administration"
      ],
      legal: [
        "Strong legal research and writing capabilities",
        "Experience with contract negotiation and risk assessment",
        "Knowledge of relevant laws and regulatory compliance",
        "Ability to provide practical legal advice to business stakeholders"
      ]
    };
    
    return requirements[category] || [];
  }
  
  private static getIndustryForCategory(category: string): string {
    const industries: Record<string, string> = {
      engineering: faker.helpers.arrayElement(["Technology", "Software", "FinTech", "HealthTech", "EdTech", "E-commerce"]),
      data: faker.helpers.arrayElement(["Analytics", "AI/ML", "Data Science", "Business Intelligence", "Research"]),
      product: faker.helpers.arrayElement(["Product Management", "SaaS", "Consumer Tech", "Enterprise Software", "Mobile"]),
      marketing: faker.helpers.arrayElement(["Digital Marketing", "AdTech", "MarTech", "E-commerce", "Media"]),
      sales: faker.helpers.arrayElement(["Sales", "Business Development", "Enterprise Sales", "SaaS Sales", "Consulting"]),
      finance: faker.helpers.arrayElement(["Financial Services", "Investment Banking", "Corporate Finance", "FinTech", "Insurance"]),
      operations: faker.helpers.arrayElement(["Operations", "Supply Chain", "Logistics", "Consulting", "Manufacturing"]),
      hr: faker.helpers.arrayElement(["Human Resources", "Talent Management", "Recruiting", "People Operations", "Consulting"]),
      legal: faker.helpers.arrayElement(["Legal Services", "Corporate Law", "Compliance", "Intellectual Property", "Consulting"])
    };
    
    return industries[category] || "Technology";
  }

  static async generateJobBatch(count: number): Promise<any[]> {
    // Use the new company distribution method by default
    return this.generateJobBatchWithCompanyDistribution(count);
  }
}
