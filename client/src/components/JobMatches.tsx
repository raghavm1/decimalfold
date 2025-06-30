import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Sparkles,
  Star,
  TrendingUp,
  Users,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { JobWithMatch, MatchingStats } from "@shared/schema";
import { formatSalary, getMatchScoreColor } from "@/lib/utils";

interface JobMatchesProps {
  resumeId?: number;
  matches: JobWithMatch[];
  onMatchesFound: (data: {
    matches: JobWithMatch[];
    stats: MatchingStats;
  }) => void;
}

export default function JobMatches({
  resumeId,
  matches,
  onMatchesFound,
}: JobMatchesProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Use React Query to fetch matches with caching
  const { 
    data: matchData, 
    error, 
    isLoading: isLoadingMatches,
    refetch
  } = useQuery({
    queryKey: ['job-matches', resumeId],
    queryFn: async () => {
      if (!resumeId) return null;
      const response = await apiRequest("POST", `/api/resume/${resumeId}/matches`);
      return response.json();
    },
    enabled: !!resumeId && matches.length === 0, // Only fetch if we have resumeId and no existing matches
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: 1,
  });

  // Update parent state when data is fetched
  useEffect(() => {
    if (matchData && !error) {
      onMatchesFound(matchData);
      toast({
        title: "Job matches found",
        description: `Found ${matchData.matches.length} relevant job opportunities for you.`,
      });
    }
  }, [matchData, error, onMatchesFound, toast]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast({
        title: "Matching failed", 
        description: error.message || "Failed to find job matches. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const getCompanyInitials = (company: string): string => {
    return company
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getCompanyGradient = (company: string): string => {
    const gradients = [
      "from-blue-500 to-purple-600",
      "from-green-500 to-teal-600",
      "from-purple-500 to-pink-600",
      "from-orange-500 to-red-600",
      "from-indigo-500 to-blue-600",
    ];
    const index = company.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  const getMatchColor = (score: number): string => {
    if (score >= 0.8) return "bg-green-600 text-white"; // Excellent Fit
    if (score >= 0.6) return "bg-blue-600 text-white"; // Great Fit
    if (score >= 0.4) return "bg-yellow-600 text-white"; // Good Fit
    if (score >= 0.2) return "bg-orange-600 text-white"; // Fair Fit
    return "bg-gray-500 text-white"; // Basic Fit
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case "high":
        return <TrendingUp className="w-3 h-3" />;
      case "medium":
        return <TrendingUp className="w-3 h-3" />;
      default:
        return <TrendingUp className="w-3 h-3" />;
    }
  };

  const getMatchLabel = (score: number): string => {
    if (score >= 0.8) return "Excellent Fit";
    if (score >= 0.6) return "Great Fit";
    if (score >= 0.4) return "Good Fit";
    if (score >= 0.2) return "Fair Fit";
    return "Basic Fit";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          Top Job Matches
          {isLoadingMatches && (
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
          )}
          <span className="text-sm font-normal text-gray-500 ml-2">
            {isLoadingMatches
              ? "(Finding matches...)"
              : matches.length > 0
              ? `(${matches.length} matches found)`
              : "(Upload resume to see matches)"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingMatches ? (
          // Loading State
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">
                  Analyzing your resume and finding the best job matches...
                </span>
              </div>
            </div>
            {/* Loading skeleton cards */}
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border rounded-lg p-6 bg-gray-50/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-14" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : matches.length === 0 ? (
          // Empty State
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              {resumeId ? "No matches found" : "No matches yet"}
            </h3>
            <p className="text-gray-400">
              {resumeId
                ? "We don't have any relevant opportunities at the moment. Check back later for new matches!"
                : "Upload your resume to discover perfectly matched job opportunities"}
            </p>
          </div>
        ) : (
          // Matching Results
          <div className="space-y-4">
            {matches.map((match, index) => (
              <div
                key={match.id}
                className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                  index === 0
                    ? "border-secondary/20 bg-secondary/5 hover:border-secondary/30"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() =>
                  setLocation(
                    `/job/${match.id}${resumeId ? `?resumeId=${resumeId}` : ""}`
                  )
                }
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${getCompanyGradient(
                        match.company
                      )} rounded-lg flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-white font-bold text-sm">
                        {getCompanyInitials(match.company)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-custom text-lg">
                        {match.title}
                      </h3>
                      <p className="text-gray-600 font-medium">
                        {match.company}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {match.location} • {match.workType} •{" "}
                        {formatSalary(
                          match.salaryMin || undefined,
                          match.salaryMax || undefined
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getMatchColor(
                        match.matchScore || 0
                      )}`}
                    >
                      {index === 0 && <Star className="w-3 h-3" />}
                      {getMatchLabel(match.matchScore || 0)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Matching Skills:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {match.matchingSkills?.map((skill) => (
                        <Badge
                          key={skill}
                          className={
                            index === 0
                              ? "bg-secondary/20 text-secondary"
                              : "bg-primary/20 text-primary"
                          }
                        >
                          {skill}
                        </Badge>
                      ))}
                      {(!match.matchingSkills ||
                        match.matchingSkills.length === 0) && (
                        <span className="text-sm text-gray-500">
                          No specific skills matched
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {/* <span className="flex items-center gap-1">
                        {getConfidenceIcon(match.confidence || "medium")}
                        Confidence: {match.confidence || "Medium"}
                      </span> */}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {match.experienceLevel}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {index === 0 ? (
                        <Button
                          className="bg-primary text-white hover:bg-blue-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle apply action
                          }}
                        >
                          Apply Now
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="border-primary text-primary hover:bg-primary hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(
                              `/job/${match.id}${
                                resumeId ? `?resumeId=${resumeId}` : ""
                              }`
                            );
                          }}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
