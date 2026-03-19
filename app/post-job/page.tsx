"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function PostJobPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Only logged-in users can post jobs
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError("Please fill in a title and description.");
      return;
    }

    const numericBudget = Number(budget);
    if (Number.isNaN(numericBudget) || numericBudget < 0) {
      setError("Please enter a valid budget.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await addDoc(collection(db, "jobs"), {
        title: title.trim(),
        description: description.trim(),
        budget: numericBudget,
        createdBy: user.email ?? null,
        createdByUid: user.uid,
        createdAt: serverTimestamp(),
      });

      // After successful post, go to Browse Jobs
      router.push("/jobs");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while posting the job. Please try again.");
      setSubmitting(false);
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
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Post a Job</h1>
            {user && (
              <p className="text-sm text-slate-600 mt-1">
                Posting as {user.email}
              </p>
            )}
          </div>
          <Link
            href="/jobs"
            className="text-sm text-sky-600 hover:underline"
          >
            ← Back to jobs
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
          {error && (
            <p className="mb-4 text-sm text-rose-600">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">
                Job title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="e.g. Virtual Assistant for small business"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">
                Job description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[120px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="Describe the tasks, skills needed, tools, and timeline."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">
                Budget (USD)
              </label>
              <input
                type="number"
                min={0}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="120"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Posting…" : "Post job"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/jobs")}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

