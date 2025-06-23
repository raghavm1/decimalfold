import type { Job, Resume, ParsedResumeData } from "@shared/schema";
import { openai } from "./openai";
import { PineconeService } from "./pineconeService";
import { storage } from "../storage";

/**
 * Apply Maximal Marginal Relevance (MMR) to diversify job recommendations
 * This prevents showing too many jobs from the same company
 */
export function applyMMR(
  jobs: Array<Job & { matchScore: number; matchingSkills: string[]; confidence: string }>,
  lambda: number = 0.7, // Balance between relevance (1.0) and diversity (0.0)
  maxResults: number = 20
): Array<Job & { matchScore: number; matchingSkills: string[]; confidence: string }> {
  if (jobs.length <= maxResults) {
    return jobs;
  }

  console.log(`🎯 Applying MMR to ${jobs.length} jobs, targeting ${maxResults} diverse results...`);

  const selected: Array<Job & { matchScore: number; matchingSkills: string[]; confidence: string }> = [];
  const remaining = [...jobs];
  const companyCount = new Map<string, number>();

  // Select the first (highest relevance) job
  if (remaining.length > 0) {
    const first = remaining.shift()!;
    selected.push(first);
    companyCount.set(first.company.toLowerCase(), 1);
  }

  // Continue selecting jobs using MMR formula
  while (selected.length < maxResults && remaining.length > 0) {
    let bestJob: (Job & { matchScore: number; matchingSkills: string[]; confidence: string }) | null = null;
    let bestMMRScore = -1;
    let bestIndex = -1;

    for (let i = 0; i < remaining.length; i++) {
      const job = remaining[i];
      const relevanceScore = job.matchScore; // Original relevance score from Pinecone

      // Calculate diversity score (how different this job is from selected jobs)
      let diversityScore = 1.0;
      
      // Company diversity: penalize jobs from companies we already have
      const company = job.company.toLowerCase();
      const existingFromSameCompany = companyCount.get(company) || 0;
      
      if (existingFromSameCompany > 0) {
        // Heavy penalty for duplicate companies
        diversityScore *= Math.pow(0.3, existingFromSameCompany);
      }

      // Location diversity: slight penalty for same location
      const sameLocationCount = selected.filter(s => 
        s.location.toLowerCase() === job.location.toLowerCase()
      ).length;
      if (sameLocationCount > 2) {
        diversityScore *= 0.8; // 20% penalty for location clustering
      }

      // Industry diversity: slight penalty for same industry
      const sameIndustryCount = selected.filter(s => 
        s.industry.toLowerCase() === job.industry.toLowerCase()
      ).length;
      if (sameIndustryCount > 3) {
        diversityScore *= 0.9; // 10% penalty for industry clustering
      }

      // MMR formula: λ * relevance + (1-λ) * diversity
      const mmrScore = lambda * relevanceScore + (1 - lambda) * diversityScore;

      if (mmrScore > bestMMRScore) {
        bestMMRScore = mmrScore;
        bestJob = job;
        bestIndex = i;
      }
    }

    // Add the best job and remove from remaining
    if (bestJob && bestIndex >= 0) {
      selected.push(bestJob);
      remaining.splice(bestIndex, 1);
      
      // Update company count
      const company = bestJob.company.toLowerCase();
      companyCount.set(company, (companyCount.get(company) || 0) + 1);
    } else {
      break; // No more valid jobs
    }
  }

  // Log diversity metrics
  const companyDiversity = new Set(selected.map(j => j.company.toLowerCase())).size;
  const locationDiversity = new Set(selected.map(j => j.location.toLowerCase())).size;
  const industryDiversity = new Set(selected.map(j => j.industry.toLowerCase())).size;

  console.log(`✨ MMR Results: ${selected.length} jobs selected`);
  console.log(`   📊 Company diversity: ${companyDiversity} unique companies`);
  console.log(`   🌍 Location diversity: ${locationDiversity} unique locations`);
  console.log(`   🏭 Industry diversity: ${industryDiversity} unique industries`);
  
  // Show top companies
  const topCompanies = Array.from(companyCount.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([company, count]) => `${company}(${count})`)
    .join(', ');
  console.log(`   🏢 Top companies: ${topCompanies}`);

  return selected;
}

