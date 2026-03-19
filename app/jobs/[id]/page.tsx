"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Job {
  title: string;
  description: string;
  category?: string;
}

export default function JobPage() {
  const params = useParams();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const jobId = params?.id;

    if (!jobId || Array.isArray(jobId)) {
      setLoading(false);
      return;
    }

    const fetchJob = async () => {
      try {
        const docRef = doc(db, "jobs", jobId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setJob(docSnap.data() as Job);
        } else {
          setJob(null);
        }
      } catch (error) {
        console.error(error);
        setJob(null);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [params]);

  if (loading) return <div>Loading job...</div>;

  if (!job)
    return (
      <div>
        <h1>Job not found</h1>
        <button onClick={() => router.push("/jobs")}>
          Back to jobs
        </button>
      </div>
    );

  return (
    <div style={{ padding: "20px" }}>
      <h1>{job.title}</h1>

      {job.category && (
        <p>
          <strong>Category:</strong> {job.category}
        </p>
      )}

      <p>{job.description}</p>

      <button
        onClick={() => router.push("/jobs")}
        style={{
          marginTop: "20px",
          padding: "10px",
          background: "#2563eb",
          color: "white",
          borderRadius: "6px"
        }}
      >
        Back to jobs
      </button>
    </div>
  );
}









