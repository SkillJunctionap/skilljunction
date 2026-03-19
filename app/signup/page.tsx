"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setChecking(false);
        setLoadingRole(false);
        router.push("/login");
        return;
      }

      setUser(firebaseUser);

      try {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (snap.exists()) {
          const data = snap.data() as any;
          setRole(data.role ?? null);
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error(err);
        setRole(null);
      } finally {
        setChecking(false);
        setLoadingRole(false);
      }
    });

    return () => unsub();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Checking your session...</p>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <div className="bg-white shadow-md rounded-xl p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-2">
          Welcome to Skill Junction,
        </h1>
        <p className="text-sm text-gray-700 mb-2">{user.email}</p>

        {loadingRole ? (
          <p className="text-sm text-gray-500 mb-4">
            Loading your account type...
          </p>
        ) : role ? (
          <p className="text-sm text-gray-600 mb-4">
            Account type:{" "}
            <span className="font-semibold capitalize">
              {role}
            </span>
          </p>
        ) : (
          <p className="text-sm text-gray-600 mb-4">
            Account type: <span className="italic">not set</span>
          </p>
        )}

        <p className="text-sm text-gray-600 mb-4">
          Use the navigation below to get started.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => router.push("/jobs")}
            className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700"
          >
            Browse Jobs
          </button>
          {role === "client" && (
            <button
              onClick={() => router.push("/post-job")}
              className="px-4 py-2 rounded-lg border border-sky-600 text-sky-700 text-sm font-semibold hover:bg-sky-50"
            >
              Post a Job
            </button>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="mt-2 px-4 py-2 rounded-lg bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600"
        >
          Log out
        </button>
      </div>
    </div>
  );
}


