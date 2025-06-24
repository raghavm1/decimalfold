import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parseResumeWithAI, generateJobVector, generateResumeVector } from "./services/openai";
import { findTopMatches, findJobMatchesWithPinecone } from "./services/vectorMatcher";
import { jobDatabase } from "./services/jobDatabase";
import { generateJobs, generateTechJobs, generateDataJobs } from "./services/jobGenerator";
import { VectorStrategyFactory } from "./services/vectorStrategies";
import { PDFService } from "./services/pdfService";
import { LanguageTranslationService } from "./services/languageTranslationService";
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
    fileSize: 2 * 1024 * 1024, // 10MB limit
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

  // Get all jobs with pagination
  app.get("/api/jobs", async (req, res) => {
    try {
      const { search, experienceLevel, workType, page, limit } = req.query;
      
      // Parse pagination parameters
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 20;
      
      // Validate pagination parameters
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({ 
          message: "Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 100." 
        });
      }
      
      const result = await storage.searchJobsPaginated(
        search as string,
        experienceLevel as string,
        workType as string,
        pageNum,
        limitNum
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Get all jobs (legacy endpoint for backward compatibility)
  app.get("/api/jobs/all", async (req, res) => {
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
          console.log('🔄 Processing PDF resume...');
          
          const pdfResult = await PDFService.extractTextFromBuffer(fileBuffer, {
            minTextLength: 50,
            maxTextLength: 20000,
            preserveFormatting: true
          });
          
          resumeText = pdfResult.text;
          
          console.log(`✅ pdf2json extracted ${resumeText.length} characters using ${pdfResult.extractionMethod}`);
          console.log(`📊 Extraction confidence: ${pdfResult.confidence}`);
          console.log(`📄 Processed ${pdfResult.pages} pages`);
          
          if (pdfResult.metadata) {
            console.log(`📝 Total characters: ${pdfResult.metadata.totalCharacters}, Page texts: ${pdfResult.metadata.pageTexts.length}`);
          }
          
          // Validate that it looks like a resume
          const validation = PDFService.validateResumeContent(resumeText);
          console.log(`📋 Resume validation: ${validation.confidence} confidence`);
          console.log(`🔍 Found keywords: ${validation.foundKeywords.slice(0, 5).join(', ')}...`);
          
          if (!validation.isValid) {
            console.log('⚠️  Resume validation warnings:', validation.suggestions);
            // Don't block the upload, just log warnings
            console.log('⚠️  Proceeding with upload despite validation warnings...');
          }
          
        } catch (error) {
          console.error("PDF processing error:", error);
          
          // Provide more helpful error messages
          let errorMessage = "Failed to process PDF file.";
          if (error instanceof Error) {
            if (error.message.includes('too short')) {
              errorMessage = "Unable to extract sufficient text from PDF. The PDF might be scanned/image-based, password protected, or corrupted.";
            } else if (error.message.includes('extraction failed') || error.message.includes('parsing failed')) {
              errorMessage = "PDF text extraction failed. Please ensure the PDF contains selectable text and is not password protected.";
            }
          }
          
          return res.status(400).json({ message: errorMessage });
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

      // Step 1: Detect language and translate if necessary
      console.log('🌍 Processing resume language...');
      const languageResult = await LanguageTranslationService.processResumeText(resumeText);
      
      // Get the text to use for AI processing (translated if available, original otherwise)
      const textForProcessing = LanguageTranslationService.getProcessingText(languageResult);
      
      // Log language processing results
      const languageInfo = LanguageTranslationService.getLanguageDisplayInfo(languageResult);
      console.log(`📊 Language processing: ${languageInfo.displayText} (${languageInfo.confidence} confidence)`);
      
      if (languageResult.translationError) {
        console.log(`⚠️  Translation warning: ${languageResult.translationError}`);
      }

      // Step 2: Parse resume with OpenAI using processed text
      console.log('🤖 Parsing resume with AI...');
      const parsedData = await parseResumeWithAI(textForProcessing);
      
      // Step 3: Generate vector representation using processed text
      console.log('🔢 Generating vector representation...');
      const vector = await generateResumeVector(textForProcessing, parsedData);

      // Step 4: Save to storage with language information
      const resume = await storage.createResume({
        fileName,
        originalText: resumeText, // Always keep original text
        parsedData: {
          ...parsedData,
          // Add language processing metadata
          languageProcessing: {
            detectedLanguage: languageResult.detectedLanguage,
            languageName: languageResult.languageName,
            confidence: languageResult.confidence,
            wasTranslated: !!languageResult.translatedText,
            translationError: languageResult.translationError
          }
        }
      });

      // Update with vector (simulating database update)
      (resume as any).vector = vector;

      console.log('✅ Resume processing complete!');
      console.log(`📊 Final stats: Original: ${resumeText.length} chars, Processed: ${textForProcessing.length} chars`);

      res.json({
        resume,
        parsedData: resume.parsedData,
        languageProcessing: {
          detectedLanguage: languageResult.detectedLanguage,
          languageName: languageResult.languageName,
          confidence: languageResult.confidence,
          wasTranslated: !!languageResult.translatedText,
          displayText: languageInfo.displayText
        }
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

      // Use Pinecone for efficient vector similarity search
      console.log(`🔍 Finding job matches for resume ${resumeId} using Pinecone...`);
      const matches = await findJobMatchesWithPinecone(resume, resume.parsedData as any, 20);

      // Filter to top 5 matches for response
      const topMatches = matches.slice(0, 5);

      // Store match results
      for (const match of topMatches) {
        await storage.createJobMatch({
          resumeId,
          jobId: match.id,
          matchScore: match.matchScore,
          matchingSkills: match.matchingSkills,
          confidence: match.confidence
        });
      }

      // Get total jobs count for stats
      const totalJobsCount = await storage.getAllJobs().then(jobs => jobs.length);

      res.json({
        matches: topMatches,
        stats: {
          totalJobs: totalJobsCount,
          matchesFound: topMatches.length,
          avgMatchScore: topMatches.length > 0 ? 
            Math.round(topMatches.reduce((sum, m) => sum + m.matchScore, 0) / topMatches.length * 100) + '%' : 
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
        const industry = job.industry || "Technology";
        stats.byIndustry[industry] = (stats.byIndustry[industry] || 0) + 1;
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
      const parsedData = typeof resume.parsedData === 'string' 
        ? JSON.parse(resume.parsedData) 
        : resume.parsedData;
      
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
