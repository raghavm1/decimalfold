import PDFParser from 'pdf2json';
import { promisify } from 'util';

export interface PDFExtractionResult {
  text: string;
  pages: number;
  extractionMethod: 'pdf2json' | 'fallback';
  confidence: 'high' | 'medium' | 'low';
  metadata?: {
    pageTexts: string[];
    totalCharacters: number;
  };
}

export interface PDFExtractionOptions {
  minTextLength?: number;
  maxTextLength?: number;
  preserveFormatting?: boolean;
}

/**
 * Service for handling PDF text extraction using Mozilla's PDF.js
 */
export class PDFService {
  
  /**
   * Extract text from PDF buffer using pdf2json
   */
  static async extractTextFromBuffer(
    buffer: Buffer, 
    options: PDFExtractionOptions = {}
  ): Promise<PDFExtractionResult> {
    const { 
      minTextLength = 50, 
      maxTextLength = 20000,
      preserveFormatting = true
    } = options;
    
    return new Promise((resolve, reject) => {
      try {
        console.log('🔄 Extracting text from PDF using pdf2json...');
        console.log(`📄 PDF size: ${(buffer.length / 1024).toFixed(1)} KB`);
        
        const pdfParser = new PDFParser();
        
        // Set up event handlers
        pdfParser.on('pdfParser_dataError', (errData: any) => {
          console.error('❌ pdf2json parsing error:', errData.parserError);
          console.error('📄 Error details:', {
            errorType: errData.name,
            message: errData.parserError,
            pdfSize: buffer.length
          });
          reject(new Error(`PDF parsing failed: ${errData.parserError}`));
        });
        
        pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
          try {
            console.log(`📑 PDF loaded: ${pdfData.Pages?.length || 0} pages`);
            
            let fullText = '';
            const pageTexts: string[] = [];
            
            if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
              for (let pageIndex = 0; pageIndex < pdfData.Pages.length; pageIndex++) {
                const page = pdfData.Pages[pageIndex];
                let pageText = '';
                
                if (page.Texts && Array.isArray(page.Texts)) {
                  for (const textItem of page.Texts) {
                    if (textItem.R && Array.isArray(textItem.R)) {
                      for (const run of textItem.R) {
                        if (run.T) {
                          // Decode URI-encoded text
                          const decodedText = decodeURIComponent(run.T);
                          pageText += decodedText;
                          if (preserveFormatting) {
                            pageText += ' ';
                          }
                        }
                      }
                    }
                  }
                }
                
                pageTexts.push(pageText.trim());
                fullText += pageText;
                if (pageIndex < pdfData.Pages.length - 1) {
                  fullText += '\n\n'; // Separate pages
                }
                
                console.log(`✅ Extracted page ${pageIndex + 1}: ${pageText.length} characters`);
              }
            }
            
            // Clean up the text
            let cleanedText = fullText
              .replace(/\s+/g, ' ') // Replace multiple spaces with single space
              .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
              .trim();
            
            console.log(`✅ Total extracted: ${cleanedText.length} characters from ${pdfData.Pages?.length || 0} pages`);
            
            // Truncate if too long
            if (cleanedText.length > maxTextLength) {
              cleanedText = cleanedText.substring(0, maxTextLength) + '...';
              console.log(`⚠️  Text truncated to ${maxTextLength} characters`);
            }
            
            const result: PDFExtractionResult = {
              text: cleanedText,
              pages: pdfData.Pages?.length || 0,
              extractionMethod: 'pdf2json',
              confidence: 'high',
              metadata: {
                pageTexts,
                totalCharacters: cleanedText.length
              }
            };
            
            // Validate minimum text length
            if (result.text.length < minTextLength) {
              reject(new Error(`Extracted text is too short (${result.text.length} characters). PDF might be scanned, encrypted, or corrupted.`));
              return;
            }
            
            resolve(result);
            
          } catch (processingError) {
            console.error('❌ Error processing PDF data:', processingError);
            reject(new Error(`PDF processing failed: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`));
          }
        });
        
        // Parse the PDF buffer
        pdfParser.parseBuffer(buffer);
        
      } catch (error) {
        console.error('❌ pdf2json extraction failed:', error);
        reject(new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }
  
  /**
   * Extract text from PDF file path
   */
  static async extractTextFromFile(
    filePath: string, 
    options: PDFExtractionOptions = {}
  ): Promise<PDFExtractionResult> {
    const fs = await import('fs');
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file not found: ${filePath}`);
    }
    
    const buffer = fs.readFileSync(filePath);
    return this.extractTextFromBuffer(buffer, options);
  }
  
  /**
   * Validate if text looks like a resume
   */
  static validateResumeContent(text: string): {
    isValid: boolean;
    confidence: 'high' | 'medium' | 'low';
    foundKeywords: string[];
    suggestions: string[];
  } {
    const resumeKeywords = [
      'experience', 'education', 'skills', 'work', 'job', 'position',
      'company', 'university', 'degree', 'certification', 'project',
      'responsibilities', 'achievements', 'employment', 'career',
      'professional', 'summary', 'objective', 'qualifications',
      'manager', 'developer', 'engineer', 'analyst', 'coordinator',
      'specialist', 'assistant', 'director', 'consultant', 'intern',
      'years', 'months', 'phone', 'email', 'address', 'linkedin'
    ];
    
    const textLower = text.toLowerCase();
    const foundKeywords = resumeKeywords.filter(keyword => 
      textLower.includes(keyword)
    );
    
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let isValid = false;
    const suggestions: string[] = [];
    
    // More lenient validation - accept if we find any reasonable amount of text and at least 1 keyword
    if (foundKeywords.length >= 5) {
      confidence = 'high';
      isValid = true;
    } else if (foundKeywords.length >= 2) {
      confidence = 'medium';
      isValid = true;
    } else if (foundKeywords.length >= 1 && text.length > 200) {
      confidence = 'low';
      isValid = true; // Accept even with low confidence if there's substantial text
    } else {
      confidence = 'low';
      isValid = text.length > 100; // Accept any substantial text content
      if (!isValid) {
        suggestions.push('This PDF might not contain a typical resume format');
        suggestions.push('Consider checking if the PDF contains a proper resume');
      }
    }
    
    // Additional validation for common issues
    if (text.length < 200) {
      suggestions.push('Text content appears very short for a resume');
    }
    
    if (!/[a-zA-Z]{3,}/.test(text)) {
      suggestions.push('PDF might be corrupted or contain mostly non-text content');
    }
    
    return {
      isValid,
      confidence,
      foundKeywords,
      suggestions
    };
  }
  
  /**
   * Get PDF processing diagnostics using basic PDF validation
   */
  static async diagnosePDF(buffer: Buffer): Promise<{
    canExtract: boolean;
    estimatedPages: number;
    hasText: boolean;
    possibleIssues: string[];
    recommendations: string[];
  }> {
    const possibleIssues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      // Basic PDF buffer validation
      const pdfHeader = buffer.toString('ascii', 0, 8);
      const isPDF = pdfHeader.startsWith('%PDF-');
      
      if (!isPDF) {
        possibleIssues.push('File does not appear to be a valid PDF');
        recommendations.push('Ensure the file is a proper PDF document');
        
        return {
          canExtract: false,
          estimatedPages: 0,
          hasText: false,
          possibleIssues,
          recommendations
        };
      }
      
      // Try to parse with pdf2json for diagnosis
      return new Promise((resolve) => {
        const pdfParser = new PDFParser();
        
        pdfParser.on('pdfParser_dataError', (errData: any) => {
          possibleIssues.push('Cannot parse PDF structure');
          recommendations.push('PDF file might be corrupted or encrypted');
          recommendations.push('Try re-saving or re-exporting the PDF');
          
          resolve({
            canExtract: false,
            estimatedPages: 0,
            hasText: false,
            possibleIssues,
            recommendations
          });
        });
        
        pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
          console.log('📋 PDF diagnosis: Successfully loaded with pdf2json');
          
          // Quick check for text content
          let hasText = false;
          let estimatedPages = 0;
          
          if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
            estimatedPages = pdfData.Pages.length;
            
            // Check if any page has text
            for (const page of pdfData.Pages) {
              if (page.Texts && Array.isArray(page.Texts) && page.Texts.length > 0) {
                hasText = true;
                break;
              }
            }
          }
          
          if (!hasText) {
            possibleIssues.push('No extractable text found');
            recommendations.push('PDF might be image-based or scanned');
            recommendations.push('Consider using OCR tools if the PDF contains images of text');
          }
          
          resolve({
            canExtract: true,
            estimatedPages,
            hasText,
            possibleIssues,
            recommendations: hasText ? ['pdf2json should handle this document well'] : recommendations
          });
        });
        
        // Parse the PDF buffer
        pdfParser.parseBuffer(buffer);
      });
      
    } catch (error) {
      possibleIssues.push('Cannot parse PDF structure');
      recommendations.push('PDF file might be corrupted or encrypted');
      recommendations.push('Try re-saving or re-exporting the PDF');
      
      return {
        canExtract: false,
        estimatedPages: 0,
        hasText: false,
        possibleIssues,
        recommendations
      };
    }
  }
}
