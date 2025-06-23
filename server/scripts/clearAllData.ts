import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { jobs, resumes, jobMatches } from '@shared/schema';
import { pineconeService } from '../services/pineconeService.js';

/**
 * Script to completely clear all data from both Neon database and Pinecone
 * ⚠️  WARNING: This will delete ALL data - use with caution!
 */
async function clearAllData() {
  console.log('🚨 WARNING: This will DELETE ALL DATA from both Neon and Pinecone!');
  console.log('   - All jobs from Neon database');
  console.log('   - All resumes from Neon database'); 
  console.log('   - All job matches from Neon database');
  console.log('   - All vectors from Pinecone index');
  console.log('');
  
  // In a real script, you might want to add a confirmation prompt
  // For now, we'll just add a delay to give time to cancel
  console.log('⏰ Starting cleanup in 5 seconds... Press Ctrl+C to cancel');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    // Initialize database connection
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);
    
    console.log('🗑️  Starting database cleanup...\n');
    
    // Step 1: Clear job matches (has foreign keys)
    console.log('1️⃣ Clearing job matches...');
    const deletedMatches = await db.delete(jobMatches).returning();
    console.log(`   ✅ Deleted ${deletedMatches.length} job matches`);
    
    // Step 2: Clear resumes
    console.log('2️⃣ Clearing resumes...');
    const deletedResumes = await db.delete(resumes).returning();
    console.log(`   ✅ Deleted ${deletedResumes.length} resumes`);
    
    // Step 3: Clear jobs
    console.log('3️⃣ Clearing jobs...');
    const deletedJobs = await db.delete(jobs).returning();
    console.log(`   ✅ Deleted ${deletedJobs.length} jobs`);
    
    // Step 4: Clear Pinecone vectors
    console.log('4️⃣ Clearing Pinecone vectors...');
    try {
      // Get current stats before deletion
      const initialStats = await pineconeService.getIndexStats();
      console.log(`   📊 Found ${initialStats.totalVectorCount || 0} vectors in Pinecone`);
      
      if (initialStats.totalVectorCount && initialStats.totalVectorCount > 0) {
        // Delete all vectors by deleting the entire namespace or all vectors
        await pineconeService.deleteAllVectors();
        console.log('   ✅ Cleared all vectors from Pinecone');
        
        // Verify deletion
        const finalStats = await pineconeService.getIndexStats();
        console.log(`   📊 Remaining vectors: ${finalStats.totalVectorCount || 0}`);
      } else {
        console.log('   ℹ️  No vectors to delete in Pinecone');
      }
    } catch (error) {
      console.error('   ❌ Error clearing Pinecone vectors:', error);
      console.log('   ⚠️  Continuing with database cleanup...');
    }
    
    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('📊 Summary:');
    console.log(`   • Jobs deleted: ${deletedJobs.length}`);
    console.log(`   • Resumes deleted: ${deletedResumes.length}`);
    console.log(`   • Job matches deleted: ${deletedMatches.length}`);
    console.log(`   • Pinecone vectors: Cleared`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Add some safety checks
if (process.env.NODE_ENV === 'production') {
  console.error('🚨 This script should not be run in production!');
  process.exit(1);
}

clearAllData().catch(console.error);
