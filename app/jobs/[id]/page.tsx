"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { db, auth } from "@/lib/firebase";

interface Job {
  title: string;
  description: string;
  category?: string;
  budget?: number;
  clientEmail?: string;
  createdBy?: string;
}

export default function JobPage() {
  const params = useParams();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [offerBudget, setOfferBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [proposal, setProposal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecked(true);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const id = params?.id;

    if (!id || Array.isArray(id)) {
      setLoading(false);
      return;
    }

    setJobId(id);

    const fetchJob = async () => {
      try {
        const docRef = doc(db, "jobs", id);
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

  const handleApply = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      router.push("/login");
      return;
    }

    if (!job || !jobId) {
      setMessage("Job details are missing.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      await addDoc(collection(db, "applications"), {
        jobId,
        jobTitle: job.title ?? "",
        applicantUid: user.uid,
        applicantEmail: user.email ?? "",
        clientEmail: job.clientEmail ?? "",
        offerBudget: offerBudget ? Number(offerBudget) : null,
        timeline: timeline || "",
        proposal: proposal || "",
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setOfferBudget("");
      setTimeline("");
      setProposal("");
      setMessage("Application submitted successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Could not submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Loading job...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <h1 className="text-2xl font-bold mb-3 text-slate-900">Job not found</h1>
        <button
          onClick={() => router.push("/jobs")}
          className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700"
        >
          Back to jobs
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            {job.title}
          </h1>

          {job.category && (
            <p className="text-sm text-slate-600 mb-2">
              <span className="font-medium">Category:</span> {job.category}
            </p>
          )}

          {typeof job.budget === "number" && (
            <p className="text-sm text-slate-600 mb-2">
              <span className="font-medium">Budget:</span> ${job.budget}
            </p>
          )}

          {job.clientEmail && (
            <p className="text-sm text-slate-600 mb-4">
              <span className="font-medium">Client:</span> {job.clientEmail}
            </p>
          )}

          <div className="mb-8">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">
              Job description
            </h2>
            <p className="text-slate-700 whitespace-pre-line">
              {job.description}
            </p>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Apply for this job
            </h2>

            {!authChecked ? (
              <p className="text-sm text-slate-500">Checking account...</p>
            ) : !user ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Please log in to apply for this job.
                </p>
                <button
                  onClick={() => router.push("/login")}
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700"
                >
                  Go to login
                </button>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Your offer amount
                  </label>
                  <input
                    type="number"
                    value={offerBudget}
                    onChange={(e) => setOfferBudget(e.target.value)}
                    placeholder="Enter your offer"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Timeline
                  </label>
                  <input
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="Example: 3 days"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Proposal
                  </label>
                  <textarea
                    value={proposal}
                    onChange={(e) => setProposal(e.target.value)}
                    placeholder="Tell the client why you're a good fit"
                    rows={5}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Apply now"}
                </button>

                {message && (
                  <p className="text-sm text-slate-700">{message}</p>
                )}
              </form>
            )}
          </div>

          <button
            onClick={() => router.push("/jobs")}
            className="mt-8 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Back to browse jobs
          </button>
        </div>
      </div>
    </div>
  );
}









