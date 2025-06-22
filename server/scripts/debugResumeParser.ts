import 'dotenv/config';
import { parseResumeWithAI } from '../services/openai.js';

async function debugResumeParser() {
  console.log('🔍 Debugging Resume Parser\n');
  
  // Test different types of resumes
  const testResumes = [
    {
      name: "Software Engineer Resume",
      text: `
John Doe
Senior Software Engineer

EXPERIENCE:
• 5+ years developing web applications with React and Node.js
• Built scalable APIs serving millions of users
• Led engineering teams and mentored junior developers

SKILLS: JavaScript, TypeScript, React, Node.js, AWS, Docker
EDUCATION: BS Computer Science
      `
    },
    {
      name: "Marketing Manager Resume", 
      text: `
Jane Smith
Marketing Manager

EXPERIENCE:
• 7+ years in digital marketing and brand management
• Managed $2M+ annual marketing budgets
• Led campaigns that increased brand awareness by 40%
• Expert in SEO, SEM, social media marketing, and content strategy

SKILLS: Google Analytics, HubSpot, Salesforce, Adobe Creative Suite, 
Facebook Ads, Google Ads, Email Marketing, Content Marketing
EDUCATION: MBA Marketing, BA Communications
      `
    },
    {
      name: "Financial Analyst Resume",
      text: `
Mike Johnson
Senior Financial Analyst

EXPERIENCE:
• 6+ years in financial analysis and investment banking
• Built financial models for M&A transactions worth $500M+
• Performed DCF analysis, comparable company analysis
• Managed client portfolios worth $50M+

SKILLS: Excel, Bloomberg Terminal, SQL, Python, Financial Modeling,
Valuation, Risk Management, Portfolio Analysis
EDUCATION: CFA Charter, MBA Finance, BS Economics
      `
    },
    {
      name: "Sales Representative Resume",
      text: `
Sarah Wilson
Enterprise Sales Representative

EXPERIENCE:
• 5+ years in B2B enterprise sales
• Consistently exceeded quota by 120%+ 
• Closed deals worth $10M+ annually
• Built relationships with C-level executives

SKILLS: Salesforce, HubSpot, Cold calling, Lead generation,
Contract negotiation, CRM management, Pipeline management
EDUCATION: BA Business Administration
      `
    }
  ];

  for (const resume of testResumes) {
    console.log(`\n📄 Testing: ${resume.name}`);
    console.log('─'.repeat(50));
    
    try {
      const parsedData = await parseResumeWithAI(resume.text);
      
      console.log(`✅ Parsed Successfully:`);
      console.log(`   🏷️  Primary Role: ${parsedData.primaryRole}`);
      console.log(`   💼 Experience Level: ${parsedData.experienceLevel}`);
      console.log(`   📅 Years of Experience: ${parsedData.yearsOfExperience}`);
      console.log(`   🏭 Industries: ${parsedData.industries.join(', ')}`);
      console.log(`   🛠️  Skills (${parsedData.skills.length}): ${parsedData.skills.slice(0, 8).join(', ')}${parsedData.skills.length > 8 ? '...' : ''}`);
      
      // Check if it's misclassifying non-tech roles
      const isTechRole = parsedData.primaryRole.toLowerCase().includes('engineer') || 
                        parsedData.primaryRole.toLowerCase().includes('developer') ||
                        parsedData.primaryRole.toLowerCase().includes('software');
      
      const expectedTech = resume.name.toLowerCase().includes('software') || 
                          resume.name.toLowerCase().includes('engineer');
      
      if (isTechRole && !expectedTech) {
        console.log(`   ⚠️  POTENTIAL MISCLASSIFICATION: Classified as tech role when it shouldn't be`);
      } else if (!isTechRole && expectedTech) {
        console.log(`   ⚠️  POTENTIAL MISCLASSIFICATION: Should be tech role but wasn't classified as such`);
      } else {
        console.log(`   ✅ Classification looks correct`);
      }
      
    } catch (error) {
      console.error(`   ❌ Parsing failed: ${error}`);
    }
    
    // Add delay to respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🔧 Common Issues and Solutions:');
  console.log('1. AI model might have bias toward tech roles');
  console.log('2. Generic skills might be getting labeled as "tech"');
  console.log('3. Vector embeddings might be too focused on technical content');
  console.log('4. Need more diverse training examples in the prompt');
  
  console.log('\n💡 Recommended Fixes:');
  console.log('• Update the AI parsing prompt to be more role-agnostic');
  console.log('• Add explicit non-tech role examples in the prompt');
  console.log('• Improve industry classification logic');
  console.log('• Test vector generation for non-tech content');
}

// Run the debug
if (import.meta.url === `file://${process.argv[1]}`) {
  debugResumeParser()
    .then(() => {
      console.log('\n✅ Debug completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Debug failed:', error);
      process.exit(1);
    });
}

export { debugResumeParser };
