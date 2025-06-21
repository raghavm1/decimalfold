import { Job, Resume, ParsedResumeData, JobWithMatch } from "@shared/schema";

// Interface for different vectorizing strategies
export interface VectorStrategy {
  name: string;
  description: string;
  generateJobVector(job: Job): Promise<number[]>;
  generateResumeVector(resume: Resume, parsedData: ParsedResumeData): Promise<number[]>;
  calculateSimilarity(jobVector: number[], resumeVector: number[]): number;
}

// Simple TF-IDF like approach for testing without OpenAI
export class TFIDFStrategy implements VectorStrategy {
  name = "TF-IDF";
  description = "Term Frequency-Inverse Document Frequency based vectorization";
  
  private vocabulary: string[] = [];
  private documentFrequency: Map<string, number> = new Map();
  private totalDocuments = 0;
  
  constructor() {
    this.buildVocabulary();
  }
  
  private buildVocabulary() {
    // Common tech skills and terms
    this.vocabulary = [
      // Programming Languages
      "javascript", "python", "java", "typescript", "go", "rust", "php", "ruby", "swift", "kotlin",
      "c++", "c#", "scala", "r", "matlab", "perl", "bash", "sql", "html", "css",
      
      // Frameworks & Libraries
      "react", "vue", "angular", "node", "express", "django", "flask", "spring", "laravel", "rails",
      "tensorflow", "pytorch", "pandas", "numpy", "jquery", "bootstrap", "tailwind", "sass",
      
      // Databases
      "postgresql", "mysql", "mongodb", "redis", "cassandra", "elasticsearch", "oracle", "sqlite",
      "dynamodb", "neo4j", "couchdb", "influxdb",
      
      // Cloud & DevOps
      "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "gitlab", "github", "terraform",
      "ansible", "chef", "puppet", "prometheus", "grafana", "elk", "nginx", "apache",
      
      // Tools & Technologies
      "git", "jira", "confluence", "slack", "figma", "photoshop", "postman", "swagger",
      "webpack", "vite", "babel", "eslint", "prettier", "jest", "cypress", "selenium",
      
      // Concepts
      "microservices", "api", "rest", "graphql", "websocket", "oauth", "jwt", "encryption",
      "machine learning", "ai", "deep learning", "nlp", "computer vision", "blockchain",
      "agile", "scrum", "kanban", "devops", "cicd", "testing", "debugging", "optimization"
    ];
    
    this.totalDocuments = 1000; // Estimated corpus size
    // Initialize document frequencies
    this.vocabulary.forEach(term => {
      this.documentFrequency.set(term, Math.floor(Math.random() * 500) + 10);
    });
  }
  
  private extractTerms(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2)
      .filter(term => this.vocabulary.includes(term));
  }
  
  private calculateTFIDF(terms: string[]): number[] {
    const vector = new Array(this.vocabulary.length).fill(0);
    const termCounts = new Map<string, number>();
    
    // Calculate term frequency
    terms.forEach(term => {
      termCounts.set(term, (termCounts.get(term) || 0) + 1);
    });
    
    // Calculate TF-IDF for each vocabulary term
    this.vocabulary.forEach((term, index) => {
      const tf = (termCounts.get(term) || 0) / terms.length;
      const df = this.documentFrequency.get(term) || 1;
      const idf = Math.log(this.totalDocuments / df);
      vector[index] = tf * idf;
    });
    
    return vector;
  }
  
  async generateJobVector(job: Job): Promise<number[]> {
    const jobText = `${job.title} ${job.description} ${job.requirements} ${job.skills.join(' ')}`;
    const terms = this.extractTerms(jobText);
    return this.calculateTFIDF(terms);
  }
  
  async generateResumeVector(resume: Resume, parsedData: ParsedResumeData): Promise<number[]> {
    const resumeText = `${resume.content} ${parsedData.skills.join(' ')} ${parsedData.primaryRole}`;
    const terms = this.extractTerms(resumeText);
    return this.calculateTFIDF(terms);
  }
  
  calculateSimilarity(jobVector: number[], resumeVector: number[]): number {
    return this.cosineSimilarity(jobVector, resumeVector);
  }
  
  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

// Skill-based matching strategy
export class SkillMatchStrategy implements VectorStrategy {
  name = "Skill Match";
  description = "Direct skill overlap and experience level matching";
  
