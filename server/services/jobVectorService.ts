import { openai } from './openai.js';
import type { Job } from '@shared/schema';

export class JobVectorService {
  /**
   * Generate an optimized embedding for a job posting
   */
  static async generateJobEmbedding(job: Job): Promise<number[]> {
    const jobText = this.createOptimizedJobText(job);
    
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: jobText,
        encoding_format: 'float'
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error(`Error generating embedding for job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Create optimized text for job embedding
   * Prioritizes the most important matching signals
   */
  static createOptimizedJobText(job: Job): string {
    const sections = [
      // 1. Job title and level (high weight for matching)
      `Position: ${job.title} (${job.experienceLevel})`,
      
      // 2. Key requirements (highest weight for matching)
      `Requirements: ${job.requirements}`,
      
      // 3. Tech stack/skills (very important for technical roles)
      job.skills?.length ? `Skills: ${job.skills.join(', ')}` : '',
      
      // 4. Job type and location
      `Type: ${job.workType}. Location: ${job.location}`,
      
      // 5. Company and industry context
      `Company: ${job.company}. Industry: ${job.industry}`,
      
      // 6. Salary range (helps with matching expectations)
      job.salaryMin && job.salaryMax 
        ? `Salary: $${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
        : '',
      
      // 7. Key parts of job description (truncated to avoid noise)
      `Description: ${this.extractKeyDescription(job.description)}`
    ].filter(Boolean);
    
    return sections.join('\n\n');
  }

  /**
   * Extract the most relevant parts of job description
   */
  private static extractKeyDescription(description: string): string {
    // Look for key responsibility sections
    const keywordSections = [
      'Key Responsibilities',
      'Responsibilities',
      'What you\'ll do',
      'Role Overview',
      'About the Role'
    ];
    
    for (const keyword of keywordSections) {
      if (description.includes(keyword)) {
        const section = description.split(keyword)[1];
        if (section) {
          // Take first 400 characters after the keyword
          return section.substring(0, 400).trim();
        }
      }
    }
    
    // If no specific section found, take first 400 characters
    return description.substring(0, 400).trim();
  }

  /**
   * Generate embeddings for multiple jobs in batch
   */
  static async generateJobEmbeddingsBatch(jobs: Job[]): Promise<{ jobId: number; vector: number[] }[]> {
    const results: { jobId: number; vector: number[] }[] = [];
    
    console.log(`🔄 Generating embeddings for ${jobs.length} jobs...`);
    
    // Process in smaller batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (job) => {
        try {
          const vector = await this.generateJobEmbedding(job);
          return { jobId: job.id, vector };
        } catch (error) {
          console.error(`Failed to generate embedding for job ${job.id}:`, error);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      const successfulResults = batchResults.filter(result => result !== null) as { jobId: number; vector: number[] }[];
      results.push(...successfulResults);
      
      console.log(`   ✅ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jobs.length / batchSize)} (${results.length}/${jobs.length} completed)`);
      
      // Add small delay to respect rate limits
      if (i + batchSize < jobs.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`🎉 Generated ${results.length} embeddings successfully!`);
    return results;
  }

  /**
   * Test embedding generation with sample text
   */
  static async testEmbedding(): Promise<void> {
    const testText = "Senior Software Engineer position requiring React, Node.js, and TypeScript experience";
    
    try {
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: testText,
        encoding_format: 'float'
      });
      
      console.log('✅ Embedding test successful!');
      console.log(`   📊 Dimensions: ${embedding.data[0].embedding.length}`);
      console.log(`   🔢 First 5 values: [${embedding.data[0].embedding.slice(0, 5).map((n: number) => n.toFixed(4)).join(', ')}...]`);
    } catch (error) {
      console.error('❌ Embedding test failed:', error);
      throw error;
    }
  }
}
