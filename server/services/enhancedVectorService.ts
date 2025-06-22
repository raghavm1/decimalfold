import 'dotenv/config';
import { pineconeService } from './pineconeService.js';
import { generateResumeVector } from './openai.js';
import { storage } from '../storage.js';
import type { Job, Resume, JobMatch, InsertJobMatch } from '@shared/schema';

export interface EnhancedJobMatch {
  job: Job;
  matchScore: number;
  matchingSkills: string[];
  confidence: 'High' | 'Medium' | 'Low';
  explanation: string;
  vectorScore: number;
}

export class EnhancedVectorService {
  
  /**
   * Find matching jobs using Pinecone vector search with industry awareness
   */
  static async findVectorMatches(
    resume: Resume,
    options: {
      topK?: number;
      minScore?: number;
      industryFilter?: string[];
      diversifyResults?: boolean;
    } = {}
  ): Promise<EnhancedJobMatch[]> {
    try {
      const { topK = 20, minScore = 0.7, industryFilter, diversifyResults = true } = options;

      console.log('🔄 Generating resume vector...');
      
      // Parse resume to understand the candidate's background
      const parsedData = resume.parsedData as any;
      const candidateIndustries = parsedData?.industries || [];
      const candidateRole = parsedData?.primaryRole || '';
      
      console.log(`👤 Candidate profile: ${candidateRole} | Industries: ${candidateIndustries.join(', ')}`);
      
      // Generate resume vector
      const resumeVector = await generateResumeVector(
        resume.originalText,
        parsedData
      );

      console.log('🔍 Searching Pinecone for similar jobs...');
      
      // Prepare industry filters for Pinecone
      let pineconeFilter = undefined;
      if (industryFilter && industryFilter.length > 0) {
        pineconeFilter = { industry: { $in: industryFilter } };
      }
      
      // Search Pinecone with more results to allow for diversification
      const pineconeMatches = await pineconeService.searchSimilarJobs(resumeVector, {
        topK: Math.max(topK * 3, 60), // Get more results for filtering and diversification
        includeMetadata: true,
        filter: pineconeFilter
      });

      console.log(`📊 Found ${pineconeMatches.length} potential matches`);

      // Process matches with industry scoring
      const jobMatches: EnhancedJobMatch[] = [];
      
      for (const match of pineconeMatches) {
        const score = match.score || 0;
        
        if (score < minScore) continue;

        // Get job from database
        const jobId = parseInt(match.id.replace('job_', ''));
        const job = await storage.getJobById(jobId);
        
        if (!job) continue;

        // Calculate enhanced matching with industry bonus
        const resumeSkills = this.extractSkillsFromResume(resume);
        const jobSkills = job.skills || [];
        const matchingSkills = this.findSkillOverlap(resumeSkills, jobSkills);
        
        // Industry relevance bonus
        let industryBonus = 0;
        if (candidateIndustries.length > 0) {
          const hasIndustryMatch = candidateIndustries.some((candidateInd: string) => 
            job.industry.toLowerCase().includes(candidateInd.toLowerCase()) ||
            candidateInd.toLowerCase().includes(job.industry.toLowerCase())
          );
          if (hasIndustryMatch) {
            industryBonus = 0.1; // 10% bonus for industry match
          }
        }
        
        // Role relevance bonus
        let roleBonus = 0;
        if (candidateRole) {
          const hasRoleMatch = job.title.toLowerCase().includes(candidateRole.toLowerCase().split(' ')[0]) ||
                              candidateRole.toLowerCase().includes(job.title.toLowerCase().split(' ')[0]);
          if (hasRoleMatch) {
            roleBonus = 0.15; // 15% bonus for role match
          }
        }
        
        // Calculate final score with bonuses
        const enhancedScore = Math.min(score + industryBonus + roleBonus, 1.0);
        
        const confidence = this.determineConfidence(enhancedScore, matchingSkills.length);
        const explanation = this.createDetailedExplanation(enhancedScore, score, industryBonus, roleBonus, matchingSkills);

        jobMatches.push({
          job,
          matchScore: enhancedScore,
          matchingSkills,
          confidence,
          explanation,
          vectorScore: score
        });
      }

      // Sort by enhanced score
      jobMatches.sort((a, b) => b.matchScore - a.matchScore);
      
      // Diversify results if requested
      let finalMatches = jobMatches;
      if (diversifyResults) {
        finalMatches = this.diversifyJobMatches(jobMatches, topK);
      } else {
        finalMatches = jobMatches.slice(0, topK);
      }

      console.log(`✅ Returning ${finalMatches.length} industry-aware matches`);
      return finalMatches;

    } catch (error) {
      console.error('❌ Vector matching failed:', error);
      throw error;
    }
  }

