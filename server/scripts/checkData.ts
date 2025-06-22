import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function checkDatabaseData() {
  console.log('📊 Checking database data...\n');
  
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    // Count records in each table
    const jobCount = await sql`SELECT COUNT(*) as count FROM jobs`;
    const resumeCount = await sql`SELECT COUNT(*) as count FROM resumes`;
    const matchCount = await sql`SELECT COUNT(*) as count FROM job_matches`;
    
    console.log('📈 Database Record Counts:');
    console.log(`   📝 Jobs: ${jobCount[0].count}`);
    console.log(`   📄 Resumes: ${resumeCount[0].count}`);
    console.log(`   🔗 Job Matches: ${matchCount[0].count}`);
    
    if (jobCount[0].count > 0) {
      console.log('\n🔍 Sample Jobs from Database:');
      const sampleJobs = await sql`
        SELECT title, company, location, industry, experience_level, salary_min, salary_max 
        FROM jobs 
        ORDER BY id 
        LIMIT 5
      `;
      
      sampleJobs.forEach((job, index) => {
        console.log(`\n   ${index + 1}. ${job.title}`);
        console.log(`      🏢 ${job.company} | 📍 ${job.location}`);
        console.log(`      🏭 ${job.industry} | 💼 ${job.experience_level}`);
        console.log(`      💰 $${job.salary_min?.toLocaleString()} - $${job.salary_max?.toLocaleString()}`);
      });
      
      // Industry distribution
      console.log('\n🏭 Top Industries:');
      const industries = await sql`
        SELECT industry, COUNT(*) as count 
        FROM jobs 
        GROUP BY industry 
        ORDER BY count DESC 
        LIMIT 10
      `;
      
      industries.forEach(industry => {
        console.log(`   ${industry.industry}: ${industry.count} jobs`);
      });
    }
    
    console.log('\n✅ Database data check completed!');
    
  } catch (error) {
    console.error('❌ Error checking database data:', error);
    process.exit(1);
  }
}

// Run the check
if (import.meta.url === `file://${process.argv[1]}`) {
  checkDatabaseData()
    .then(() => {
      console.log('\n🎉 Data check completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Data check failed:', error);
      process.exit(1);
    });
}

export { checkDatabaseData };
