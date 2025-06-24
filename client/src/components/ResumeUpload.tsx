import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import {
  Upload,
  CloudUpload,
  CheckCircle,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ParsedResumeData } from "@shared/schema";

interface ResumeUploadProps {
  onResumeProcessed: (data: {
    resume: { id: number };
    parsedData: ParsedResumeData;
    languageProcessing?: {
      detectedLanguage: string;
      languageName: string;
      confidence: number;
      wasTranslated: boolean;
      displayText: string;
    };
  }) => void;
  currentResume: {
    id: number;
    parsedData: ParsedResumeData;
    languageProcessing?: {
      detectedLanguage: string;
      languageName: string;
      confidence: number;
      wasTranslated: boolean;
      displayText: string;
    };
  } | null;
  onClearState?: () => void;
}

export default function ResumeUpload({
  onResumeProcessed,
  currentResume,
  onClearState,
}: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("resume", file);

      // Get API base URL
      const API_BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await fetch(`${API_BASE_URL}/api/resume/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      onResumeProcessed(data);
      toast({
        title: "Resume processed successfully",
        description:
          "Your resume has been analyzed and is ready for job matching.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description:
          error.message || "Failed to process your resume. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setUploading(true);
        uploadMutation.mutate(file);
      }
    },
    [uploadMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Upload className="w-6 h-6 text-primary" />
          Upload Your Resume
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-primary hover:bg-primary/5"
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <CloudUpload className="text-primary w-8 h-8" />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-custom">
                {isDragActive
                  ? "Drop your resume here"
                  : "Drop your resume here or click to browse"}
              </p>
              <p className="text-gray-500 mt-2">
                Supports PDF, DOCX, and text files up to 10MB
              </p>
            </div>
            <Button
              type="button"
              className="bg-primary text-white hover:bg-blue-700"
            >
              <Upload className="mr-2 w-4 h-4" />
              Choose File
            </Button>
          </div>
        </div>

        {/* Processing Status */}
        {uploading && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <Loader2 className="animate-spin h-6 w-6 text-primary" />
              <div>
                <p className="font-medium text-primary">
                  Processing your resume...
                </p>
                <p className="text-sm text-blue-600">
                  Analyzing skills, experience, and language with AI
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Parsed Resume Information */}
        {currentResume && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-custom flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-secondary" />
                Resume Analysis Complete
              </h3>
              {onClearState && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearState}
                  className="text-gray-600 hover:text-red-600 hover:border-red-300"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start Over
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Language Processing Information */}
                {currentResume.languageProcessing?.wasTranslated && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language Processing
                    </label>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`${
                          currentResume.languageProcessing.wasTranslated
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {currentResume.languageProcessing.displayText}
                      </Badge>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extracted Skills
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {currentResume.parsedData.skills.map((skill) => (
                      <Badge key={skill} className="bg-primary/10 text-primary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <p className="text-slate-custom font-medium">
                    {currentResume.parsedData.experienceLevel}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Role
                  </label>
                  <p className="text-slate-custom font-medium">
                    {currentResume.parsedData.primaryRole}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industries
                  </label>
                  <p className="text-slate-custom">
                    {currentResume.parsedData.industries.join(", ") ||
                      "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