  /**
   * Save enhanced matches to database
   */
  static async saveEnhancedMatches(resumeId: number, matches: EnhancedJobMatch[]): Promise<void> {
    try {
      for (const match of matches) {
        const jobMatch: InsertJobMatch = {
          resumeId,
          jobId: match.job.id,
          matchScore: match.vectorScore,
          matchingSkills: match.matchingSkills,
          confidence: match.confidence
        };

        await storage.createJobMatch(jobMatch);
      }
      
      console.log(`✅ Saved ${matches.length} enhanced matches`);
    } catch (error) {
      console.error('❌ Error saving enhanced matches:', error);
    }
  }

  /**
   * Extract skills from resume data
   */
  private static extractSkillsFromResume(resume: Resume): string[] {
    const parsedData = resume.parsedData as any;
    
    if (parsedData?.skills && Array.isArray(parsedData.skills)) {
      return parsedData.skills.map((s: string) => s.toLowerCase().trim());
    }
    
    // Basic keyword extraction as fallback
    const commonSkills = [
      'javascript', 'typescript', 'python', 'java', 'react', 'vue', 'angular',
      'node.js', 'express', 'next.js', 'aws', 'azure', 'gcp', 'docker', 'kubernetes',
      'postgresql', 'mongodb', 'mysql', 'redis', 'graphql', 'rest api',
      'machine learning', 'data science', 'ai', 'devops', 'ci/cd'
    ];
    
    const text = resume.originalText.toLowerCase();
    return commonSkills.filter(skill => text.includes(skill));
  }

  /**
   * Find overlapping skills
   */
  private static findSkillOverlap(resumeSkills: string[], jobSkills: string[]): string[] {
    const normalizedJobSkills = jobSkills.map(s => s.toLowerCase().trim());
    const matches: string[] = [];
    
    for (const resumeSkill of resumeSkills) {
      for (const jobSkill of normalizedJobSkills) {
        if (jobSkill.includes(resumeSkill) || resumeSkill.includes(jobSkill)) {
          if (!matches.includes(resumeSkill)) {
            matches.push(resumeSkill);
          }
          break;
        }
      }
    }
    
    return matches;
  }

  /**
   * Determine match confidence
   */
  private static determineConfidence(score: number, skillMatches: number): 'High' | 'Medium' | 'Low' {
    if (score >= 0.85 && skillMatches >= 3) return 'High';
    if (score >= 0.75 || skillMatches >= 2) return 'Medium';
    return 'Low';
  }

  /**
   * Create detailed explanation for match score
   */
  private static createDetailedExplanation(
    enhancedScore: number, 
    vectorScore: number, 
    industryBonus: number, 
    roleBonus: number, 
    matchingSkills: string[]
  ): string {
    const explanationParts: string[] = [];
    
    explanationParts.push(`Base vector similarity: ${(vectorScore * 100).toFixed(1)}%`);
    
    if (industryBonus > 0) {
      explanationParts.push(`Industry match bonus: +${(industryBonus * 100).toFixed(1)}%`);
    }
    
    if (roleBonus > 0) {
      explanationParts.push(`Role relevance bonus: +${(roleBonus * 100).toFixed(1)}%`);
    }
    
    if (matchingSkills.length > 0) {
      explanationParts.push(`Matching skills: ${matchingSkills.slice(0, 3).join(', ')}${matchingSkills.length > 3 ? ` +${matchingSkills.length - 3} more` : ''}`);
    }
    
    explanationParts.push(`Final score: ${(enhancedScore * 100).toFixed(1)}%`);
    
    return explanationParts.join(' | ');
  }

  /**
   * Diversify job matches to avoid too many similar positions
   */
  private static diversifyJobMatches(matches: EnhancedJobMatch[], topK: number): EnhancedJobMatch[] {
    if (matches.length <= topK) {
      return matches;
    }
    
    const diversified: EnhancedJobMatch[] = [];
    const usedIndustries = new Set<string>();
    const usedRoleTypes = new Set<string>();
    
    // First pass: Pick the best match from each industry/role combination
    for (const match of matches) {
      const industry = match.job.industry.toLowerCase();
      const roleType = match.job.title.toLowerCase().split(' ')[0]; // First word of title
      const key = `${industry}-${roleType}`;
      
      if (diversified.length >= topK) break;
      
      if (!usedIndustries.has(industry) || !usedRoleTypes.has(roleType)) {
        diversified.push(match);
        usedIndustries.add(industry);
        usedRoleTypes.add(roleType);
      }
    }
    
    // Second pass: Fill remaining spots with highest scoring matches
    for (const match of matches) {
      if (diversified.length >= topK) break;
      
      if (!diversified.find(d => d.job.id === match.job.id)) {
        diversified.push(match);
      }
    }
    
    // Sort by score again to maintain order
    return diversified.sort((a, b) => b.matchScore - a.matchScore).slice(0, topK);
  }

  /**
   * Get Pinecone statistics
   */
  static async getPineconeStats(): Promise<any> {
    try {
      return await pineconeService.getIndexStats();
    } catch (error) {
      console.error('Error getting Pinecone stats:', error);
      return { totalVectorCount: 0, error: 'Unable to fetch stats' };
    }
  }
}

export const enhancedVectorService = EnhancedVectorService;
