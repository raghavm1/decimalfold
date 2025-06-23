import 'dotenv/config';
import { DiverseJobGenerator } from '../services/enhancedJobGenerator.js';
import { storage } from '../storage.js';

async function generate20KJobs() {
  console.log('🚀 Starting generation of 20,000 diverse jobs with realistic company distribution...\n');
  console.log('⏰ This will take approximately 10-15 minutes to complete.\n');
  
  try {
    const totalJobs = 20000;
    const batchSize = 1000; // Generate in smaller batches to avoid memory issues
    const reportInterval = 2000; // Report progress every 2K jobs
    
    let totalInserted = 0;
    const startTime = Date.now();
    
    // Track diversity metrics
    const titleTracker = new Set<string>();
    const companyTracker = new Set<string>();
    const industryTracker = new Set<string>();
    const companySizeTracker = new Set<string>();
    
    console.log(`📊 Processing ${totalJobs} jobs in batches of ${batchSize}...\n`);
    
    for (let batchStart = 0; batchStart < totalJobs; batchStart += batchSize) {
      const currentBatchSize = Math.min(batchSize, totalJobs - batchStart);
      
      console.log(`🔄 Generating batch ${Math.floor(batchStart / batchSize) + 1}/${Math.ceil(totalJobs / batchSize)} (${currentBatchSize} jobs)...`);
      
      // Generate batch using the enhanced company distribution logic
      const jobBatch = await DiverseJobGenerator.generateJobBatchWithCompanyDistribution(currentBatchSize);
      
      // Track diversity metrics
      jobBatch.forEach(job => {
        titleTracker.add(job.title);
        companyTracker.add(job.company);
        industryTracker.add(job.industry);
        if (job.companySize) companySizeTracker.add(job.companySize);
      });
      
      // Insert batch into storage
      console.log(`💾 Saving batch to database...`);
      for (const jobItem of jobBatch) {
        await storage.createJob(jobItem);
        totalInserted++;
      }
      
      // Progress report
      if (totalInserted % reportInterval === 0 || totalInserted === totalJobs) {
        const elapsedTime = (Date.now() - startTime) / 1000;
        const jobsPerSecond = Math.round(totalInserted / elapsedTime);
        const estimatedTotal = totalJobs / jobsPerSecond;
        const remainingTime = Math.max(0, Math.round(estimatedTotal - elapsedTime));
        
        console.log(`\n✅ Progress: ${totalInserted.toLocaleString()}/${totalJobs.toLocaleString()} jobs`);
        console.log(`   📈 Speed: ${jobsPerSecond} jobs/second`);
        console.log(`   ⏰ Elapsed: ${Math.round(elapsedTime)}s, Remaining: ~${remainingTime}s`);
        console.log(`   🎯 Diversity: ${titleTracker.size} titles, ${companyTracker.size} companies, ${industryTracker.size} industries`);
        console.log('');
      }
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    const avgJobsPerSecond = Math.round(totalJobs / totalTime);
    
    console.log('🎉 Job generation completed successfully!\n');
    console.log('📊 Final Statistics:');
    console.log(`   • Total jobs generated: ${totalJobs.toLocaleString()}`);
    console.log(`   • Total time: ${Math.round(totalTime)}s (${Math.round(totalTime / 60)}m ${Math.round(totalTime % 60)}s)`);
    console.log(`   • Average speed: ${avgJobsPerSecond} jobs/second`);
    console.log(`   • Unique job titles: ${titleTracker.size}`);
    console.log(`   • Unique companies: ${companyTracker.size}`);
    console.log(`   • Unique industries: ${industryTracker.size}`);
    console.log(`   • Company sizes: ${companySizeTracker.size}`);
    
    // Show top companies with most jobs
    const allJobs = await storage.getAllJobs();
    const companyJobCounts = allJobs.reduce((acc, job) => {
      acc[job.company] = (acc[job.company] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCompanies = Object.entries(companyJobCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10);
    
    console.log('\n🏢 Top 10 companies by job count:');
    topCompanies.forEach(([company, count], index) => {
      console.log(`   ${index + 1}. ${company}: ${count} jobs`);
    });
    
    console.log('\n✅ Ready for vectorization! Run the vectorizeAllJobs script next.');
    
  } catch (error) {
    console.error('❌ Error during job generation:', error);
    process.exit(1);
  }
}

generate20KJobs().catch(console.error);
