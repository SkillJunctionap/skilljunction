"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

type Job = {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  createdAt?: Timestamp | null;
};

export default function MyJobsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Listen for auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
    });
    return () => unsub();
  }, []);

  // Load jobs created by this user
  useEffect(() => {
    const loadJobs = async () => {
      if (!user) {
        setJobs([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const jobsRef = collection(db, "jobs");
        const qJobs = query(jobsRef, where("createdByUid", "==", user.uid));
        const snap = await getDocs(qJobs);

        const list: Job[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          list.push({
            id: docSnap.id,
            title: data.title || "Untitled job",
            description: data.description || "",
            budget:
              typeof data.budget === "number"
                ? data.budget
                : Number(data.budget) || null,
            createdAt: (data.createdAt as Timestamp) ?? null,
          });
        });

        // newest first
        list.sort((a, b) => {
          const ta =
            a.createdAt?.toDate instanceof Function
              ? a.createdAt.toDate().getTime()
              : 0;
          const tb =
            b.createdAt?.toDate instanceof Function
              ? b.createdAt.toDate().getTime()
              : 0;
          return tb - ta;
        });

        setJobs(list);
      } catch (err) {
        console.error(err);
        setError("Could not load your jobs.");
      } finally {
        setLoading(false);
      }
    };

    if (user !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      loadJobs();
    }
  }, [user]);

  const formatDate = (ts?: Timestamp | null) => {
    if (!ts) return "";
    try {
      const d = ts.toDate();
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center max-w-sm">
          <p className="text-sm text-slate-600 mb-3">
            Please log in to view jobs you have posted.
          </p>
          <Link
            href="/login"
            className="inline-flex px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="text-xs text-sky-600 hover:underline mb-3"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          My Jobs
        </h1>
        <p className="text-sm text-slate-500 mb-4">
          View all the jobs you&apos;ve posted as a client and open them to
          review applications.
        </p>

        <div className="mb-5">
          <Link
            href="/post-job"
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700"
          >
            + Post a new job
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading your jobs…</p>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-slate-500">
            You haven&apos;t posted any jobs yet. Click &quot;Post a new job&quot; to
            get started.
          </p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${encodeURIComponent(job.id)}`}
                className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-sky-400 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {job.title}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {formatDate(job.createdAt)}
                  </p>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 mb-1">
                  {job.description}
                </p>
                <p className="text-xs text-slate-700 mt-1">
                  Budget:{" "}
                  <span className="font-semibold">
                    {job.budget != null ? `$${job.budget}` : "Not specified"}
                  </span>
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
