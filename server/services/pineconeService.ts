import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';

export class PineconeService {
  private pinecone: Pinecone;
  private indexName: string;

  constructor() {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY environment variable is required');
    }
    
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    
    // Update to use 1536 dimensions for OpenAI ada-002 embeddings
    this.indexName = 'decimalfold';
  }

  async upsertJobVectorsBatch(vectors: Array<{
    jobId: number;
    vector: number[];
    metadata: any;
  }>): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      
      const upsertData = vectors.map(({ jobId, vector, metadata }) => ({
        id: `job_${jobId}`,
        values: vector,
        metadata: {
          job_id: jobId,
          title: metadata.title,
          company: metadata.company,
          location: metadata.location,
          experience_level: metadata.experienceLevel,
          work_type: metadata.workType,
          industry: metadata.industry
        }
      }));

      // Pinecone recommends batches of 100 or fewer
      const batchSize = 100;
      for (let i = 0; i < upsertData.length; i += batchSize) {
        const batch = upsertData.slice(i, i + batchSize);
        await index.upsert(batch);
        console.log(`Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(upsertData.length / batchSize)}`);
      }
    } catch (error) {
      console.error('Error upserting job vectors batch:', error);
      throw error;
    }
  }

  async getIndexStats(): Promise<{ totalVectorCount?: number }> {
    try {
      const index = this.pinecone.index(this.indexName);
      const stats = await index.describeIndexStats();
      return {
        totalVectorCount: stats.totalRecordCount
      };
    } catch (error) {
      console.error('Error getting index stats:', error);
      throw error;
    }
  }

  async deleteAllVectors(): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      // Delete all vectors by not providing any IDs (deletes everything)
      await index.deleteAll();
      console.log('All vectors deleted from Pinecone index');
    } catch (error) {
      console.error('Error deleting all vectors:', error);
      throw error;
    }
  }

  async deleteJobVectors(jobIds: number[]): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      const vectorIds = jobIds.map(id => `job_${id}`);
      
      // Delete in batches of 1000 (Pinecone limit)
      const batchSize = 1000;
      for (let i = 0; i < vectorIds.length; i += batchSize) {
        const batch = vectorIds.slice(i, i + batchSize);
        await index.deleteMany(batch);
        console.log(`Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectorIds.length / batchSize)}`);
      }
    } catch (error) {
      console.error('Error deleting job vectors:', error);
      throw error;
    }
  }

  async searchSimilarJobs(resumeVector: number[], options: {
    topK?: number;
    filter?: Record<string, any>;
    includeMetadata?: boolean;
  } = {}): Promise<Array<{
    id: string;
    score: number | undefined;
    metadata?: any;
  }>> {
    try {
      const index = this.pinecone.index(this.indexName);
      
      const queryOptions: any = {
        vector: resumeVector,
        topK: options.topK || 20,
        includeMetadata: options.includeMetadata !== false
      };

      if (options.filter) {
        queryOptions.filter = options.filter;
      }

      const results = await index.query(queryOptions);
      
      return (results.matches || []).map(match => ({
        id: match.id || '',
        score: match.score,
        metadata: match.metadata
      }));
    } catch (error) {
      console.error('Error searching similar jobs:', error);
      throw error;
    }
  }
}

export const pineconeService = new PineconeService();