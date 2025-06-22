import { DiverseJobGenerator } from '../services/enhancedJobGenerator.js';
import { jobs } from '@shared/schema';
import { storage } from '../storage.js';

async function generate1KJobs() {
  console.log('🚀 Starting generation of 1,000 diverse jobs for testing...\n');
  
  try {
    // Generate 1K jobs
    const jobData = await DiverseJobGenerator.generateJobBatch(1000);
    
    console.log('\n📊 Job Generation Summary:');
    console.log(`✅ Total jobs generated: ${jobData.length}`);
    
    // Analyze diversity
    const titleCounts = jobData.reduce((acc, job) => {
      acc[job.title] = (acc[job.title] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const companyCounts = jobData.reduce((acc, job) => {
      acc[job.company] = (acc[job.company] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const industryCounts = jobData.reduce((acc, job) => {
      acc[job.industry] = (acc[job.industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`📈 Unique job titles: ${Object.keys(titleCounts).length}`);
    console.log(`🏢 Unique companies: ${Object.keys(companyCounts).length}`);
    console.log(`🏭 Industries represented: ${Object.keys(industryCounts).length}`);
    
    console.log('\n🔝 Top job titles:');
    Object.entries(titleCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .forEach(([title, count]) => console.log(`   ${title}: ${count} jobs`));
    
    console.log('\n🏢 Top companies:');
    Object.entries(companyCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .forEach(([company, count]) => console.log(`   ${company}: ${count} jobs`));
    
    console.log('\n🏭 Industries:');
    Object.entries(industryCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .forEach(([industry, count]) => console.log(`   ${industry}: ${count} jobs`));
    
    // Insert into storage in batches
    console.log('\n💾 Inserting jobs into storage...');
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < jobData.length; i += batchSize) {
      const batch = jobData.slice(i, i + batchSize);
      
      for (const jobItem of batch) {
        await storage.createJob(jobItem);
        insertedCount++;
      }
      
      console.log(`   Inserted batch: ${insertedCount}/${jobData.length} jobs`);
    }
    
    console.log('\n🎉 Success! 1,000 diverse jobs have been generated and stored in the database.');
    console.log('\n📋 Sample job data:');
    console.log('─'.repeat(50));
    console.log(`Title: ${jobData[0].title}`);
    console.log(`Company: ${jobData[0].company}`);
    console.log(`Location: ${jobData[0].location}`);
    console.log(`Industry: ${jobData[0].industry}`);
    console.log(`Salary: $${jobData[0].salaryMin.toLocaleString()} - $${jobData[0].salaryMax.toLocaleString()}`);
    console.log(`Skills: ${jobData[0].skills.slice(0, 3).join(', ')}...`);
    console.log(`Description preview: ${jobData[0].description.substring(0, 100)}...`);
    
  } catch (error) {
    console.error('❌ Error generating jobs:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  generate1KJobs()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
