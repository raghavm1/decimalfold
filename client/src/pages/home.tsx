import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import StatsOverview from "@/components/StatsOverview";
import JobListings from "@/components/JobListings";
import ResumeUpload from "@/components/ResumeUpload";
import JobMatches from "@/components/JobMatches";
import JobGenerator from "@/components/JobGenerator";
import { apiRequest } from "@/lib/queryClient";
import type {
  Job,
  JobWithMatch,
  MatchingStats,
  ParsedResumeData,
  PaginatedResult,
} from "@shared/schema";
import { Bot, Menu, User, RotateCcw, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const searchString = useSearch();
  const { toast } = useToast();
  const [currentResume, setCurrentResume] = useState<{
    id: number;
    parsedData: ParsedResumeData;
    languageProcessing?: {
      detectedLanguage: string;
      languageName: string;
      confidence: number;
      wasTranslated: boolean;
      displayText: string;
    };
  } | null>(null);
  const [matches, setMatches] = useState<JobWithMatch[]>([]);
  const [stats, setStats] = useState<MatchingStats>({
    totalJobs: 0,
    matchesFound: 0,
    avgMatchScore: "-",
    processingTime: "0s",
  });
  const [showGenerator, setShowGenerator] = useState(false);
  const [jobFilters, setJobFilters] = useState({
    search: "",
    experienceLevel: "",
    workType: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(20);

  const { data: jobsData, isLoading: jobsLoading } = useQuery<
    PaginatedResult<Job>
  >({
    queryKey: ["/api/jobs", jobFilters, currentPage, jobsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (jobFilters.search) params.append("search", jobFilters.search);
      if (jobFilters.experienceLevel)
        params.append("experienceLevel", jobFilters.experienceLevel);
      if (jobFilters.workType) params.append("workType", jobFilters.workType);
      params.append("page", currentPage.toString());
      params.append("limit", jobsPerPage.toString());

      const response = await apiRequest("GET", `/api/jobs?${params.toString()}`);
      return response.json();
    },
  });

  // Extract jobs from paginated result
  const jobs = jobsData?.data || [];
  const totalJobs = jobsData?.total || 0;
  const totalPages = jobsData?.totalPages || 1;

  const handleFiltersChange = (filters: {
    search: string;
    experienceLevel: string;
    workType: string;
  }) => {
    setJobFilters(filters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleResumeProcessed = (resumeData: {
    resume: { id: number };
    parsedData: ParsedResumeData;
    languageProcessing?: {
      detectedLanguage: string;
      languageName: string;
      confidence: number;
      wasTranslated: boolean;
      displayText: string;
    };
  }) => {
    const newResumeState = {
      id: resumeData.resume.id,
      parsedData: resumeData.parsedData,
      languageProcessing: resumeData.languageProcessing,
    };

    setCurrentResume(newResumeState);

    // Show a toast with language processing info if available
    if (resumeData.languageProcessing?.wasTranslated) {
      toast({
        title: "Resume Translated",
        description: `Detected ${resumeData.languageProcessing.languageName} and translated to English for better job matching.`,
      });
    } else if (
      resumeData.languageProcessing &&
      !resumeData.languageProcessing.wasTranslated
    ) {
      toast({
        title: "Language Detected",
        description: `Resume language: ${resumeData.languageProcessing.languageName}`,
      });
    }

    // Save to localStorage for state restoration
    localStorage.setItem(
      `resume_${resumeData.resume.id}`,
      JSON.stringify(newResumeState)
    );
  };

  const handleMatchesFound = (matchData: {
    matches: JobWithMatch[];
    stats: MatchingStats;
  }) => {
    setMatches(matchData.matches);
    setStats((prev) => ({ ...prev, ...matchData.stats }));

    // Save matches to localStorage if we have a current resume
    if (currentResume) {
      localStorage.setItem(
        `matches_${currentResume.id}`,
        JSON.stringify(matchData.matches)
      );
      localStorage.setItem(
        `stats_${currentResume.id}`,
        JSON.stringify(matchData.stats)
      );
    }
  };

  const handleClearState = () => {
    const confirmed = window.confirm(
      "Are you sure you want to start over? This will clear your current resume and all job matches."
    );

    if (!confirmed) return;

    // Clear current state
    setCurrentResume(null);
    setMatches([]);
    setStats({
      totalJobs: totalJobs,
      matchesFound: 0,
      avgMatchScore: "-",
      processingTime: "0s",
    });

    // Clear localStorage - clear all resume-related data
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith("resume_") ||
        key.startsWith("matches_") ||
        key.startsWith("stats_")
      ) {
        localStorage.removeItem(key);
      }
    });

    // Clear URL parameters
    window.history.replaceState({}, "", window.location.pathname);

    // Show success message
    toast({
      title: "Session cleared",
      description: "You can now upload a new resume to get started.",
    });
  };

  // Check for resumeId in URL params and restore state
  useEffect(() => {
    const urlParams = new URLSearchParams(searchString);
    const resumeId = urlParams.get("resumeId");

    if (resumeId && (!currentResume || currentResume.id.toString() !== resumeId)) {
      // Restore resume state from localStorage
      const savedResume = localStorage.getItem(`resume_${resumeId}`);
      const savedMatches = localStorage.getItem(`matches_${resumeId}`);
      const savedStats = localStorage.getItem(`stats_${resumeId}`);

      if (savedResume) {
        try {
          const resumeData = JSON.parse(savedResume);
          
          // Set all state synchronously to avoid race conditions
          setCurrentResume(resumeData);
          
          // Restore matches if available
          if (savedMatches) {
            const matchesData = JSON.parse(savedMatches);
            setMatches(matchesData);
          }

          // Restore stats if available
          if (savedStats) {
            const statsData = JSON.parse(savedStats);
            setStats((prev) => ({ ...prev, ...statsData }));
          }
        } catch (error) {
          console.error("Failed to parse saved data:", error);
          // Clear corrupted data
          localStorage.removeItem(`resume_${resumeId}`);
          localStorage.removeItem(`matches_${resumeId}`);
          localStorage.removeItem(`stats_${resumeId}`);
        }
      }
    }
  }, [searchString]);

  // Update total jobs when jobs data is loaded
  useEffect(() => {
    if (totalJobs > 0) {
      setStats((prev) => ({ ...prev, totalJobs: totalJobs }));
    }
  }, [totalJobs]);

  return (
    <div className="min-h-screen bg-custom">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Bot className="text-white text-lg" />
            </div>
            <h1 className="text-2xl font-bold text-slate-custom">
              DecimalFold
            </h1>
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a
              href="#"
              className="text-slate-custom hover:text-primary transition-colors font-medium"
            >
              Dashboard
            </a>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="text-slate-custom hover:text-primary transition-colors font-medium flex items-center space-x-1 cursor-not-allowed opacity-75"
                    disabled
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Ask Chat</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming Soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </nav>

          {/* Right: Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Start Over Button - Desktop */}
            {currentResume && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearState}
                className="hidden md:flex text-gray-600 hover:text-red-600 hover:border-red-300"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            )}

            {/* Account Button - Desktop */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="hidden md:flex bg-gray-400 text-gray-600 hover:bg-gray-400 cursor-not-allowed opacity-75">
                    <User className="mr-2 w-4 h-4" />
                    Account
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming Soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Mobile Action Buttons */}
            {currentResume && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearState}
                className="md:hidden text-gray-600 hover:text-red-600 hover:border-red-300"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-custom"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <StatsOverview stats={stats} />

        {/* Split Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Job Listings Panel (Left) */}
          <div className="lg:col-span-2 space-y-6">
            <JobListings
              jobs={jobs}
              isLoading={jobsLoading}
              resumeId={currentResume?.id}
              onFiltersChange={handleFiltersChange}
              currentPage={currentPage}
              totalPages={totalPages}
              totalJobs={totalJobs}
              jobsPerPage={jobsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>

          {/* Resume Upload and Matching Panel (Right) */}
          <div className="lg:col-span-3 space-y-6">
            <ResumeUpload
              onResumeProcessed={handleResumeProcessed}
              currentResume={currentResume}
              onClearState={handleClearState}
            />
            <JobMatches
              resumeId={currentResume?.id}
              matches={matches}
              onMatchesFound={handleMatchesFound}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Bot className="text-white w-4 h-4" />
                </div>
                <span className="font-bold text-slate-custom">DecimalFold</span>
              </div>
              <p className="text-gray-600 text-sm">
                Intelligent job matching powered by AI to connect talent with
                opportunity.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-custom mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    How it Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-custom mb-4">
                Resources
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Career Tips
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-custom mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a
                href="#"
                className="text-gray-600 hover:text-primary transition-colors"
              >
                <span className="sr-only">Twitter</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-primary transition-colors"
              >
                <span className="sr-only">LinkedIn</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-primary transition-colors"
              >
                <span className="sr-only">GitHub</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
