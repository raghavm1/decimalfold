import { detect } from 'langdetect';
import { translate } from 'googletrans';
import { PDFService } from '../services/pdfService.js';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import zlib from 'zlib';

// Language code to name mapping for better display
const LANGUAGE_NAMES: { [key: string]: string } = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'da': 'Danish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'pl': 'Polish',
  'cs': 'Czech',
  'hu': 'Hungarian',
  'tr': 'Turkish',
  'th': 'Thai',
  'vi': 'Vietnamese'
};

interface LanguageDetectionResult {
  originalText: string;
  detectedLanguage: string;
  languageName: string;
  confidence: number;
  translatedText?: string;
  translationError?: string;
}

async function detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
  try {
    const result = detect(text);
    // langdetect returns an array of results, take the most confident one
    const mostConfident = Array.isArray(result) ? result[0] : result;
    
    // Handle different return types from langdetect
    if (typeof mostConfident === 'string') {
      return {
        language: mostConfident,
        confidence: 1.0
      };
    } else if (mostConfident && typeof mostConfident === 'object') {
      return {
        language: (mostConfident as any).lang || 'unknown',
        confidence: (mostConfident as any).prob || 1.0
      };
    }
    
    return { language: 'unknown', confidence: 0 };
  } catch (error) {
    console.error('Language detection error:', error);
    return { language: 'unknown', confidence: 0 };
  }
}

async function translateToEnglish(text: string, sourceLang: string): Promise<string> {
  try {
    if (sourceLang === 'en' || sourceLang === 'unknown') {
      return text; // No translation needed
    }

    console.log(`Translating from ${sourceLang} to English...`);
    
    // Split text into chunks if it's too long (Google Translate has limits)
    const maxChunkSize = 4000;
    if (text.length <= maxChunkSize) {
      const result = await translate(text, { from: sourceLang, to: 'en' });
      return result.text;
    }

    // Handle long text by splitting into chunks
    const chunks = [];
    for (let i = 0; i < text.length; i += maxChunkSize) {
      chunks.push(text.substring(i, i + maxChunkSize));
    }

    const translatedChunks = [];
    for (const chunk of chunks) {
      const result = await translate(chunk, { from: sourceLang, to: 'en' });
      translatedChunks.push(result.text);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return translatedChunks.join(' ');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Translation failed: ${errorMessage}`);
  }
}

/**
 * Extract text from DOCX file using built-in Node.js modules
 * DOCX is essentially a ZIP file with XML content
 */
async function extractTextFromDOCX(filePath: string): Promise<string> {
  try {
    console.log('📄 Extracting text from DOCX using built-in modules...');
    
    // Read the DOCX file as buffer
    const docxBuffer = fs.readFileSync(filePath);
    
    // DOCX files are ZIP archives, but we need to manually parse the ZIP structure
    // This is a simplified approach that looks for the document.xml content
    
    // Convert buffer to string and look for XML content patterns
    const bufferStr = docxBuffer.toString('binary');
    
    // Look for the document.xml content within the ZIP structure
    // DOCX files contain the main text in word/document.xml
    const xmlStart = bufferStr.indexOf('<?xml');
    const xmlEnd = bufferStr.lastIndexOf('</w:document>');
    
    if (xmlStart === -1 || xmlEnd === -1) {
      throw new Error('Could not find document content in DOCX file');
    }
    
    const xmlContent = bufferStr.substring(xmlStart, xmlEnd + '</w:document>'.length);
    
    // Extract text from XML tags
    // Remove XML tags and get text content
    let text = xmlContent
      .replace(/<[^>]*>/g, ' ') // Remove all XML tags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
    if (text.length < 10) {
      throw new Error('Extracted text is too short, DOCX parsing may have failed');
    }
    
    console.log(`✅ Successfully extracted ${text.length} characters from DOCX`);
    return text;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`DOCX extraction failed: ${errorMessage}`);
  }
}

/**
 * Extract text from various file types
 */
async function extractTextFromFile(filePath: string): Promise<{ text: string; fileType: string }> {
  const ext = path.extname(filePath).toLowerCase();
  
  try {
    switch (ext) {
      case '.pdf':
        const pdfResult = await PDFService.extractTextFromFile(filePath);
        return { text: pdfResult.text, fileType: 'PDF' };
        
      case '.docx':
        const docxText = await extractTextFromDOCX(filePath);
        return { text: docxText, fileType: 'DOCX' };
        
      case '.txt':
        const txtContent = fs.readFileSync(filePath, 'utf-8');
        return { text: txtContent, fileType: 'TEXT' };
        
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to extract text from ${ext.toUpperCase()} file: ${errorMessage}`);
  }
}

