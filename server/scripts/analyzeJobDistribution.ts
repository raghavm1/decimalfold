import 'dotenv/config';
import { storage } from '../storage.js';

async function analyzeJobDistribution() {
  console.log('📊 Analyzing Job Database Distribution\n');

  try {
    const allJobs = await storage.getAllJobs();
    console.log(`📈 Total jobs in database: ${allJobs.length}`);

    if (allJobs.length === 0) {
      console.log('❌ No jobs found in database');
      return;
    }

    // Analyze by industry
    const industryDistribution = allJobs.reduce((acc, job) => {
      acc[job.industry] = (acc[job.industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n🏭 Distribution by Industry:');
    Object.entries(industryDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([industry, count]) => {
        const percentage = ((count / allJobs.length) * 100).toFixed(1);
        console.log(`   ${industry}: ${count} jobs (${percentage}%)`);
      });

    // Analyze job titles for tech bias
    const techKeywords = ['engineer', 'developer', 'software', 'technical', 'programming', 'coding'];
    const techJobs = allJobs.filter(job => 
      techKeywords.some(keyword => job.title.toLowerCase().includes(keyword))
    );

    const techPercentage = ((techJobs.length / allJobs.length) * 100).toFixed(1);
    console.log(`\n⚙️  Tech-related jobs: ${techJobs.length}/${allJobs.length} (${techPercentage}%)`);

    // Analyze by experience level
    const experienceDistribution = allJobs.reduce((acc, job) => {
      acc[job.experienceLevel] = (acc[job.experienceLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n💼 Distribution by Experience Level:');
    Object.entries(experienceDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([level, count]) => {
        const percentage = ((count / allJobs.length) * 100).toFixed(1);
        console.log(`   ${level}: ${count} jobs (${percentage}%)`);
      });

    // Sample non-tech jobs
    const nonTechJobs = allJobs.filter(job => 
      !techKeywords.some(keyword => job.title.toLowerCase().includes(keyword))
    );

    console.log(`\n🎯 Sample Non-Tech Jobs (${nonTechJobs.length} total):`);
    nonTechJobs.slice(0, 10).forEach(job => {
      console.log(`   • ${job.title} at ${job.company} (${job.industry})`);
    });

    // Analysis and recommendations
    console.log('\n📋 Analysis Summary:');
    if (techJobs.length / allJobs.length > 0.5) {
      console.log('⚠️  HIGH TECH BIAS DETECTED:');
      console.log('   • >50% of jobs are tech-related');
      console.log('   • This explains why non-tech resumes get tech job matches');
      console.log('   • Vector similarity will naturally favor tech content');
    } else {
      console.log('✅ Good job diversity - tech bias likely from other sources');
    }

    console.log('\n💡 Recommendations:');
    if (techJobs.length / allJobs.length > 0.4) {
      console.log('1. Add more non-tech jobs to balance the dataset');
      console.log('2. Use industry filtering in vector search');
      console.log('3. Implement industry-specific vector strategies');
      console.log('4. Consider separate indices for different job categories');
    }

    console.log('5. Test the improved resume parsing prompt');
    console.log('6. Use metadata filtering in Pinecone searches');
    console.log('7. Implement confidence scoring based on industry match');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

// Run the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeJobDistribution()
    .then(() => {
      console.log('\n✅ Job distribution analysis completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    });
}

export { analyzeJobDistribution };
