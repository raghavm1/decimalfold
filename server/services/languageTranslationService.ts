import { detect } from 'langdetect';
import { translate } from 'googletrans';

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

export interface LanguageDetectionResult {
  originalText: string;
  detectedLanguage: string;
  languageName: string;
  confidence: number;
  translatedText?: string;
  translationError?: string;
  isEnglish: boolean;
}

/**
 * Language Translation Service
 * Provides language detection and translation capabilities for resume processing
 */
export class LanguageTranslationService {
  
  /**
   * Detect the language of the provided text
   */
  static async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
    try {
      if (!text || text.trim().length === 0) {
        return { language: 'unknown', confidence: 0 };
      }

      console.log('🌍 Detecting language...');
      const result = detect(text);
      
      // langdetect returns an array of results, take the most confident one
      const mostConfident = Array.isArray(result) ? result[0] : result;
      
      // Handle different return types from langdetect
      if (typeof mostConfident === 'string') {
        console.log(`📝 Detected language: ${mostConfident} (confidence: 100%)`);
        return {
          language: mostConfident,
          confidence: 1.0
        };
      } else if (mostConfident && typeof mostConfident === 'object') {
        const lang = (mostConfident as any).lang || 'unknown';
        const confidence = (mostConfident as any).prob || 1.0;
        console.log(`📝 Detected language: ${lang} (confidence: ${(confidence * 100).toFixed(1)}%)`);
        return {
          language: lang,
          confidence: confidence
        };
      }
      
      return { language: 'unknown', confidence: 0 };
    } catch (error) {
      console.error('❌ Language detection error:', error);
      return { language: 'unknown', confidence: 0 };
    }
  }

  /**
   * Translate text from detected language to English
   */
  static async translateToEnglish(text: string, sourceLang: string): Promise<string> {
    try {
      if (sourceLang === 'en' || sourceLang === 'unknown') {
        console.log('ℹ️  No translation needed (already in English or unknown language)');
        return text; // No translation needed
      }

      console.log(`🔄 Translating from ${sourceLang} to English...`);
      
      // Split text into chunks if it's too long (Google Translate has limits)
      const maxChunkSize = 4000;
      if (text.length <= maxChunkSize) {
        const result = await translate(text, { from: sourceLang, to: 'en' });
        console.log(`✅ Translation completed successfully`);
        return result.text;
      }

      // Handle long text by splitting into chunks
      console.log(`📄 Text is long (${text.length} chars), splitting into chunks...`);
      const chunks = [];
      for (let i = 0; i < text.length; i += maxChunkSize) {
        chunks.push(text.substring(i, i + maxChunkSize));
      }

      const translatedChunks = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`   🔄 Translating chunk ${i + 1}/${chunks.length}...`);
        
        const result = await translate(chunk, { from: sourceLang, to: 'en' });
        translatedChunks.push(result.text);
        
        // Small delay to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const fullTranslation = translatedChunks.join(' ');
      console.log(`✅ Translation completed: ${fullTranslation.length} characters`);
      return fullTranslation;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Translation failed: ${errorMessage}`);
      throw new Error(`Translation failed: ${errorMessage}`);
    }
  }

  /**
   * Process resume text for language detection and translation
   * Returns the processed text (translated if needed) and language information
   */
  static async processResumeText(originalText: string): Promise<LanguageDetectionResult> {
    console.log('🚀 Starting language processing for resume...');
    console.log(`📄 Processing ${originalText.length} characters`);

    try {
      // Detect language
      const { language: detectedLang, confidence } = await this.detectLanguage(originalText);
      const languageName = LANGUAGE_NAMES[detectedLang] || detectedLang;
      const isEnglish = detectedLang === 'en';

      console.log(`🌍 Detected: ${languageName} (${detectedLang}) - Confidence: ${(confidence * 100).toFixed(1)}%`);

      const result: LanguageDetectionResult = {
        originalText,
        detectedLanguage: detectedLang,
        languageName,
        confidence,
        isEnglish
      };

      // Translate if not English
      if (!isEnglish && detectedLang !== 'unknown') {
        try {
          console.log('📝 Resume is not in English, starting translation...');
          const translatedText = await this.translateToEnglish(originalText, detectedLang);
          result.translatedText = translatedText;
          
          console.log(`✅ Translation successful: ${translatedText.length} characters`);
          console.log(`📊 Original/Translated ratio: ${(translatedText.length / originalText.length).toFixed(2)}`);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.translationError = errorMessage;
          console.log(`❌ Translation failed: ${errorMessage}`);
          console.log('⚠️  Will proceed with original text');
        }
      } else {
        console.log(`ℹ️  Resume is already in English, no translation needed`);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Language processing failed: ${errorMessage}`);
      
      // Return a fallback result with original text
      return {
        originalText,
        detectedLanguage: 'unknown',
        languageName: 'Unknown',
        confidence: 0,
        isEnglish: true, // Assume English as fallback
        translationError: `Language processing failed: ${errorMessage}`
      };
    }
  }

  /**
   * Get the text to use for AI processing and vectorization
   * Returns translated text if available, otherwise original text
   */
  static getProcessingText(languageResult: LanguageDetectionResult): string {
    if (languageResult.translatedText) {
      console.log('📝 Using translated text for AI processing');
      return languageResult.translatedText;
    }
    
    console.log('📝 Using original text for AI processing');
    return languageResult.originalText;
  }

  /**
   * Get language display information for UI
   */
  static getLanguageDisplayInfo(languageResult: LanguageDetectionResult): {
    displayText: string;
    wasTranslated: boolean;
    confidence: string;
  } {
    const wasTranslated = !!languageResult.translatedText;
    const confidenceText = `${(languageResult.confidence * 100).toFixed(1)}%`;
    
    let displayText = `Detected: ${languageResult.languageName}`;
    if (wasTranslated) {
      displayText += ` → English (translated)`;
    }
    
    return {
      displayText,
      wasTranslated,
      confidence: confidenceText
    };
  }
}