export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

export function calculateJobMatch(
  job: Job,
  resume: Resume,
  parsedData: ParsedResumeData
): {
  matchScore: number;
  matchingSkills: string[];
  confidence: string;
} {
  // Vector similarity (primary matching method)
  let vectorScore = 0;
  if (job.vector && resume.vector) {
    vectorScore = cosineSimilarity(job.vector, resume.vector);
  }

  // Skill overlap scoring
  const jobSkills = job.skills.map(skill => skill.toLowerCase());
  const resumeSkills = parsedData.skills.map(skill => skill.toLowerCase());
  
  console.log(`🔍 Matching job "${job.title}": Job skills: [${jobSkills.slice(0, 3).join(', ')}...], Resume skills: [${resumeSkills.slice(0, 3).join(', ')}...]`);
  
  const matchingSkills = jobSkills.filter(skill => 
    resumeSkills.some(resumeSkill => 
      resumeSkill.includes(skill) || skill.includes(resumeSkill)
    )
  );

  const skillOverlapScore = matchingSkills.length / Math.max(jobSkills.length, 1);
  
  console.log(`📊 Skills: ${matchingSkills.length} matches, overlap: ${(skillOverlapScore * 100).toFixed(1)}%, vector: ${(vectorScore * 100).toFixed(1)}%`);

  // Experience level matching
  const experienceLevels = {
    "Entry Level": 1,
    "Mid-Level": 2,
    "Senior Level": 3,
    "Leadership": 4
  };

  const jobLevel = experienceLevels[job.experienceLevel as keyof typeof experienceLevels] || 1;
  const resumeLevel = experienceLevels[parsedData.experienceLevel as keyof typeof experienceLevels] || 1;
  
  const experienceScore = 1 - Math.abs(jobLevel - resumeLevel) / 3;

  // Combine scores with weights - adjust based on vector availability
  let finalScore;
  if (vectorScore > 0) {
    // If vectors available, use original weighting
    finalScore = (
      vectorScore * 0.5 +
      skillOverlapScore * 0.3 +
      experienceScore * 0.2
    );
  } else {
    // If no vectors, rely more on skill matching and experience
    finalScore = (
      skillOverlapScore * 0.7 +
      experienceScore * 0.3
    );
  }

  // More realistic confidence thresholds
  let confidence = "Low";
  if (vectorScore > 0) {
    // With vector similarity
    if (finalScore >= 0.75 && matchingSkills.length >= 2) confidence = "High";
    else if (finalScore >= 0.55 && matchingSkills.length >= 1) confidence = "Medium";
  } else {
    // Without vectors, base on skill overlap
    if (skillOverlapScore >= 0.6 && matchingSkills.length >= 3) confidence = "High";
    else if (skillOverlapScore >= 0.3 && matchingSkills.length >= 2) confidence = "Medium";
  }
  
  console.log(`📈 Final score: ${(finalScore * 100).toFixed(1)}%, confidence: ${confidence}`);

  return {
    matchScore: Math.round(finalScore * 100) / 100,
    matchingSkills: job.skills.filter(skill => 
      matchingSkills.includes(skill.toLowerCase())
    ),
    confidence
  };
}

