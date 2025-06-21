import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sparkles, Star, TrendingUp, Users, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const findMatchesMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/resume/${id}/matches`);
      return response.json();
    },
    onSuccess: (data) => {
      onMatchesFound(data);
      toast({
        title: "Job matches found",
        description: `Found ${data.matches.length} relevant job opportunities for you.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Matching failed",
        description:
          error.message || "Failed to find job matches. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (resumeId && !findMatchesMutation.isPending) {
      findMatchesMutation.mutate(resumeId);
    }
  }, [resumeId]);

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
    if (score >= 0.9) return "bg-secondary text-white";
    if (score >= 0.8) return "bg-primary text-white";
    if (score >= 0.7) return "bg-accent text-white";
    return "bg-gray-500 text-white";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          Top Job Matches
          <span className="text-sm font-normal text-gray-500 ml-2">
            {matches.length > 0
              ? `(${matches.length} matches found)`
              : "(Upload resume to see matches)"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          // Empty State
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              No matches yet
            </h3>
            <p className="text-gray-400">
              Upload your resume to discover perfectly matched job opportunities
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
                      {Math.round((match.matchScore || 0) * 100)}% Match
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
                      <span className="flex items-center gap-1">
                        {getConfidenceIcon(match.confidence || "medium")}
                        Confidence: {match.confidence || "Medium"}
                      </span>
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
