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

// Type for an application document
type Application = {
  id: string;
  jobId: string | null;
  jobTitle: string | null;
  clientEmail: string | null;
  offerBudget: number | null;
  timeline: string | null;
  status: string;
  createdAt?: Timestamp | null;
};

export default function MyApplicationsPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [appsError, setAppsError] = useState("");

  // --- Auth listener ---

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      setLoadingUser(false);
    });
    return () => unsub();
  }, []);

  // --- Load applications for this user ---

  useEffect(() => {
    if (!user) {
      setLoadingApps(false);
      return;
    }

    const fetchApps = async () => {
      setLoadingApps(true);
      setAppsError("");

      try {
        const appsRef = collection(db, "applications");
        // no orderBy here – we’ll sort client-side
        const q = query(appsRef, where("applicantUid", "==", user.uid));
        const snap = await getDocs(q);

        const list: Application[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          list.push({
            id: docSnap.id,
            jobId: data.jobId ?? null,
            jobTitle: data.jobTitle ?? null,
            clientEmail: data.clientEmail ?? null,
            offerBudget:
              typeof data.offerBudget === "number"
                ? data.offerBudget
                : Number(data.offerBudget) || null,
            timeline: data.timeline ?? null,
            status: data.status ?? "pending",
            createdAt: (data.createdAt as Timestamp) ?? null,
          });
        });

        // Sort newest → oldest
        list.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        });

        setApplications(list);
      } catch (err) {
        console.error("Error loading applications", err);
        setAppsError("Could not load your applications. Please try again.");
      } finally {
        setLoadingApps(false);
      }
    };

    fetchApps();
  }, [user]);

  // --- Helpers ---

  const formatDate = (ts?: Timestamp | null) => {
    if (!ts) return "";
    try {
      return ts.toDate().toLocaleDateString();
    } catch {
      return "";
    }
  };

  // --- Loading & auth states ---

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="text-xs text-sky-600 hover:underline mb-3"
          >
            ← Back
          </button>
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6">
            <p className="text-sm text-slate-600 mb-3">
              Please{" "}
              <Link href="/login" className="text-sky-600 underline">
                log in
              </Link>{" "}
              to view your applications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Main UI ---

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="text-xs text-sky-600 hover:underline mb-3"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          My applications
        </h1>
        <p className="text-sm text-slate-600 mb-4">
          These are the jobs you&apos;ve applied to as a freelancer.
        </p>

        {appsError && (
          <p className="text-sm text-rose-600 mb-3">{appsError}</p>
        )}

        {loadingApps ? (
          <p className="text-sm text-slate-500">Loading your applications…</p>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 mt-2">
            <p className="text-sm text-slate-600 mb-3">
              You haven&apos;t applied to any jobs yet.
            </p>
            <Link
              href="/jobs"
              className="inline-flex px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700"
            >
              Browse jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {app.jobTitle || "Job"}
                  </p>
                  <p className="text-xs text-slate-500 mb-1">
                    Client:{" "}
                    <span className="font-medium text-slate-800">
                      {app.clientEmail || "Unknown"}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Applied on{" "}
                    <span className="font-medium text-slate-800">
                      {formatDate(app.createdAt)}
                    </span>
                    {app.offerBudget != null && (
                      <>
                        {" "}
                        • Your offer:{" "}
                        <span className="font-medium text-slate-800">
                          ${app.offerBudget}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-1 text-xs">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full border text-[11px] font-semibold bg-sky-50 text-sky-700 border-sky-200 capitalize">
                    {app.status}
                  </span>
                  {app.jobId && (
                    <Link
                      href={`/jobs/${encodeURIComponent(app.jobId)}`}
                      className="text-xs text-sky-600 hover:text-sky-800 font-semibold"
                    >
                      View job
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