export async function findTopMatches(
  jobs: Job[],
  resume: Resume,
  parsedData: ParsedResumeData,
  limit: number = 5
): Promise<Array<Job & { matchScore: number; matchingSkills: string[]; confidence: string }>> {
  try {
    console.log(`🔍 Finding top ${limit} job matches from ${jobs.length} total jobs...`);
    
    if (jobs.length === 0) {
      return [];
    }

    // Calculate initial matches for all jobs (no pre-filtering)
    const allMatches = jobs.map(job => {
      const matchResult = calculateJobMatch(job, resume, parsedData);
      return {
        ...job,
        ...matchResult
      };
    });

    // Sort by match score and get top candidates (more than we need for AI filtering)
    const topCandidates = allMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, Math.min(limit * 3, 30)); // Get 3x more candidates for AI filtering

    console.log(`🎯 Selected top ${topCandidates.length} candidates for AI filtering`);

    // Use AI to filter the top candidates
    const { appropriateMatches, filteredOut } = await filterJobMatchesWithAI(
      resume, 
      topCandidates, 
      limit
    );

    console.log(`✅ Final result: ${appropriateMatches.length} appropriate matches`);
    
    // Log filtered out jobs for debugging
    if (filteredOut.length > 0) {
      console.log(`🚫 Filtered out ${filteredOut.length} inappropriate jobs:`);
      filteredOut.slice(0, 5).forEach(item => {
        console.log(`   - ${item.job.title}: ${item.reason}`);
      });
    }

    return appropriateMatches;
      
  } catch (error) {
    console.error('❌ Error in AI-powered job matching:', error);
    // Fallback to traditional matching if AI filtering fails
    const fallbackMatches = jobs.map(job => {
      const matchResult = calculateJobMatch(job, resume, parsedData);
      return {
        ...job,
        ...matchResult
      };
    });
    
    return fallbackMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }
}

/**
 * Use AI to filter job matches based on appropriateness of job titles and experience levels
 */
