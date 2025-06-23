// Type declarations for missing modules
declare module 'langdetect' {
  interface DetectionResult {
    lang: string;
    prob: number;
  }
  
  export function detect(text: string): DetectionResult[] | DetectionResult;
}

declare module '@vitalets/google-translate-api' {
  interface TranslateOptions {
    from?: string;
    to?: string;
  }
  
  interface TranslateResult {
    text: string;
    from: {
      language: {
        didYouMean: boolean;
        iso: string;
      };
      text: {
        autoCorrected: boolean;
        value: string;
        didYouMean: boolean;
      };
    };
  }
  
  export function translate(text: string, options: TranslateOptions): Promise<TranslateResult>;
}
