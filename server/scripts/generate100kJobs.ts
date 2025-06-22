import { DiverseJobGenerator } from '../services/enhancedJobGenerator.js';
import { storage } from '../storage.js';

async function generate100KJobs() {
  console.log('🚀 Starting generation of 100,000 diverse jobs for production demo...\n');
  console.log('⏰ This will take approximately 5-10 minutes to complete.\n');
  
  try {
    const totalJobs = 100000;
    const batchSize = 1000; // Generate and insert in chunks
    const reportInterval = 5000; // Report progress every 5K jobs
    
    let totalInserted = 0;
    const startTime = Date.now();
    
    // Track diversity metrics
    const titleTracker = new Set<string>();
    const companyTracker = new Set<string>();
    const industryTracker = new Set<string>();
    
    console.log(`📊 Processing ${totalJobs} jobs in batches of ${batchSize}...\n`);
    
    for (let batchStart = 0; batchStart < totalJobs; batchStart += batchSize) {
      const currentBatchSize = Math.min(batchSize, totalJobs - batchStart);
      
      // Generate batch
      const jobBatch = await DiverseJobGenerator.generateJobBatch(currentBatchSize);
      
      // Track diversity
      jobBatch.forEach(job => {
        titleTracker.add(job.title);
        companyTracker.add(job.company);
        industryTracker.add(job.industry);
      });
      
      // Insert batch into storage
      for (const jobItem of jobBatch) {
        await storage.createJob(jobItem);
        totalInserted++;
      }
      
      // Progress report
      if (totalInserted % reportInterval === 0 || totalInserted === totalJobs) {
        const elapsedTime = (Date.now() - startTime) / 1000;
        const jobsPerSecond = Math.round(totalInserted / elapsedTime);
        const estimatedTotal = totalJobs / jobsPerSecond;
        const remainingTime = Math.round(estimatedTotal - elapsedTime);
        
        console.log(`✅ Progress: ${totalInserted.toLocaleString()}/${totalJobs.toLocaleString()} jobs`);
        console.log(`   📈 Speed: ${jobsPerSecond} jobs/second`);
        console.log(`   ⏱️  Elapsed: ${Math.round(elapsedTime)}s | ETA: ${remainingTime}s remaining`);
        console.log(`   🎯 Diversity: ${titleTracker.size} titles, ${companyTracker.size} companies, ${industryTracker.size} industries`);
        console.log('');
      }
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    
    console.log('🎉 SUCCESS! 100,000 diverse jobs generated and stored!\n');
    console.log('📊 FINAL STATISTICS:');
    console.log('─'.repeat(50));
    console.log(`✅ Total jobs created: ${totalInserted.toLocaleString()}`);
    console.log(`🎯 Unique job titles: ${titleTracker.size}`);
    console.log(`🏢 Unique companies: ${companyTracker.size}`);
    console.log(`🏭 Industries covered: ${industryTracker.size}`);
    console.log(`⏱️  Total time: ${Math.round(totalTime)}s (${Math.round(totalTime/60)}m ${Math.round(totalTime%60)}s)`);
    console.log(`📈 Average speed: ${Math.round(totalInserted / totalTime)} jobs/second`);
    
    // Show sample diversity
    console.log('\n📋 DIVERSITY SAMPLE:');
    console.log('─'.repeat(50));
    
    // Get all jobs to show final diversity
    const allJobs = await storage.getAllJobs();
    
    // Sample different categories
    const engineering = allJobs.filter(j => j.industry?.includes('Technology') || j.industry?.includes('Software')).slice(0, 3);
    const business = allJobs.filter(j => j.industry?.includes('Finance') || j.industry?.includes('Sales')).slice(0, 3);
    const other = allJobs.filter(j => !j.industry?.includes('Technology') && !j.industry?.includes('Software') && !j.industry?.includes('Finance') && !j.industry?.includes('Sales')).slice(0, 3);
    
    console.log('\n🔧 TECH ROLES:');
    engineering.forEach(job => console.log(`   ${job.title} at ${job.company} - $${job.salaryMin?.toLocaleString()}-$${job.salaryMax?.toLocaleString()}`));
    
    console.log('\n💼 BUSINESS ROLES:');
    business.forEach(job => console.log(`   ${job.title} at ${job.company} - $${job.salaryMin?.toLocaleString()}-$${job.salaryMax?.toLocaleString()}`));
    
    console.log('\n🌟 OTHER ROLES:');
    other.forEach(job => console.log(`   ${job.title} at ${job.company} - $${job.salaryMin?.toLocaleString()}-$${job.salaryMax?.toLocaleString()}`));
    
    console.log('\n🚀 Ready for vector similarity testing with 100K diverse jobs!');
    
  } catch (error) {
    console.error('\n❌ Error generating jobs:', error);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('   1. Check if the server dependencies are installed');
    console.error('   2. Ensure the storage system is properly initialized');
    console.error('   3. Check memory usage - 100K jobs require significant RAM');
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  generate100KJobs()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      console.log('💡 Next steps:');
      console.log('   1. Test job matching with a resume upload');
      console.log('   2. Implement vector database integration');
      console.log('   3. Optimize similarity search performance');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}
