import { Briefcase, Search, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { MatchingStats } from "@shared/schema";

interface StatsOverviewProps {
  stats: MatchingStats;
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Jobs</p>
              <p className="text-2xl font-bold text-slate-custom">
                {stats.totalJobs.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Briefcase className="text-primary w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Matches Found</p>
              <p className="text-2xl font-bold text-secondary">
                {stats.matchesFound}
              </p>
            </div>
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
              <Search className="text-secondary w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg Match Score</p>
              <p className="text-2xl font-bold text-accent">
                {stats.avgMatchScore}
              </p>
            </div>
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-accent w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
