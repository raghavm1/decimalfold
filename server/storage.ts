import { jobs, resumes, jobMatches, type Job, type Resume, type JobMatch, type InsertJob, type InsertResume, type InsertJobMatch, type PaginatedResult } from "@shared/schema";
import { databaseStorage } from "./storage-database.js";
export interface IStorage {
  // Job operations
  getAllJobs(): Promise<Job[]>;
  getJobById(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  
  // Resume operations
  createResume(resume: InsertResume): Promise<Resume>;
  getResumeById(id: number): Promise<Resume | undefined>;
  
  // Job match operations
  createJobMatch(match: InsertJobMatch): Promise<JobMatch>;
  getJobMatchesByResumeId(resumeId: number): Promise<JobMatch[]>;
  
  // Search and filter operations
  searchJobs(query: string, experienceLevel?: string, workType?: string): Promise<Job[]>;
  searchJobsPaginated(
    query: string, 
    experienceLevel?: string, 
    workType?: string, 
    page?: number, 
    limit?: number
  ): Promise<PaginatedResult<Job>>;
}

export class MemStorage implements IStorage {
  private jobs: Map<number, Job>;
  private resumes: Map<number, Resume>;
  private jobMatches: Map<number, JobMatch>;
  private currentJobId: number;
  private currentResumeId: number;
  private currentMatchId: number;

  constructor() {
    this.jobs = new Map();
    this.resumes = new Map();
    this.jobMatches = new Map();
    this.currentJobId = 1;
    this.currentResumeId = 1;
    this.currentMatchId = 1;
  }

  async getAllJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getJobById(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = this.currentJobId++;
    const job: Job = { 
      ...insertJob, 
      id, 
      industry: insertJob.industry || "Technology",
      vector: null,
      salaryMin: insertJob.salaryMin ?? null,
      salaryMax: insertJob.salaryMax ?? null,
      companyLogo: insertJob.companyLogo ?? null,
      companySize: insertJob.companySize ?? null
    };
    this.jobs.set(id, job);
    return job;
  }

  async createResume(insertResume: InsertResume): Promise<Resume> {
    const id = this.currentResumeId++;
    const resume: Resume = { 
      ...insertResume, 
      id, 
      vector: null,
      uploadedAt: new Date().toISOString(),
      parsedData: insertResume.parsedData || null
    };
    this.resumes.set(id, resume);
    return resume;
  }

  async getResumeById(id: number): Promise<Resume | undefined> {
    return this.resumes.get(id);
  }

  async createJobMatch(insertMatch: InsertJobMatch): Promise<JobMatch> {
    const id = this.currentMatchId++;
    const match: JobMatch = { ...insertMatch, id };
    this.jobMatches.set(id, match);
    return match;
  }

  async getJobMatchesByResumeId(resumeId: number): Promise<JobMatch[]> {
    return Array.from(this.jobMatches.values()).filter(match => match.resumeId === resumeId);
  }

  async searchJobs(query: string, experienceLevel?: string, workType?: string): Promise<Job[]> {
    const allJobs = Array.from(this.jobs.values());
    
    return allJobs.filter(job => {
      const matchesQuery = !query || 
        job.title.toLowerCase().includes(query.toLowerCase()) ||
        job.company.toLowerCase().includes(query.toLowerCase()) ||
        job.skills.some(skill => skill.toLowerCase().includes(query.toLowerCase()));
      
      const matchesExperience = !experienceLevel || experienceLevel === 'All Levels' || 
        job.experienceLevel === experienceLevel;
      
      const matchesWorkType = !workType || workType === 'All Types' || 
        job.workType === workType;
      
      return matchesQuery && matchesExperience && matchesWorkType;
    });
  }

  async searchJobsPaginated(
    query: string,
    experienceLevel?: string,
    workType?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<Job>> {
    // Get filtered jobs
    const filteredJobs = await this.searchJobs(query, experienceLevel, workType);
    
    const total = filteredJobs.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const data = filteredJobs.slice(startIndex, endIndex);

    return {
      data,
      total,
      page,
      limit,
      totalPages
    };
  }
}

// Use database storage instead of in-memory storage
export const storage = databaseStorage;
