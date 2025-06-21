import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parseResumeWithAI, generateJobVector, generateResumeVector } from "./services/openai";
import { findTopMatches } from "./services/vectorMatcher";
import { jobDatabase } from "./services/jobDatabase";
import multer from "multer";
import { z } from "zod";
import { insertResumeSchema } from "@shared/schema";
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
