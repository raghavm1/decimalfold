#!/usr/bin/env node
import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';

async function fetchVectorsByTitle() {
  try {
    console.log('🔍 Fetching vectors from Pinecone...');
    
    // Check environment variables
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY environment variable is required');
    }
    
    const indexName = process.env.PINECONE_INDEX_NAME || 'decimalfold';
    console.log(`📊 Using index: ${indexName}`);
    
    // Initialize Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    
    const index = pinecone.index(indexName);
    
    // Get index stats first
    console.log('\n📈 Getting index statistics...');
    const stats = await index.describeIndexStats();
    console.log(`   Total records: ${stats.totalRecordCount}`);
    console.log(`   Dimension: ${stats.dimension}`);
    console.log(`   Index fullness: ${stats.indexFullness}`);
    
    // Query with a dummy vector to get sample results (we just want metadata)
    console.log('\n🔍 Fetching sample vectors...');
    const dummyVector = new Array(1536).fill(0); // Create dummy vector with correct dimensions
    
    const queryResponse = await index.query({
      vector: dummyVector,
      topK: 20,
      includeMetadata: true,
      includeValues: false // We don't need the actual vector values, just metadata
    });
    
    console.log(`\n📋 Found ${queryResponse.matches?.length || 0} vectors`);
    
    // Query specifically for "Software Engineer" jobs using metadata filter
    console.log('\n🎯 Querying specifically for "Software Engineer" jobs...');
    
    const softwareEngineerQuery = await index.query({
      vector: dummyVector,
      topK: 50,
      includeMetadata: true,
      includeValues: false,
      filter: {
        title: { $eq: "Key Account Manager" }
      }
    });
    
    console.log(`📊 Found ${softwareEngineerQuery.matches?.length || 0} "Software Engineer" jobs`);
    
    if (softwareEngineerQuery.matches && softwareEngineerQuery.matches.length > 0) {
      console.log('\n👨‍💻 Software Engineer positions:');
      softwareEngineerQuery.matches.forEach((match, index) => {
        console.log(`   ${index + 1}. ID: ${match.id}`);
        console.log(`      Title: ${match.metadata?.title}`);
        console.log(`      Company: ${match.metadata?.company || 'No company'}`);
        console.log(`      Industry: ${match.metadata?.industry || 'No industry'}`);
        console.log(`      Experience: ${match.metadata?.experience_level || 'No experience level'}`);
        console.log(`      Location: ${match.metadata?.location || 'No location'}`);
        console.log(`      Work Type: ${match.metadata?.work_type || 'No work type'}`);
        console.log('');
      });
    } else {
      console.log('❌ No "Software Engineer" jobs found');
      
      // Try a broader search for jobs containing "Software"
      console.log('\n🔍 Searching for jobs containing "Software" in title...');
      const softwareQuery = await index.query({
        vector: dummyVector,
        topK: 20,
        includeMetadata: true,
        includeValues: false,
        filter: {
          title: { $regex: ".*Software.*" }
        }
      });
      
      if (softwareQuery.matches && softwareQuery.matches.length > 0) {
        console.log(`📊 Found ${softwareQuery.matches.length} jobs with "Software" in title:`);
        softwareQuery.matches.slice(0, 10).forEach((match, index) => {
          console.log(`   ${index + 1}. ${match.metadata?.title} at ${match.metadata?.company}`);
        });
      } else {
        console.log('❌ No jobs with "Software" in title found either');
      }
    }
    
    if (queryResponse.matches && queryResponse.matches.length > 0) {
      console.log('\n🏷️  Sample vectors with titles:');
      queryResponse.matches.slice(0, 10).forEach((match, index) => {
        console.log(`   ${index + 1}. ID: ${match.id}`);
        console.log(`      Title: ${match.metadata?.title || 'No title'}`);
        console.log(`      Company: ${match.metadata?.company || 'No company'}`);
        console.log(`      Industry: ${match.metadata?.industry || 'No industry'}`);
        console.log(`      Experience: ${match.metadata?.experience_level || 'No experience level'}`);
        console.log(`      Score: ${match.score?.toFixed(6) || 'No score'}`);
        console.log('');
      });
      
      // Show unique job titles
      console.log('\n� Unique job titles in sample:');
      const uniqueTitles = new Set(
        queryResponse.matches
          .map(match => match.metadata?.title)
          .filter(title => typeof title === 'string')
      );
      Array.from(uniqueTitles).slice(0, 20).forEach((title, index) => {
        console.log(`   ${index + 1}. ${title}`);
      });
      
    } else {
      console.log('❌ No vectors found in the index');
    }
    
    // Try to fetch a specific vector by ID if any exist
    if (queryResponse.matches && queryResponse.matches.length > 0) {
      const firstId = queryResponse.matches[0].id;
      console.log(`\n🎯 Fetching specific vector by ID: ${firstId}`);
      
      try {
        const fetchResponse = await index.fetch([firstId]);
        const vector = fetchResponse.records?.[firstId];
        
        if (vector) {
          console.log(`   ✅ Successfully fetched vector:`);
          console.log(`      ID: ${vector.id}`);
          console.log(`      Values length: ${vector.values?.length || 0}`);
          console.log(`      Metadata: ${JSON.stringify(vector.metadata, null, 2)}`);
        } else {
          console.log(`   ❌ Vector not found`);
        }
      } catch (fetchError) {
        console.error(`   ❌ Error fetching vector:`, fetchError);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
fetchVectorsByTitle()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
