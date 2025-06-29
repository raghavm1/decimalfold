import 'dotenv/config';
import OpenAI from "openai";
import type { ParsedResumeData } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

// Export the openai instance for use in other services
export { openai };

export async function parseResumeWithAI(resumeText: string): Promise<ParsedResumeData> {
  try {
    // Truncate resume text for parsing to prevent token limit issues
    const truncatedText = resumeText.length > 8000 ? resumeText.substring(0, 8000) + "..." : resumeText;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert resume parser that can analyze resumes from ALL industries and professions. Analyze the resume text and extract structured information. Return a JSON object with the following fields:

          - skills: array of relevant professional skills (can be technical, business, creative, analytical, etc.)
          - experienceLevel: one of "Entry Level", "Mid-Level", "Senior Level", "Leadership"  
          - primaryRole: the main job role/title of the candidate (e.g., "Marketing Manager", "Financial Analyst", "Sales Representative", "Software Engineer", "HR Director", etc.)
          - industries: array of industries the candidate has worked in (e.g., "Technology", "Finance", "Marketing", "Healthcare", "Education", "Retail", etc.)
          - yearsOfExperience: estimated total years of professional experience as a number

          IMPORTANT GUIDELINES:
          - Do NOT assume every resume is for a technical role
          - Extract skills relevant to the person's actual profession (marketing skills for marketers, financial skills for finance professionals, etc.)
          - Be accurate in identifying the primary role - don't default to "Software Developer"
          - Industries should reflect the actual business sectors the person worked in
          - Skills can include: software tools, methodologies, certifications, domain expertise, soft skills, etc.
          
          EXAMPLES:
          - Marketing professional: skills like "Google Analytics", "SEO", "Content Marketing", "Brand Management"
          - Finance professional: skills like "Financial Modeling", "Excel", "Bloomberg", "Risk Analysis" 
          - Sales professional: skills like "Salesforce", "Lead Generation", "Contract Negotiation", "CRM"
          - HR professional: skills like "Talent Acquisition", "HRIS", "Performance Management", "Compliance"`
        },
        {
          role: "user",
          content: `Parse this resume text:\n\n${truncatedText}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      skills: result.skills || [],
      experienceLevel: result.experienceLevel || "Entry Level",
      primaryRole: result.primaryRole || "Professional", // Changed from "Software Developer"
      industries: result.industries || ["General"],
      yearsOfExperience: result.yearsOfExperience || 0
    };
  } catch (error) {
    console.error("Failed to parse resume with AI:", error);
    throw new Error("Failed to analyze resume content");
  }
}

export async function generateJobVector(job: { title: string; description: string; requirements: string; skills: string[] }): Promise<number[]> {
  try {
    const jobText = `${job.title} ${job.description} ${job.requirements} ${job.skills.join(' ')}`;
    
    // Truncate if too long to prevent token limit issues
    const finalText = jobText.length > 6000 ? jobText.substring(0, 6000) + "..." : jobText;
    
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: finalText,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Failed to generate job vector:", error);
    throw new Error("Failed to generate job vector");
  }
}

export async function generateResumeVector(resumeText: string, parsedData: ParsedResumeData): Promise<number[]> {
  try {
    // Truncate resume text to prevent token limit issues
    // OpenAI ada-002 has ~8192 token limit, roughly 6000 characters
    const truncatedResumeText = resumeText.length > 4000 ? resumeText.substring(0, 4000) + "..." : resumeText;
    const combinedText = `${truncatedResumeText} ${parsedData.skills.join(' ')} ${parsedData.primaryRole} ${parsedData.industries.join(' ')}`;
    
    // Final safety check - if still too long, use just the parsed data
    const finalText = combinedText.length > 6000 ? 
      `${parsedData.skills.join(' ')} ${parsedData.primaryRole} ${parsedData.industries.join(' ')} ${parsedData.experienceLevel}` : 
      combinedText;
    
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: finalText,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Failed to generate resume vector:", error);
    throw new Error("Failed to generate resume vector");
  }
}
