import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Clock,
  Building,
  Users,
  Star,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatSalary } from "@/lib/utils";
import type { Job } from "@shared/schema";

interface JobDetailsProps {
  jobId: string;
}

export default function JobDetails({ jobId }: JobDetailsProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiRequest("GET", `/api/jobs/${jobId}`);
      if (!response.ok) {
        throw new Error("Job not found");
      }

      const jobData = await response.json();
      setJob(jobData);
    } catch (error) {
      console.error("Failed to fetch job details:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load job details"
      );
      toast({
        title: "Error",
        description: "Failed to load job details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {" "}
          <Button
            variant="ghost"
            onClick={() => {
              const urlParams = new URLSearchParams(window.location.search);
              const resumeId = urlParams.get("resumeId");
              if (resumeId) {
                setLocation(`/?resumeId=${resumeId}`);
              } else {
                setLocation("/");
              }
            }}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Job not found
              </h3>
              <p className="text-gray-500 mb-4">
                The job you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => setLocation("/")}>Return to Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => {
            const urlParams = new URLSearchParams(window.location.search);
            const resumeId = urlParams.get("resumeId");
            if (resumeId) {
              setLocation(`/?resumeId=${resumeId}`);
            } else {
              setLocation("/");
            }
          }}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Button>

        {/* Job Header */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-6">
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${getCompanyGradient(
                    job.company
                  )} rounded-lg flex items-center justify-center flex-shrink-0`}
                >
                  <span className="text-white font-bold text-lg">
                    {getCompanyInitials(job.company)}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {job.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-lg text-gray-600 mb-4">
                    <span className="flex items-center">
                      <Building className="w-5 h-5 mr-2" />
                      {job.company}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      {job.location}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Posted {formatDate(job.postedDate)}
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {job.experienceLevel}
                    </span>
                    <Badge variant="secondary">{job.workType}</Badge>
                    <Badge variant="outline">{job.industry}</Badge>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {formatSalary(
                    job.salaryMin || undefined,
                    job.salaryMax || undefined
                  )}
                </div>
                <Button size="lg" className="bg-primary hover:bg-blue-700">
                  <Star className="w-4 h-4 mr-2" />
                  Apply Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {job.description}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {job.requirements}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Job Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Work Type</span>
                  <span className="font-medium">{job.workType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Experience Level</span>
                  <span className="font-medium">{job.experienceLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Industry</span>
                  <span className="font-medium">{job.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location</span>
                  <span className="font-medium">{job.location}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Salary Range</span>
                  <span className="font-medium">
                    {formatSalary(
                      job.salaryMin || undefined,
                      job.salaryMax || undefined
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Required Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Required Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Apply Section */}
            <Card>
              <CardHeader>
                <CardTitle>Ready to Apply?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm">
                  This position looks like a great fit for your profile. Apply
                  now to get started!
                </p>
                <Button
                  className="w-full bg-primary hover:bg-blue-700"
                  size="lg"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Apply for this Job
                </Button>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Save for Later
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
