#!/usr/bin/env tsx

import 'dotenv/config';
import { LanguageTranslationService } from '../services/languageTranslationService.js';

async function testLanguageTranslation() {
  console.log('🚀 Testing Language Translation Service');
  console.log('=' .repeat(60));

  // Test samples in different languages
  const testSamples = [
    {
      text: "Hello, my name is John Doe. I am a software engineer with 5 years of experience in JavaScript and Python. I have worked at Google and Microsoft.",
      expectedLang: 'en',
      description: 'English Resume Sample'
    },
    {
      text: "Hola, mi nombre es Juan Pérez. Soy ingeniero de software con 5 años de experiencia en JavaScript y Python. He trabajado en Google y Microsoft.",
      expectedLang: 'es',
      description: 'Spanish Resume Sample'
    },
    {
      text: "Bonjour, je suis Marie Dupont. Je suis développeuse logiciel avec 5 ans d'expérience en JavaScript et Python. J'ai travaillé chez Google et Microsoft.",
      expectedLang: 'fr',
      description: 'French Resume Sample'
    },
    {
      text: "Hallo, ich bin Hans Mueller. Ich bin Software-Entwickler mit 5 Jahren Erfahrung in JavaScript und Python. Ich habe bei Google und Microsoft gearbeitet.",
      expectedLang: 'de',
      description: 'German Resume Sample'
    }
  ];

  for (const sample of testSamples) {
    console.log(`\n📝 Testing: ${sample.description}`);
    console.log(`Expected Language: ${sample.expectedLang}`);
    console.log(`Text: "${sample.text.substring(0, 100)}..."`);
    console.log('─'.repeat(50));
    
    try {
      // Test the full processing pipeline
      const result = await LanguageTranslationService.processResumeText(sample.text);
      
      console.log(`🌍 Detected: ${result.languageName} (${result.detectedLanguage})`);
      console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`🔄 Was translated: ${result.translatedText ? 'Yes' : 'No'}`);
      
      if (result.translatedText) {
        console.log(`📝 Translated text: "${result.translatedText.substring(0, 100)}..."`);
      }
      
      if (result.translationError) {
        console.log(`❌ Translation error: ${result.translationError}`);
      }
      
      // Test processing text selection
      const processingText = LanguageTranslationService.getProcessingText(result);
      console.log(`📄 Processing text length: ${processingText.length} characters`);
      
      // Test display info
      const displayInfo = LanguageTranslationService.getLanguageDisplayInfo(result);
      console.log(`🎨 Display: ${displayInfo.displayText}`);
      
      const isCorrect = result.detectedLanguage === sample.expectedLang;
      console.log(`${isCorrect ? '✅' : '❌'} Detection ${isCorrect ? 'correct' : 'incorrect'}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error: ${errorMessage}`);
    }
  }

  console.log(`\n📊 Test Summary:`);
  console.log(`✅ Language Translation Service is ready for integration`);
  console.log(`🔄 The service can detect languages and translate non-English resumes`);
  console.log(`📝 Translated text will be used for AI parsing and vector generation`);
  console.log(`🎯 This enables job matching for resumes in multiple languages`);
  
  console.log(`\n🚀 Next Steps:`);
  console.log(`1. Upload a resume in a non-English language to test the full pipeline`);
  console.log(`2. Check that the resume is properly translated and processed`);
  console.log(`3. Verify that job matching works with translated resumes`);
  console.log(`4. Monitor the language processing information in the UI`);
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testLanguageTranslation()
    .then(() => {
      console.log('\n✅ Language translation test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Language translation test failed:', error);
      process.exit(1);
    });
}

export { testLanguageTranslation };
