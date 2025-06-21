import type { Job, Resume, ParsedResumeData } from "@shared/schema";

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
  
  const matchingSkills = jobSkills.filter(skill => 
    resumeSkills.some(resumeSkill => 
      resumeSkill.includes(skill) || skill.includes(resumeSkill)
    )
  );

  const skillOverlapScore = matchingSkills.length / Math.max(jobSkills.length, 1);

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

  // Combine scores with weights
  const finalScore = (
    vectorScore * 0.5 +
    skillOverlapScore * 0.3 +
    experienceScore * 0.2
  );

  // Determine confidence level
  let confidence = "Low";
  if (finalScore >= 0.8) confidence = "High";
  else if (finalScore >= 0.6) confidence = "Medium";

  return {
    matchScore: Math.round(finalScore * 100) / 100,
    matchingSkills: job.skills.filter(skill => 
      matchingSkills.includes(skill.toLowerCase())
    ),
    confidence
  };
}

export function findTopMatches(
  jobs: Job[],
  resume: Resume,
  parsedData: ParsedResumeData,
  limit: number = 5
): Array<Job & { matchScore: number; matchingSkills: string[]; confidence: string }> {
  const matches = jobs.map(job => {
    const matchResult = calculateJobMatch(job, resume, parsedData);
    return {
      ...job,
      ...matchResult
    };
  });

  // Sort by match score in descending order
  matches.sort((a, b) => b.matchScore - a.matchScore);

  return matches.slice(0, limit);
}
