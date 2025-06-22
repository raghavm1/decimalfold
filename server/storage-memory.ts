import { type Job, type Resume, type JobMatch, type InsertJob, type InsertResume, type InsertJobMatch } from "@shared/schema";
import { IStorage } from "./storage.js";

/**
 * In-memory storage implementation for testing and development
 * This allows testing the job generation scripts without requiring a database setup
 */
export class InMemoryStorage implements IStorage {
  private jobs: Job[] = [];
  private resumes: Resume[] = [];
  private jobMatches: JobMatch[] = [];
  private nextJobId = 1;
  private nextResumeId = 1;
  private nextMatchId = 1;

  async getAllJobs(): Promise<Job[]> {
    return [...this.jobs];
  }

  async getJobById(id: number): Promise<Job | undefined> {
    return this.jobs.find(job => job.id === id);
  }

  async createJob(job: InsertJob): Promise<Job> {
    const newJob: Job = {
      ...job,
      id: this.nextJobId++,
      vector: null,
      salaryMin: job.salaryMin ?? null,
      salaryMax: job.salaryMax ?? null,
      companyLogo: job.companyLogo ?? null,
      industry: job.industry ?? "Technology"
    };
    this.jobs.push(newJob);
    return newJob;
  }

  async createResume(resume: InsertResume): Promise<Resume> {
    const newResume: Resume = {
      ...resume,
      id: this.nextResumeId++,
      vector: null,
      parsedData: resume.parsedData ?? null,
      uploadedAt: new Date().toISOString()
    };
    this.resumes.push(newResume);
    return newResume;
  }

  async getResumeById(id: number): Promise<Resume | undefined> {
    return this.resumes.find(resume => resume.id === id);
  }

  async createJobMatch(match: InsertJobMatch): Promise<JobMatch> {
    const newMatch: JobMatch = {
      ...match,
      id: this.nextMatchId++
    };
    this.jobMatches.push(newMatch);
    return newMatch;
  }

  async getJobMatchesByResumeId(resumeId: number): Promise<JobMatch[]> {
    return this.jobMatches.filter(match => match.resumeId === resumeId);
  }

  async searchJobs(query: string, experienceLevel?: string, workType?: string): Promise<Job[]> {
    let filtered = this.jobs;

    // Simple text search
    if (query) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchTerm) ||
        job.company.toLowerCase().includes(searchTerm) ||
        job.description.toLowerCase().includes(searchTerm) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by experience level
    if (experienceLevel) {
      filtered = filtered.filter(job => job.experienceLevel === experienceLevel);
    }

    // Filter by work type
    if (workType) {
      filtered = filtered.filter(job => job.workType === workType);
    }

    return filtered;
  }

  // Utility methods for testing
  getJobCount(): number {
    return this.jobs.length;
  }

  getResumeCount(): number {
    return this.resumes.length;
  }

  getMatchCount(): number {
    return this.jobMatches.length;
  }

  clear(): void {
    this.jobs = [];
    this.resumes = [];
    this.jobMatches = [];
    this.nextJobId = 1;
    this.nextResumeId = 1;
    this.nextMatchId = 1;
  }
}

export const inMemoryStorage = new InMemoryStorage();