export async function filterJobMatchesWithAI(
  resume: Resume, 
  jobMatches: Array<Job & { matchScore: number; matchingSkills: string[]; confidence: string }>, 
  topK: number = 10
): Promise<{
  appropriateMatches: Array<Job & { matchScore: number; matchingSkills: string[]; confidence: string }>;
  filteredOut: Array<{ job: Job & { matchScore: number; matchingSkills: string[]; confidence: string }; reason: string }>;
}> {
  try {
    console.log(`🤖 Using AI to filter ${jobMatches.length} job matches...`);
    
    // Extract resume summary for context
    const parsedData = resume.parsedData as any;
    const candidateName = parsedData?.name || 'Candidate';
    const yearsOfExperience = parsedData?.yearsOfExperience || 'Unknown';
    const currentLevel = parsedData?.experienceLevel || 'Unknown';
    const skills = parsedData?.skills || [];
    const recentExperience = parsedData?.workExperience?.[0] || {};
    
    // Prepare job data for AI analysis
    const jobsForAnalysis = jobMatches.slice(0, Math.min(jobMatches.length, 20)).map((match, index) => ({
      id: index,
      title: match.title,
      company: match.company,
      experienceLevel: match.experienceLevel,
      skills: match.skills || [],
      location: match.location,
      matchScore: match.matchScore,
      currentConfidence: match.confidence
    }));

    const prompt = `
You are an expert career counselor. Analyze whether these job opportunities are appropriate matches for this candidate.

CANDIDATE PROFILE:
- Name: ${candidateName}
- Years of Experience: ${yearsOfExperience}
- Current Level: ${currentLevel}
- Key Skills: ${skills.slice(0, 10).join(', ')}
- Most Recent Role: ${recentExperience.title || 'Not specified'} at ${recentExperience.company || 'Not specified'}

JOB OPPORTUNITIES TO ANALYZE:
${jobsForAnalysis.map(job => 
  `ID ${job.id}: ${job.title} at ${job.company} (${job.experienceLevel}) - Skills: ${job.skills.slice(0, 5).join(', ')} - Current Match: ${(job.matchScore * 100).toFixed(0)}%`
).join('\n')}

FILTERING CRITERIA:
1. **Experience Level Appropriateness**: 
   - Don't recommend jobs that are significantly above the candidate's level (e.g., don't show VP roles to mid-level engineers)
   - Don't recommend jobs that are significantly below their level (e.g., don't show intern roles to senior engineers)
   - Allow reasonable career progression (1-2 levels up is okay)

2. **Title Relevance**:
   - Job title should align with candidate's background and skills
   - Consider domain expertise and industry fit
   - Flag roles that are completely unrelated to their experience

3. **Skill Alignment**:
   - Major skill mismatches should be filtered out
   - Consider transferable skills but flag major gaps

For each job, decide: KEEP or FILTER_OUT

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks, no extra text.

Return your analysis in this exact JSON format:
{
  "analysis": [
    {
      "jobId": 0,
      "decision": "KEEP",
      "reason": "Brief explanation of why this job is appropriate or inappropriate",
      "confidenceAdjustment": "INCREASE"
    }
  ],
  "summary": "Overall assessment of the candidate's job market fit"
}

Be practical but not overly restrictive. The goal is to show relevant opportunities while filtering out obviously inappropriate ones.

Response must be valid JSON only:
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2000
    });

    // Extract JSON from AI response, handling markdown code blocks
    let responseContent = response.choices[0].message.content || '{}';
    console.log(`🤖 Raw AI response: ${responseContent.substring(0, 200)}...`);
    
    // Remove markdown code blocks if present
    if (responseContent.includes('```json')) {
      const jsonMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        responseContent = jsonMatch[1];
      }
    } else if (responseContent.includes('```')) {
      const codeMatch = responseContent.match(/```\s*([\s\S]*?)\s*```/);
      if (codeMatch) {
        responseContent = codeMatch[1];
      }
    }
    
    // Clean up any remaining markdown or extra characters
    responseContent = responseContent.trim();
    
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError);
      console.error('📄 Response content:', responseContent);
      throw new Error('AI response was not valid JSON');
    }
    
    console.log(`📊 AI filtering summary: ${aiAnalysis.summary}`);

    const appropriateMatches: Array<Job & { matchScore: number; matchingSkills: string[]; confidence: string }> = [];
    const filteredOut: Array<{ job: Job & { matchScore: number; matchingSkills: string[]; confidence: string }; reason: string }> = [];

    aiAnalysis.analysis?.forEach((analysis: any) => {
      const jobMatch = jobMatches[analysis.jobId];
      if (!jobMatch) return;

      if (analysis.decision === 'KEEP') {
        // Adjust confidence based on AI recommendation
        let adjustedMatch = { ...jobMatch };
        
        if (analysis.confidenceAdjustment === 'INCREASE') {
          adjustedMatch.confidence = adjustedMatch.confidence === 'Low' ? 'Medium' : 
                                   adjustedMatch.confidence === 'Medium' ? 'High' : 'High';
        } else if (analysis.confidenceAdjustment === 'DECREASE') {
          adjustedMatch.confidence = adjustedMatch.confidence === 'High' ? 'Medium' : 
                                   adjustedMatch.confidence === 'Medium' ? 'Low' : 'Low';
        }
        
        appropriateMatches.push(adjustedMatch);
        console.log(`✅ Keeping: ${jobMatch.title} - ${analysis.reason}`);
      } else {
        filteredOut.push({ job: jobMatch, reason: analysis.reason });
        console.log(`🚫 Filtering out: ${jobMatch.title} - ${analysis.reason}`);
      }
    });

    // Sort appropriate matches by score and limit to topK
    const finalMatches = appropriateMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, topK);

    console.log(`🎯 AI filtering result: ${finalMatches.length} appropriate matches out of ${jobMatches.length} total`);

    return {
      appropriateMatches: finalMatches,
      filteredOut
    };

  } catch (error) {
    console.error('❌ Error in AI job filtering:', error);
    // Fallback to original matches if AI filtering fails
    return {
      appropriateMatches: jobMatches.slice(0, topK),
      filteredOut: []
    };
  }
}

