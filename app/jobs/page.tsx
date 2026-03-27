"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";

type Job = {
  id: string;
  title: string;
  description: string;
  budget: number;
  createdBy?: string | null;
  createdAt?: Timestamp | null;
};

export default function JobsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [error, setError] = useState("");

  // Protect this page: only logged-in users can browse jobs
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/login");
      } else {
        setUser(firebaseUser);
      }
      setCheckingAuth(false);
    });

    return () => unsub();
  }, [router]);

  // Load jobs from Firestore
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const q = query(
          collection(db, "jobs"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);

        const list: Job[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          list.push({
            id: docSnap.id,
            title: data.title || "Untitled job",
            description: data.description || "",
            budget: data.budget || 0,
            createdBy: data.createdBy ?? null,
            createdAt: (data.createdAt as Timestamp) ?? null,
          });
        });

        setJobs(list);
      } catch (err: any) {
        console.error(err);
        setError("Could not load jobs right now.");
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
  }, []);

  const formatDate = (ts?: Timestamp | null) => {
    if (!ts) return "";
    try {
      const d = ts.toDate();
      return d.toLocaleDateString();
    } catch {
      return "";
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Checking your session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Browse Jobs
            </h1>
            {user && (
              <p className="text-sm text-slate-600 mt-1">
                Logged in as {user.email}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href="/post-job"
              className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700"
            >
              Post a Job
            </Link>
            <Link
              href="/client-dashboard"
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-100"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <p className="mb-3 text-sm text-rose-600">
            {error}
          </p>
        )}

        {loadingJobs ? (
          <p className="text-sm text-slate-500">Loading jobs…</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-slate-500">
            No jobs posted yet. Be the first to{" "}
            <Link href="/post-job" className="text-sky-600 underline">
              post a job
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-white rounded-xl shadow-sm border border-slate-100 hover:border-sky-200 hover:shadow-md transition"
              >
                <div className="p-5">
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">
                    {job.title}
                  </h2>
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {job.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>
                      Budget:{" "}
                      <span className="font-semibold">${job.budget}</span>
                    </span>
                    <span className="text-xs text-slate-500">
                      Posted by {job.createdBy || "client"}
                      {job.createdAt && " • " + formatDate(job.createdAt)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