  async generateJobVector(job: Job): Promise<number[]> {
    // Create a binary vector for each skill
    const skillVector = this.createSkillVector(job.skills);
    const experienceWeight = this.getExperienceWeight(job.experienceLevel);
    return [...skillVector, experienceWeight];
  }
  
  async generateResumeVector(resume: Resume, parsedData: ParsedResumeData): Promise<number[]> {
    const skillVector = this.createSkillVector(parsedData.skills);
    const experienceWeight = Math.min(parsedData.yearsOfExperience / 10, 1.0);
    return [...skillVector, experienceWeight];
  }
  
  private createSkillVector(skills: string[]): number[] {
    const commonSkills = [
      "javascript", "python", "java", "react", "node", "aws", "docker", "kubernetes",
      "typescript", "sql", "mongodb", "postgresql", "git", "agile", "rest", "api"
    ];
    
    return commonSkills.map(skill => 
      skills.some(userSkill => 
        userSkill.toLowerCase().includes(skill) || 
        skill.includes(userSkill.toLowerCase())
      ) ? 1 : 0
    );
  }
  
  private getExperienceWeight(level: string): number {
    switch (level) {
      case "Entry Level": return 0.25;
      case "Mid-Level": return 0.5;
      case "Senior Level": return 0.75;
      case "Leadership": return 1.0;
      default: return 0.5;
    }
  }
  
  calculateSimilarity(jobVector: number[], resumeVector: number[]): number {
    // Weighted similarity: 80% skills, 20% experience
    const skillSimilarity = this.jaccard(jobVector.slice(0, -1), resumeVector.slice(0, -1));
    const experienceMatch = 1 - Math.abs(jobVector[jobVector.length - 1] - resumeVector[resumeVector.length - 1]);
    return 0.8 * skillSimilarity + 0.2 * experienceMatch;
  }
  
  private jaccard(setA: number[], setB: number[]): number {
    let intersection = 0;
    let union = 0;
    
    for (let i = 0; i < Math.max(setA.length, setB.length); i++) {
      const a = setA[i] || 0;
      const b = setB[i] || 0;
      
      if (a === 1 && b === 1) intersection++;
      if (a === 1 || b === 1) union++;
    }
    
    return union === 0 ? 0 : intersection / union;
  }
}

// Hybrid strategy combining multiple approaches
export class HybridStrategy implements VectorStrategy {
  name = "Hybrid";
  description = "Combines TF-IDF and skill matching with weights";
  
  private tfidfStrategy = new TFIDFStrategy();
  private skillStrategy = new SkillMatchStrategy();
  
  async generateJobVector(job: Job): Promise<number[]> {
    const tfidfVector = await this.tfidfStrategy.generateJobVector(job);
    const skillVector = await this.skillStrategy.generateJobVector(job);
    return [...tfidfVector, ...skillVector];
  }
  
  async generateResumeVector(resume: Resume, parsedData: ParsedResumeData): Promise<number[]> {
    const tfidfVector = await this.tfidfStrategy.generateResumeVector(resume, parsedData);
    const skillVector = await this.skillStrategy.generateResumeVector(resume, parsedData);
    return [...tfidfVector, ...skillVector];
  }
  
  calculateSimilarity(jobVector: number[], resumeVector: number[]): number {
    const midpoint = Math.floor(jobVector.length / 2);
    
    const tfidfJobVector = jobVector.slice(0, midpoint);
    const tfidfResumeVector = resumeVector.slice(0, midpoint);
    const tfidfSimilarity = this.tfidfStrategy.calculateSimilarity(tfidfJobVector, tfidfResumeVector);
    
    const skillJobVector = jobVector.slice(midpoint);
    const skillResumeVector = resumeVector.slice(midpoint);
    const skillSimilarity = this.skillStrategy.calculateSimilarity(skillJobVector, skillResumeVector);
    
    // Weight: 60% TF-IDF, 40% skill matching
    return 0.6 * tfidfSimilarity + 0.4 * skillSimilarity;
  }
}

// Factory for creating vector strategies
export class VectorStrategyFactory {
  private static strategies: Map<string, () => VectorStrategy> = new Map([
    ["tfidf", () => new TFIDFStrategy()],
    ["skill", () => new SkillMatchStrategy()],
    ["hybrid", () => new HybridStrategy()]
  ]);
  
  static create(strategyName: string): VectorStrategy {
    const strategyFactory = this.strategies.get(strategyName.toLowerCase());
    if (!strategyFactory) {
      throw new Error(`Unknown vector strategy: ${strategyName}`);
    }
    return strategyFactory();
  }
  
  static getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }
}