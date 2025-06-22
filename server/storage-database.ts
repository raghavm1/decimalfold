import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { jobs, resumes, jobMatches, type Job, type Resume, type JobMatch, type InsertJob, type InsertResume, type InsertJobMatch } from '@shared/schema';
import { eq, and, or, ilike } from 'drizzle-orm';
import { IStorage } from './storage.js';

/**
 * Database storage implementation using Neon PostgreSQL
 */
export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
  }

  async getAllJobs(): Promise<Job[]> {
    return await this.db.select().from(jobs);
  }

  async getJobById(id: number): Promise<Job | undefined> {
    const result = await this.db.select().from(jobs).where(eq(jobs.id, id));
    return result[0];
  }

  async createJob(job: InsertJob): Promise<Job> {
    const result = await this.db.insert(jobs).values(job).returning();
    return result[0];
  }

  async createResume(resume: InsertResume): Promise<Resume> {
    const resumeData = {
      ...resume,
      uploadedAt: new Date().toISOString()
    };
    const result = await this.db.insert(resumes).values(resumeData).returning();
    return result[0];
  }

  async getResumeById(id: number): Promise<Resume | undefined> {
    const result = await this.db.select().from(resumes).where(eq(resumes.id, id));
    return result[0];
  }

  async createJobMatch(match: InsertJobMatch): Promise<JobMatch> {
    const result = await this.db.insert(jobMatches).values(match).returning();
    return result[0];
  }

  async getJobMatchesByResumeId(resumeId: number): Promise<JobMatch[]> {
    return await this.db.select().from(jobMatches).where(eq(jobMatches.resumeId, resumeId));
  }

  async searchJobs(query: string, experienceLevel?: string, workType?: string): Promise<Job[]> {
    let conditions: any[] = [];

    // Text search across multiple fields
    if (query) {
      conditions.push(
        or(
          ilike(jobs.title, `%${query}%`),
          ilike(jobs.company, `%${query}%`),
          ilike(jobs.description, `%${query}%`),
          ilike(jobs.industry, `%${query}%`)
        )
      );
    }

    // Filter by experience level
    if (experienceLevel) {
      conditions.push(eq(jobs.experienceLevel, experienceLevel));
    }

    // Filter by work type
    if (workType) {
      conditions.push(eq(jobs.workType, workType));
    }

    if (conditions.length === 0) {
      return await this.getAllJobs();
    }

    return await this.db.select().from(jobs).where(and(...conditions));
  }

  // Additional utility methods for database operations
  async getJobCount(): Promise<number> {
    const result = await this.db.select().from(jobs);
    return result.length;
  }

  async getResumeCount(): Promise<number> {
    const result = await this.db.select().from(resumes);
    return result.length;
  }

  async getMatchCount(): Promise<number> {
    const result = await this.db.select().from(jobMatches);
    return result.length;
  }

  // Batch operations for better performance
  async createJobsBatch(jobList: InsertJob[]): Promise<Job[]> {
    const results: Job[] = [];
    
    // Insert in batches of 100 to avoid query size limits
    const batchSize = 100;
    for (let i = 0; i < jobList.length; i += batchSize) {
      const batch = jobList.slice(i, i + batchSize);
      const batchResults = await this.db.insert(jobs).values(batch).returning();
      results.push(...batchResults);
    }
    
    return results;
  }
}

// Create and export the database storage instance
export const databaseStorage = new DatabaseStorage();
