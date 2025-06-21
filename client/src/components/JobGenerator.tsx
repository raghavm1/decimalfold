import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, Zap, Target } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface JobStats {
  totalJobs: number;
  byExperienceLevel: Record<string, number>;
  byIndustry: Record<string, number>;
  byWorkType: Record<string, number>;
  byLocation: Record<string, number>;
}

interface VectorStrategy {
  name: string;
  key: string;
  description: string;
}

interface JobGeneratorProps {
  onJobsGenerated?: () => void;
}

export default function JobGenerator({ onJobsGenerated }: JobGeneratorProps) {
  const [jobCount, setJobCount] = useState(1000);
  const [jobType, setJobType] = useState("general");
  const [selectedStrategy, setSelectedStrategy] = useState("tfidf");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current job statistics
  const { data: jobStats, refetch: refetchStats } = useQuery<JobStats>({
    queryKey: ['/api/jobs/stats'],
    staleTime: 30000, // 30 seconds
  });

  // Get available vector strategies
  const { data: strategies } = useQuery<VectorStrategy[]>({
    queryKey: ['/api/strategies'],
    staleTime: 300000, // 5 minutes
  });

  // Job generation mutation
  const generateJobsMutation = useMutation({
    mutationFn: async ({ count, type }: { count: number; type: string }) => {
      return apiRequest(`/api/jobs/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count, type }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Jobs Generated Successfully",
        description: `Generated ${data.count} ${jobType} jobs. Total jobs: ${data.totalJobs}`,
      });
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      onJobsGenerated?.();
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate jobs",
        variant: "destructive",
      });
    },
  });

  const handleGenerateJobs = () => {
    if (jobCount < 1 || jobCount > 100000) {
      toast({
        title: "Invalid Count",
        description: "Job count must be between 1 and 100,000",
        variant: "destructive",
      });
      return;
    }
    generateJobsMutation.mutate({ count: jobCount, type: jobType });
  };

  return (
    <div className="space-y-6">
      {/* Job Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Job Database Statistics
          </CardTitle>
          <CardDescription>
            Current state of the job database for testing and performance analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {jobStats.totalJobs.toLocaleString()}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Total Jobs</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Experience Levels</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(jobStats.byExperienceLevel).map(([level, count]) => (
                    <Badge key={level} variant="secondary" className="text-xs">
                      {level}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Work Types</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(jobStats.byWorkType).map(([type, count]) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Top Industries</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(jobStats.byIndustry)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([industry, count]) => (
                    <Badge key={industry} variant="default" className="text-xs">
                      {industry}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Loading job statistics...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Generate Test Jobs
          </CardTitle>
          <CardDescription>
            Create synthetic job data for scalability testing (1 to 100,000 jobs)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobCount">Number of Jobs</Label>
              <Input
                id="jobCount"
                type="number"
                min="1"
                max="100000"
                value={jobCount}
                onChange={(e) => setJobCount(parseInt(e.target.value) || 1)}
                placeholder="Enter job count"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jobType">Job Type</Label>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General (Mixed Industries)</SelectItem>
                  <SelectItem value="tech">Tech Focused</SelectItem>
                  <SelectItem value="data">Data Science & AI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleGenerateJobs}
                disabled={generateJobsMutation.isPending}
                className="w-full"
              >
                {generateJobsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Generate Jobs
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Performance Guide:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>1K jobs: Instant generation, good for basic testing</li>
              <li>10K jobs: ~2-3 seconds, ideal for performance testing</li>
              <li>100K jobs: ~30 seconds, stress testing for large-scale scenarios</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Vector Strategy Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Vector Strategy Testing
          </CardTitle>
          <CardDescription>
            Test different vectorizing techniques for job matching at scale
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {strategies?.map((strategy) => (
              <div 
                key={strategy.key}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedStrategy === strategy.key 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setSelectedStrategy(strategy.key)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{strategy.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {strategy.description}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={selectedStrategy === strategy.key}
                      onChange={() => setSelectedStrategy(strategy.key)}
                      className="h-4 w-4 text-blue-600"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <strong>Strategy Comparison:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li><strong>TF-IDF:</strong> Best semantic understanding, scales to 100k+ jobs</li>
              <li><strong>Skill Match:</strong> Precise technical matching, fastest performance</li>
              <li><strong>Hybrid:</strong> Balanced approach, best overall accuracy</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}