async function processResumeFile(filePath: string): Promise<LanguageDetectionResult> {
  console.log(`\n📄 Processing: ${path.basename(filePath)}`);
  console.log('─'.repeat(50));

  try {
    // Extract text from various file types (PDF, DOCX, TXT)
    const { text: extractedText, fileType } = await extractTextFromFile(filePath);
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error(`No text could be extracted from the ${fileType} file`);
    }

    console.log(`📝 Extracted ${extractedText.length} characters from ${fileType} file`);
    console.log(`📄 all characts: "${extractedText}..."`);

    // Detect language
    const { language: detectedLang, confidence } = await detectLanguage(extractedText);
    const languageName = LANGUAGE_NAMES[detectedLang] || detectedLang;

    console.log(`🌍 Detected language: ${languageName} (${detectedLang}) - Confidence: ${(confidence * 100).toFixed(1)}%`);

    const result: LanguageDetectionResult = {
      originalText: extractedText,
      detectedLanguage: detectedLang,
      languageName,
      confidence
    };

    // Translate if not English
    if (detectedLang !== 'en' && detectedLang !== 'unknown') {
      try {
        const translatedText = await translateToEnglish(extractedText, detectedLang);
        result.translatedText = translatedText;
        
        console.log(`✅ Translation completed`);
        console.log(`📄 Translated: "${translatedText}..."`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.translationError = errorMessage;
        console.log(`❌ Translation failed: ${errorMessage}`);
      }
    } else {
      console.log(`ℹ️  No translation needed (already in English)`);
    }

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error processing ${filePath}:`, errorMessage);
    throw error;
  }
}

async function main() {
  console.log('🚀 Language Detection and Translation Test');
  console.log('=' .repeat(60));

  // Test with sample resume files (you can add your own PDF paths here)
  const testFiles: string[] = [
    // Add paths to your test PDF files here
    // '/Users/raghavmantri/Downloads/NfTR0AQSG9.pdf',
    '/Users/raghavmantri/Documents/Resumes/double/raw/RaghavMantri_resume_balanced.docx'
    // Example: '/Users/yourname/Desktop/spanish-resume.pdf',
    // Example: '/Users/yourname/Desktop/french-resume.pdf',
  ];

  // Test with sample text data if no files provided
  const sampleTexts = [
    {
      text: "Hello, my name is John Doe. I am a software engineer with 5 years of experience in JavaScript and Python.",
      expectedLang: 'en',
      description: 'English Resume Sample'
    },
    {
      text: "Hola, mi nombre es Juan Pérez. Soy ingeniero de software con 5 años de experiencia en JavaScript y Python.",
      expectedLang: 'es',
      description: 'Spanish Resume Sample'
    },
    {
      text: "Bonjour, je suis Marie Dupont. Je suis développeuse logiciel avec 5 ans d'expérience en JavaScript et Python.",
      expectedLang: 'fr',
      description: 'French Resume Sample'
    }
  ];

  // If no test files specified, test with sample texts
  if (testFiles.length === 0) {
    console.log(`
📋 Testing with sample text data first...
For file testing, add file paths to the 'testFiles' array in this script.
Supported formats: PDF (.pdf), Word documents (.docx), and text files (.txt)
    `);
    
    console.log('\n🧪 Testing Language Detection and Translation with Sample Texts');
    console.log('─'.repeat(60));
    
    for (const sample of sampleTexts) {
      console.log(`\n📝 Testing: ${sample.description}`);
      console.log(`Expected Language: ${sample.expectedLang}`);
      console.log(`Text: "${sample.text.substring(0, 100)}..."`);
      
      try {
        // Test language detection
        const { language: detectedLang, confidence } = await detectLanguage(sample.text);
        const languageName = LANGUAGE_NAMES[detectedLang] || detectedLang;
        
        console.log(`🌍 Detected: ${languageName} (${detectedLang}) - Confidence: ${(confidence * 100).toFixed(1)}%`);
        
        // Test translation if not English
        if (detectedLang !== 'en' && detectedLang !== 'unknown') {
          const translated = await translateToEnglish(sample.text, detectedLang);
          console.log(`🔄 Translated: "${translated.substring(0, 100)}..."`);
          console.log(`✅ Translation successful`);
        } else {
          console.log(`ℹ️  No translation needed`);
        }
        
        const isCorrect = detectedLang === sample.expectedLang;
        console.log(`${isCorrect ? '✅' : '❌'} Detection ${isCorrect ? 'correct' : 'incorrect'}`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error: ${errorMessage}`);
      }
    }
    
    console.log(`\n📋 Next Steps:
1. Add file paths to the 'testFiles' array to test with real resume files
2. Supported formats: PDF (.pdf), Word documents (.docx), and text files (.txt)
3. Run: npm run test:language-translation
4. The script will process each file and show language detection/translation results
    `);
    return;
  }

  const results: LanguageDetectionResult[] = [];

  for (const filePath of testFiles) {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        continue;
      }

      const result = await processResumeFile(filePath);
      results.push(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to process ${filePath}:`, errorMessage);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));

  if (results.length === 0) {
    console.log('No files were processed successfully.');
    return;
  }

  results.forEach((result, index) => {
    console.log(`\n${index + 1}. Language: ${result.languageName} (${result.detectedLanguage})`);
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`   Original text length: ${result.originalText.length} chars`);
    if (result.translatedText) {
      console.log(`   Translated text length: ${result.translatedText.length} chars`);
      console.log(`   ✅ Translation successful`);
    } else if (result.translationError) {
      console.log(`   ❌ Translation failed: ${result.translationError}`);
    } else {
      console.log(`   ℹ️  No translation needed`);
    }
  });

  // Show statistics
  const languageStats = results.reduce((acc, result) => {
    acc[result.detectedLanguage] = (acc[result.detectedLanguage] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  console.log(`\n🌍 Language Distribution:`);
  Object.entries(languageStats).forEach(([lang, count]) => {
    const name = LANGUAGE_NAMES[lang] || lang;
    console.log(`   ${name} (${lang}): ${count} file(s)`);
  });

  const successfulTranslations = results.filter(r => r.translatedText).length;
  const failedTranslations = results.filter(r => r.translationError).length;
  
  console.log(`\n📈 Translation Stats:`);
  console.log(`   Successful: ${successfulTranslations}`);
  console.log(`   Failed: ${failedTranslations}`);
  console.log(`   No translation needed: ${results.length - successfulTranslations - failedTranslations}`);
}

// Run the test
main().catch(console.error);

export { detectLanguage, translateToEnglish, processResumeFile };