/**
 * Find job matches using Pinecone vector search with MMR diversification
 */
export async function findJobMatchesWithPinecone(
  resume: Resume,
  parsedData: ParsedResumeData,
  limit: number = 20
): Promise<Array<Job & { matchScore: number; matchingSkills: string[]; confidence: string }>> {
  try {
    console.log(`🔍 Finding top ${limit} job matches using Pinecone vector search with MMR...`);
    
    // Initialize Pinecone service
    const pineconeService = new PineconeService();
    
    // Generate resume vector if not exists
    let resumeVector = resume.vector;
    if (!resumeVector) {
      console.log('📄 Generating resume vector...');
      const resumeText = `${parsedData.primaryRole} ${parsedData.skills.join(' ')} ${parsedData.industries.join(' ')}`;
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: resumeText,
        encoding_format: 'float'
      });
      resumeVector = response.data[0].embedding;
    }

    // Query Pinecone for more jobs to allow for MMR diversification
    const searchLimit = Math.max(limit * 2.5, 50); // Get 2.5x more jobs for MMR selection
    console.log(`🔍 Querying Pinecone for top ${searchLimit} similar jobs for MMR diversification...`);
    const searchResults = await pineconeService.searchSimilarJobs(resumeVector, {
      topK: searchLimit,
      includeMetadata: true
    });

    console.log(`✨ Found ${searchResults.length} potential matches from Pinecone`);

    // Get job details from database for the matched job IDs
    const jobIds = searchResults.map(result => {
      const match = result.id.match(/job_(\d+)/);
      return match ? parseInt(match[1]) : null;
    }).filter(id => id !== null) as number[];

    console.log(`🔍 Fetching ${jobIds.length} job details from database...`);
    const jobPromises = jobIds.map(id => storage.getJobById(id));
    const jobResults = await Promise.all(jobPromises);
    const jobs = jobResults.filter(job => job !== undefined) as Job[];

    // Combine Pinecone scores with job data and add skill matching
    const matchedJobs = searchResults.map(result => {
      const match = result.id.match(/job_(\d+)/);
      if (!match) return null;
      
      const jobId = parseInt(match[1]);
      const job = jobs.find((j: Job) => j.id === jobId);
      if (!job) return null;

      // Calculate skill overlap for matching skills
      const jobSkills = job.skills.map((skill: string) => skill.toLowerCase());
      const resumeSkills = parsedData.skills.map((skill: string) => skill.toLowerCase());
      const matchingSkills = jobSkills.filter((skill: string) => 
        resumeSkills.some((resumeSkill: string) => 
          resumeSkill.includes(skill) || skill.includes(resumeSkill)
        )
      );

      // Convert Pinecone score (0-1) to percentage and determine confidence
      const scorePercent = (result.score || 0) * 100;
      let confidence = "Low";
      if (scorePercent >= 85) confidence = "High";
      else if (scorePercent >= 70) confidence = "Medium";

      return {
        ...job,
        matchScore: Math.round(scorePercent) / 100,
        matchingSkills: job.skills.filter((skill: string) => 
          matchingSkills.includes(skill.toLowerCase())
        ),
        confidence
      };
    }).filter(Boolean) as Array<Job & { matchScore: number; matchingSkills: string[]; confidence: string }>;

    console.log(`✅ Successfully matched ${matchedJobs.length} jobs with scores`);
    
    // Sort by match score (highest first)
    const sortedMatchedJobs = matchedJobs.sort((a, b) => b.matchScore - a.matchScore);

    // Apply MMR to diversify job recommendations and reduce company clustering
    console.log(`🎯 Applying MMR diversification to select ${limit} jobs from ${sortedMatchedJobs.length} candidates...`);
    const diversifiedMatches = applyMMR(sortedMatchedJobs, 0.7, limit);

    return diversifiedMatches;
      
  } catch (error) {
    console.error('❌ Error in Pinecone-based job matching:', error);
    throw error;
  }
}
