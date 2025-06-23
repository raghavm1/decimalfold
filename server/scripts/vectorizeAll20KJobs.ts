import 'dotenv/config';
import { storage } from '../storage.js';
import { JobVectorService } from '../services/jobVectorService.js';
import { pineconeService } from '../services/pineconeService.js';

async function vectorizeAll20KJobs() {
  console.log('🚀 Starting vectorization of all jobs and uploading to Pinecone...\n');
  
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

    // Step 3: Process jobs in larger batches for efficiency
    console.log('\n3️⃣ Starting vectorization process...');
    const vectorBatchSize = 1000; // Process 20 jobs at a time for vectorization
    const pineconeUploadBatchSize = 1000; // Upload 100 vectors at a time to Pinecone
    const totalBatches = Math.ceil(jobs.length / vectorBatchSize);
    
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let allVectorData: Array<{
      jobId: number;
      vector: number[];
      metadata: any;
    }> = [];

    const startTime = Date.now();

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * vectorBatchSize;
      const endIdx = Math.min(startIdx + vectorBatchSize, jobs.length);
      const batch = jobs.slice(startIdx, endIdx);
      
      console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (jobs ${startIdx + 1}-${endIdx})`);
      
      // Generate vectors for this batch
      for (const job of batch) {
        try {
          console.log(`   🔄 Vectorizing: "${job.title}" at ${job.company}`);
          
          // Generate vector using JobVectorService
          const vector = await JobVectorService.generateJobEmbedding(job);
          
          if (vector && vector.length > 0) {
            allVectorData.push({
              jobId: job.id,
              vector: vector,
              metadata: {
                title: job.title,
                company: job.company,
                companySize: job.companySize,
                location: job.location,
                experienceLevel: job.experienceLevel,
                workType: job.workType,
                industry: job.industry,
                skills: job.skills,
                salaryMin: job.salaryMin,
                salaryMax: job.salaryMax
              }
            });
            successCount++;
          } else {
            console.log(`   ⚠️  Empty vector for job ${job.id}`);
            errorCount++;
          }
          
          processedCount++;
          
        } catch (error) {
          console.error(`   ❌ Error vectorizing job ${job.id}:`, error);
          errorCount++;
          processedCount++;
        }
      }
      
      // Upload to Pinecone in batches when we have enough vectors
      if (allVectorData.length >= pineconeUploadBatchSize || batchIndex === totalBatches - 1) {
        if (allVectorData.length > 0) {
          console.log(`\n🔼 Uploading ${allVectorData.length} vectors to Pinecone...`);
          try {
            await pineconeService.upsertJobVectorsBatch(allVectorData);
            console.log(`   ✅ Successfully uploaded ${allVectorData.length} vectors`);
            allVectorData = []; // Clear the batch
          } catch (error) {
            console.error(`   ❌ Error uploading vectors to Pinecone:`, error);
          }
        }
      }
      
      // Progress report
      const elapsedTime = (Date.now() - startTime) / 1000;
      const jobsPerSecond = Math.round(processedCount / elapsedTime);
      const estimatedTotal = jobs.length / jobsPerSecond;
      const remainingTime = Math.max(0, Math.round(estimatedTotal - elapsedTime));
      
      console.log(`\n📊 Progress: ${processedCount}/${jobs.length} jobs processed`);
      console.log(`   ✅ Successful: ${successCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);
      console.log(`   ⏱️  Speed: ${jobsPerSecond} jobs/second`);
      console.log(`   ⏰ ETA: ~${remainingTime}s remaining`);
    }

    // Step 4: Final verification
    console.log('\n4️⃣ Verifying Pinecone upload...');
    try {
      const finalStats = await pineconeService.getIndexStats();
      console.log(`   📊 Final vectors in Pinecone: ${finalStats.totalVectorCount || 0}`);
    } catch (error) {
      console.log('   ⚠️  Could not get final stats');
    }

    const totalTime = (Date.now() - startTime) / 1000;
    const avgJobsPerSecond = Math.round(jobs.length / totalTime);

    console.log('\n🎉 Vectorization completed!\n');
    console.log('📊 Final Summary:');
    console.log(`   • Total jobs processed: ${processedCount}`);
    console.log(`   • Successfully vectorized: ${successCount}`);
    console.log(`   • Errors: ${errorCount}`);
    console.log(`   • Total time: ${Math.round(totalTime)}s (${Math.round(totalTime / 60)}m)`);
    console.log(`   • Average speed: ${avgJobsPerSecond} jobs/second`);
    console.log(`   • Success rate: ${Math.round((successCount / processedCount) * 100)}%`);
    
    if (errorCount > 0) {
      console.log(`\n⚠️  ${errorCount} jobs failed to vectorize. You may want to retry these.`);
    }
    
    console.log('\n✅ Jobs are now ready for similarity matching!');
    
  } catch (error) {
    console.error('❌ Error during vectorization:', error);
    process.exit(1);
  }
}

vectorizeAll20KJobs().catch(console.error);
