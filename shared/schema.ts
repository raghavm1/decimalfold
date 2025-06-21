import { pgTable, text, serial, integer, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull(),
  workType: text("work_type").notNull(), // Full-time, Part-time, Contract, Remote
  experienceLevel: text("experience_level").notNull(), // Entry, Mid, Senior, Leadership
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  skills: text("skills").array().notNull(),
  postedDate: text("posted_date").notNull(),
  companyLogo: text("company_logo"),
  vector: real("vector").array(), // Vector representation for similarity matching
});

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  originalText: text("original_text").notNull(),
  parsedData: json("parsed_data"), // Parsed skills, experience, etc.
  vector: real("vector").array(), // Vector representation for similarity matching
  uploadedAt: text("uploaded_at").notNull(),
});

export const jobMatches = pgTable("job_matches", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").notNull(),
  jobId: integer("job_id").notNull(),
  matchScore: real("match_score").notNull(),
  matchingSkills: text("matching_skills").array().notNull(),
  confidence: text("confidence").notNull(), // High, Medium, Low
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  vector: true,
});

export const insertResumeSchema = createInsertSchema(resumes).omit({
  id: true,
  vector: true,
  uploadedAt: true,
});

export const insertJobMatchSchema = createInsertSchema(jobMatches).omit({
  id: true,
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumes.$inferSelect;
export type InsertJobMatch = z.infer<typeof insertJobMatchSchema>;
export type JobMatch = typeof jobMatches.$inferSelect;

// Frontend-specific types
export type JobWithMatch = Job & {
  matchScore?: number;
  matchingSkills?: string[];
  confidence?: string;
};

export type ParsedResumeData = {
  skills: string[];
  experienceLevel: string;
  primaryRole: string;
  industries: string[];
  yearsOfExperience: number;
};

export type MatchingStats = {
  totalJobs: number;
  matchesFound: number;
  avgMatchScore: string;
  processingTime: string;
};
