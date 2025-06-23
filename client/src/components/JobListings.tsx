import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  Filter,
  Search,
  DollarSign,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Job } from "@shared/schema";
import { formatSalary, formatRelativeTime } from "@/lib/utils";

interface JobListingsProps {
  jobs: Job[];
  isLoading: boolean;
  resumeId?: number;
  onFiltersChange?: (filters: {
    search: string;
    experienceLevel: string;
    workType: string;
  }) => void;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  totalJobs?: number;
  onPageChange?: (page: number) => void;
}

export default function JobListings({
  jobs,
  isLoading,
  resumeId,
  onFiltersChange,
  currentPage = 1,
  totalPages = 1,
  totalJobs = 0,
  onPageChange,
}: JobListingsProps) {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("All Levels");
  const [workType, setWorkType] = useState("All Types");
  const lastFiltersRef = useRef({
    search: "",
    experienceLevel: "",
    workType: "",
  });

  // Debounced server-side filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onFiltersChange) {
        const newFilters = {
          search: searchQuery,
          experienceLevel:
            experienceLevel === "All Levels" ? "" : experienceLevel,
          workType: workType === "All Types" ? "" : workType,
        };

        // Only call onFiltersChange if filters have actually changed
        if (
          newFilters.search !== lastFiltersRef.current.search ||
          newFilters.experienceLevel !==
            lastFiltersRef.current.experienceLevel ||
          newFilters.workType !== lastFiltersRef.current.workType
        ) {
          lastFiltersRef.current = newFilters;
          onFiltersChange(newFilters);
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, experienceLevel, workType, onFiltersChange]);

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
      "from-yellow-500 to-orange-600",
      "from-pink-500 to-rose-600",
      "from-teal-500 to-green-600",
    ];
    const index = company.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters - Always visible */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Job Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Jobs
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by title, company, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level
            </label>
            <Select value={experienceLevel} onValueChange={setExperienceLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Levels">All Levels</SelectItem>
                <SelectItem value="Entry Level">Entry Level</SelectItem>
                <SelectItem value="Mid-Level">Mid Level</SelectItem>
                <SelectItem value="Senior Level">Senior Level</SelectItem>
                <SelectItem value="Leadership">Leadership</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Type
            </label>
            <Select value={workType} onValueChange={setWorkType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Types">All Types</SelectItem>
                <SelectItem value="Full-time">Full-time</SelectItem>
                <SelectItem value="Part-time">Part-time</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
                <SelectItem value="Remote">Remote</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Job Listings */}
      <Card>
        <CardHeader>
          <CardTitle>
            Available Positions
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({totalJobs} jobs
              {totalPages > 1 ? `, page ${currentPage} of ${totalPages}` : ""})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            <div className="divide-y divide-gray-100">
              {isLoading ? (
                // Loading state for jobs only
                <div className="space-y-4 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start space-x-4 p-4">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                        <div className="flex space-x-2 mt-3">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-5 w-14" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No jobs found matching your criteria
                </div>
              ) : (
                jobs.map((job: Job) => (
                  <div
                    key={job.id}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() =>
                      setLocation(
                        `/job/${job.id}${
                          resumeId ? `?resumeId=${resumeId}` : ""
                        }`
                      )
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div
                          className={`w-12 h-12 bg-gradient-to-r ${getCompanyGradient(
                            job.company
                          )} rounded-lg flex items-center justify-center flex-shrink-0`}
                        >
                          <span className="text-white font-bold text-sm">
                            {getCompanyInitials(job.company)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-custom text-lg">
                            {job.title}
                          </h3>
                          <p className="text-gray-600 font-medium">
                            {job.company}
                          </p>
                          <p className="text-gray-500 text-sm mt-1">
                            {job.location} • {job.workType}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center">
                              <DollarSign className="w-3 h-3 mr-1" />
                              {formatSalary(
                                job.salaryMin || undefined,
                                job.salaryMax || undefined
                              )}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {job.workType}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {job.skills.slice(0, 3).map((skill: string) => (
                              <Badge
                                key={skill}
                                variant="secondary"
                                className="bg-primary/10 text-primary"
                              >
                                {skill}
                              </Badge>
                            ))}
                            {job.skills.length > 3 && (
                              <Badge
                                variant="outline"
                                className="text-gray-500"
                              >
                                +{job.skills.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {formatRelativeTime(job.postedDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-gray-50/50">
              <div className="text-sm text-gray-700 font-medium order-2 sm:order-1">
                <span className="hidden sm:inline">Showing </span>
                <span className="text-gray-900 font-semibold">
                  {(currentPage - 1) * 20 + 1}-
                  {Math.min(currentPage * 20, totalJobs)}
                </span>
                <span className="hidden sm:inline"> of </span>
                <span className="sm:hidden"> / </span>
                <span className="text-gray-900 font-semibold">
                  {totalJobs.toLocaleString()}
                </span>
                <span className="hidden sm:inline"> jobs</span>
              </div>
              <div className="flex items-center space-x-1 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="text-gray-600 border-gray-300 hover:bg-gray-100 px-2"
                >
                  <ChevronLeft className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <div className="flex items-center space-x-0.5">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange?.(page)}
                        className={`w-8 h-8 text-sm p-0 ${
                          page === currentPage
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "text-gray-600 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="text-gray-600 border-gray-300 hover:bg-gray-100 px-2"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4 sm:ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
