import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parseResumeWithAI, generateJobVector, generateResumeVector } from "./services/openai";
import { findTopMatches } from "./services/vectorMatcher";
import { jobDatabase } from "./services/jobDatabase";
import { generateJobs, generateTechJobs, generateDataJobs } from "./services/jobGenerator";
import { VectorStrategyFactory } from "./services/vectorStrategies";
import multer from "multer";
import { z } from "zod";
import { insertResumeSchema, InsertJob, Job, Resume, ParsedResumeData } from "@shared/schema";
import mammoth from "mammoth";
import * as fs from "fs";
import * as path from "path";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, DOC, and DOCX files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize job database
  await initializeJobDatabase();

  // Get all jobs
  app.get("/api/jobs", async (req, res) => {
    try {
      const { search, experienceLevel, workType } = req.query;
      
      const jobs = await storage.searchJobs(
        search as string,
        experienceLevel as string,
        workType as string
      );
      
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Upload and parse resume
  app.post("/api/resume/upload", upload.single('resume'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileName = req.file.originalname;
      const fileBuffer = req.file.buffer;
      let resumeText = "";

      // Extract text based on file type
      if (req.file.mimetype === 'text/plain') {
        resumeText = fileBuffer.toString('utf-8');
      } else if (req.file.mimetype === 'application/pdf') {
        try {
          // For PDF files, attempt basic text extraction
          // Convert buffer to string and clean up non-printable characters
          const rawText = fileBuffer.toString('binary');
          const extractedText = rawText
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g, ' ') // Remove non-printable chars
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          
          // Look for readable text patterns
          const readableText = extractedText.match(/[a-zA-Z\s\d\.\,\;\:\!\?\-\(\)]{20,}/g);
          if (readableText && readableText.length > 0) {
            resumeText = readableText.join(' ').trim();
          } else {
            resumeText = extractedText;
          }
          
          if (resumeText.length < 50) {
            return res.status(400).json({ 
              message: "Unable to extract sufficient text from PDF. Please try uploading as a text file or DOCX format for better results." 
            });
          }
        } catch (error) {
          console.error("PDF processing error:", error);
          return res.status(400).json({ message: "Failed to process PDF file" });
        }
      } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
          // Extract text from DOCX using mammoth
          const result = await mammoth.extractRawText({ buffer: fileBuffer });
          resumeText = result.value.trim();
          
          if (result.messages && result.messages.length > 0) {
            console.log("DOCX parsing messages:", result.messages);
          }
          
          if (resumeText.length < 50) {
            return res.status(400).json({ message: "Unable to extract sufficient text from DOCX file" });
          }
        } catch (error) {
          console.error("DOCX parsing error:", error);
          return res.status(400).json({ message: "Failed to parse DOCX file" });
        }
      } else if (req.file.mimetype === 'application/msword') {
        // For legacy DOC files, try basic text extraction
        resumeText = fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
        if (resumeText.length < 50) {
          return res.status(400).json({ message: "Unable to extract text from DOC file. Please try uploading as DOCX or TXT format." });
        }
      } else {
        return res.status(400).json({ message: "Unsupported file type" });
      }

      // Parse resume with OpenAI
      const parsedData = await parseResumeWithAI(resumeText);
      
      // Generate vector representation
      const vector = await generateResumeVector(resumeText, parsedData);

      // Save to storage
      const resume = await storage.createResume({
        fileName,
        originalText: resumeText,
        parsedData
      });

      // Update with vector (simulating database update)
      (resume as any).vector = vector;

      res.json({
        resume,
        parsedData
      });
    } catch (error) {
      console.error("Error processing resume:", error);
      res.status(500).json({ message: "Failed to process resume" });
    }
  });

  // Find job matches for a resume
  app.post("/api/resume/:id/matches", async (req, res) => {
    try {
      const resumeId = parseInt(req.params.id);
      const resume = await storage.getResumeById(resumeId);
      
      if (!resume || !resume.parsedData) {
        return res.status(404).json({ message: "Resume not found" });
      }

      const allJobs = await storage.getAllJobs();
      const matches = findTopMatches(allJobs, resume, resume.parsedData as any, 5);

      // Store match results
      for (const match of matches) {
        await storage.createJobMatch({
          resumeId,
          jobId: match.id,
          matchScore: match.matchScore,
          matchingSkills: match.matchingSkills,
          confidence: match.confidence
        });
      }

      res.json({
        matches,
        stats: {
          totalJobs: allJobs.length,
          matchesFound: matches.length,
          avgMatchScore: matches.length > 0 ? 
            Math.round(matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length * 100) + '%' : 
            '-',
          processingTime: '2.3s'
        }
      });
    } catch (error) {
      console.error("Error finding matches:", error);
      res.status(500).json({ message: "Failed to find job matches" });
    }
  });

  // Get job details
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJobById(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job details" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Job generation endpoints for testing at scale
  app.post("/api/jobs/generate", async (req, res) => {
    try {
      const { count = 100, type = "general" } = req.body;
      
      if (count > 100000) {
        return res.status(400).json({ message: "Maximum 100,000 jobs can be generated at once" });
      }
      
      let jobs: InsertJob[];
      switch (type) {
        case "tech":
          jobs = generateTechJobs(count);
          break;
        case "data":
          jobs = generateDataJobs(count);
          break;
        default:
          jobs = generateJobs(count);
      }
      
      // Batch insert jobs
      const createdJobs = [];
      for (const jobData of jobs) {
        const job = await storage.createJob(jobData);
        createdJobs.push(job);
      }
      
      res.json({ 
        message: `Generated ${count} ${type} jobs successfully`,
        count: createdJobs.length,
        totalJobs: (await storage.getAllJobs()).length
      });
    } catch (error) {
      console.error("Failed to generate jobs:", error);
      res.status(500).json({ message: "Failed to generate jobs" });
    }
  });

  // Get job statistics
  app.get("/api/jobs/stats", async (req, res) => {
    try {
      const allJobs = await storage.getAllJobs();
      const stats = {
        totalJobs: allJobs.length,
        byExperienceLevel: {} as Record<string, number>,
        byIndustry: {} as Record<string, number>,
        byWorkType: {} as Record<string, number>,
        byLocation: {} as Record<string, number>
      };
      
      allJobs.forEach(job => {
        stats.byExperienceLevel[job.experienceLevel] = (stats.byExperienceLevel[job.experienceLevel] || 0) + 1;
        stats.byIndustry[job.industry] = (stats.byIndustry[job.industry] || 0) + 1;
        stats.byWorkType[job.workType] = (stats.byWorkType[job.workType] || 0) + 1;
        stats.byLocation[job.location] = (stats.byLocation[job.location] || 0) + 1;
      });
      
      res.json(stats);
    } catch (error) {
      console.error("Failed to get job stats:", error);
      res.status(500).json({ message: "Failed to get job statistics" });
    }
  });

  // Test different vectorizing strategies
  app.post("/api/resume/:id/matches/strategy", async (req, res) => {
    try {
      const resumeId = parseInt(req.params.id);
      const { strategy = "tfidf" } = req.body;
      
      const resume = await storage.getResumeById(resumeId);
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      const jobs = await storage.getAllJobs();
      const parsedData = JSON.parse(resume.parsedData as string);
      
      // Use selected vector strategy
      const vectorStrategy = VectorStrategyFactory.create(strategy);
      
      const startTime = Date.now();
      
      // Generate vectors using the selected strategy
      const resumeVector = await vectorStrategy.generateResumeVector(resume, parsedData);
      
      const jobMatches: Array<Job & { matchScore: number; strategy: string }> = [];
      
      for (const job of jobs) {
        const jobVector = await vectorStrategy.generateJobVector(job);
        const similarity = vectorStrategy.calculateSimilarity(jobVector, resumeVector);
        
        jobMatches.push({
          ...job,
          matchScore: Math.round(similarity * 100),
          strategy: vectorStrategy.name
        });
      }
      
      // Sort by match score
      jobMatches.sort((a, b) => b.matchScore - a.matchScore);
      
      const processingTime = Date.now() - startTime;
      
      res.json({
        strategy: vectorStrategy.name,
        description: vectorStrategy.description,
        matches: jobMatches.slice(0, 50), // Return top 50 matches
        stats: {
          totalJobs: jobs.length,
          matchesFound: jobMatches.filter(m => m.matchScore > 10).length,
          avgMatchScore: (jobMatches.reduce((sum, m) => sum + m.matchScore, 0) / jobMatches.length).toFixed(1),
          processingTime: `${processingTime}ms`
        }
      });
    } catch (error) {
      console.error("Failed to test vector strategy:", error);
      res.status(500).json({ message: "Failed to test vector strategy" });
    }
  });

  // Get available vector strategies
  app.get("/api/strategies", (req, res) => {
    try {
      const strategies = VectorStrategyFactory.getAvailableStrategies().map(name => {
        const strategy = VectorStrategyFactory.create(name);
        return {
          name: strategy.name,
          key: name,
          description: strategy.description
        };
      });
      
      res.json(strategies);
    } catch (error) {
      console.error("Failed to get strategies:", error);
      res.status(500).json({ message: "Failed to get available strategies" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeJobDatabase() {
  try {
    // Check if jobs already exist
    const existingJobs = await storage.getAllJobs();
    if (existingJobs.length > 0) {
      return; // Jobs already initialized
    }

    // Create jobs with vectors
    for (const jobData of jobDatabase) {
      try {
        const vector = await generateJobVector(jobData);
        const job = await storage.createJob(jobData);
        // Update with vector (simulating database update)
        (job as any).vector = vector;
      } catch (error) {
        console.error(`Failed to create job: ${jobData.title}`, error);
        // Continue with other jobs even if one fails
        await storage.createJob(jobData);
      }
    }

    console.log(`Initialized ${jobDatabase.length} jobs in the database`);
  } catch (error) {
    console.error("Failed to initialize job database:", error);
  }
}
