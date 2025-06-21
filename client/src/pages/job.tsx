import { useParams } from "wouter";
import JobDetails from "@/components/JobDetails";

export default function JobPage() {
  const params = useParams();
  const jobId = params.id;

  if (!jobId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Job ID
          </h1>
          <p className="text-gray-600">The job ID provided is not valid.</p>
        </div>
      </div>
    );
  }

  return <JobDetails jobId={jobId} />;
}
