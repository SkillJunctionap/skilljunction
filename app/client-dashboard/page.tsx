"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, getDocs, Timestamp } from "firebase/firestore";

interface Job {
  id: string;
  title: string;
  createdBy?: string | null;
  createdByUid?: string | null;
  clientEmail?: string | null;
}

interface Application {
  id: string;
  jobId: string;
  applicantEmail: string;
  offerBudget: number;
  timeline: string;
  proposal: string;
  status: string;
  createdAt?: Timestamp | null;
}

export default function ClientDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      try {
        const jobsSnap = await getDocs(collection(db, "jobs"));
        const allJobs: Job[] = [];

        jobsSnap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          allJobs.push({
            id: docSnap.id,
            title: data.title ?? "Untitled job",
            createdBy: data.createdBy ?? null,
            createdByUid: data.createdByUid ?? null,
            clientEmail: data.clientEmail ?? null,
          });
        });

        const myJobs = allJobs.filter((job) => {
          return (
            job.createdBy === firebaseUser.uid ||
            job.createdByUid === firebaseUser.uid ||
            job.clientEmail === firebaseUser.email
          );
        });

        setJobs(myJobs);

        const appsSnap = await getDocs(collection(db, "applications"));
        const allApps: Application[] = [];

        appsSnap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          allApps.push({
            id: docSnap.id,
            jobId: data.jobId ?? "",
            applicantEmail: data.applicantEmail ?? "",
            offerBudget:
              typeof data.offerBudget === "number" ? data.offerBudget : 0,
            timeline: data.timeline ?? "",
            proposal: data.proposal ?? "",
            status: data.status ?? "pending",
            createdAt: (data.createdAt as Timestamp) ?? null,
          });
        });

        setApplications(allApps);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  if (loading) {
    return <div className="p-6">Loading client dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Client Dashboard</h1>

      {jobs.length === 0 ? (
        <p>No jobs posted yet.</p>
      ) : (
        jobs.map((job) => {
          const jobApps = applications.filter((app) => app.jobId === job.id);

          return (
            <div key={job.id} className="bg-white p-4 mb-4 rounded shadow">
              <h2 className="text-lg font-semibold mb-2">{job.title}</h2>

              {jobApps.length === 0 ? (
                <p className="text-sm text-gray-500">No applications yet.</p>
              ) : (
                jobApps.map((app) => (
                  <div key={app.id} className="border p-3 mb-2 rounded">
                    <p><strong>Freelancer:</strong> {app.applicantEmail}</p>
                    <p><strong>Offer:</strong> ${app.offerBudget}</p>
                    <p><strong>Timeline:</strong> {app.timeline}</p>
                    <p><strong>Proposal:</strong> {app.proposal}</p>
                    <p><strong>Status:</strong> {app.status}</p>
                  </div>
                ))
              )}
            </div>
          );
        })
      )}
    </div>
  );

}