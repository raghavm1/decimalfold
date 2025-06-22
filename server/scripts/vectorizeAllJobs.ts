import 'dotenv/config';
import { storage } from '../storage.js';
import { JobVectorService } from '../services/jobVectorService.js';
import { pineconeService } from '../services/pineconeService.js';

async function vectorizeAllJobs() {
  console.log('🚀 Starting full job vectorization and Pinecone upload...\n');
  
  try {
    // Step 1: Get all jobs from the database
    console.log('1️⃣ Fetching all jobs from database...');
    const jobs = await storage.getAllJobs();
    console.log(`   📊 Found ${jobs.length} jobs to vectorize`);
    
    if (jobs.length === 0) {
      console.log('❌ No jobs found. Please run the job generation script first.');
      return;
    }

    // Step 2: Check current Pinecone stats
    console.log('\n2️⃣ Checking current Pinecone index...');
    try {
      const initialStats = await pineconeService.getIndexStats();
      console.log(`   📊 Current vectors in Pinecone: ${initialStats.totalVectorCount || 0}`);
    } catch (error) {
      console.log('   ⚠️  Could not get initial stats, continuing...');
    }

    // Step 3: Process jobs in batches
    console.log('\n3️⃣ Starting vectorization process...');
    const batchSize = 10; // Process 10 jobs at a time to manage API rate limits
    const totalBatches = Math.ceil(jobs.length / batchSize);
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * batchSize;
      const endIdx = Math.min(startIdx + batchSize, jobs.length);
      const batch = jobs.slice(startIdx, endIdx);
      
      console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (jobs ${startIdx + 1}-${endIdx})`);
      
      const vectorData = [];
      
      // Generate vectors for this batch
      for (const job of batch) {
        try {
          console.log(`   🔄 Vectorizing: "${job.title}" at ${job.company}`);
          
          const vector = await JobVectorService.generateJobEmbedding(job);
          
          vectorData.push({
            jobId: job.id,
            vector: vector,
            metadata: {
              title: job.title,
              company: job.company,
              location: job.location,
              experienceLevel: job.experienceLevel,
              workType: job.workType,
              industry: job.industry,
              salaryMin: job.salaryMin,
              salaryMax: job.salaryMax,
              skills: job.skills.slice(0, 10) // Limit skills for metadata
            }
          });
          
          successCount++;
          processedCount++;
          
        } catch (error) {
          console.error(`   ❌ Failed to vectorize job ${job.id}: ${error}`);
          errorCount++;
          processedCount++;
        }
      }
      
      // Upload vectors to Pinecone
      if (vectorData.length > 0) {
        try {
          console.log(`   📤 Uploading ${vectorData.length} vectors to Pinecone...`);
          await pineconeService.upsertJobVectorsBatch(vectorData);
          console.log(`   ✅ Successfully uploaded batch ${batchIndex + 1}`);
        } catch (error) {
          console.error(`   ❌ Failed to upload batch ${batchIndex + 1}:`, error);
          errorCount += vectorData.length;
        }
      }
      
      // Progress update
      console.log(`   📈 Progress: ${processedCount}/${jobs.length} jobs processed`);
      
      // Rate limiting: wait a bit between batches
      if (batchIndex < totalBatches - 1) {
        console.log('   ⏱️  Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Step 4: Final stats and summary
    console.log('\n4️⃣ Checking final Pinecone stats...');
    try {
      const finalStats = await pineconeService.getIndexStats();
      console.log(`   📊 Total vectors in Pinecone: ${finalStats.totalVectorCount || 0}`);
      console.log(`   📊 Index dimension: ${finalStats.dimension || 'unknown'}`);
    } catch (error) {
      console.log('   ⚠️  Could not get final stats');
    }

    // Summary
    console.log('\n🎉 Vectorization Complete!');
    console.log('─'.repeat(50));
    console.log(`📊 Total jobs processed: ${processedCount}`);
    console.log(`✅ Successfully vectorized: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📈 Success rate: ${((successCount / processedCount) * 100).toFixed(1)}%`);
    
    if (successCount > 0) {
      console.log('\n🚀 Next Steps:');
      console.log('   • Test resume matching with vector search');
      console.log('   • Integrate vector search into your job matching API');
      console.log('   • Upload a resume and see the magic! ✨');
    }
    
  } catch (error) {
    console.error('❌ Vectorization process failed:', error);
    process.exit(1);
  }
}

// Run the vectorization
if (import.meta.url === `file://${process.argv[1]}`) {
  vectorizeAllJobs()
    .then(() => {
      console.log('\n✅ Vectorization script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Vectorization script failed:', error);
      process.exit(1);
    });
}

export { vectorizeAllJobs };
