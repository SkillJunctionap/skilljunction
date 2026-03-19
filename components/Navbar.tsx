"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
    });
    return () => unsub();
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);
      router.push("/login");
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: logo / brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-sky-600 flex items-center justify-center text-white text-sm font-bold">
            SJ
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">
              Skill Junction
            </p>
            <p className="text-[11px] text-slate-500">
              Caribbean talent • Global demand
            </p>
          </div>
        </Link>

                {/* Center: main nav */}
        <nav className="hidden sm:flex items-center gap-4 text-xs font-medium">
          <Link
            href="/jobs"
            className={
              isActive("/jobs")
                ? "text-sky-700"
                : "text-slate-600 hover:text-slate-900"
            }
          >
            Browse jobs
          </Link>

          <Link
            href="/my-jobs"
            className={
              isActive("/my-jobs")
                ? "text-sky-700"
                : "text-slate-600 hover:text-slate-900"
            }
          >
            My jobs
          </Link>

          <Link
            href="/my-applications"
            className={
              isActive("/my-applications")
                ? "text-sky-700"
                : "text-slate-600 hover:text-slate-900"
            }
          >
            My applications
          </Link>

          <Link
            href="/messages"
            className={
              isActive("/messages")
                ? "text-sky-700"
                : "text-slate-600 hover:text-slate-900"
            }
          >
            Messages
          </Link>
        </nav>


        {/* Right: auth area */}
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link
                href="/login"
                className="text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-700"
              >
                Sign up
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[11px] text-slate-500">
                  Signed in as
                </span>
                <span className="text-[11px] font-medium text-slate-800 max-w-[160px] truncate">
                  {user.email}
                </span>
              </div>
              <Link
                href="/dashboard"
                className={
                  isActive("/dashboard")
                    ? "hidden sm:inline-block text-xs font-medium text-sky-700"
                    : "hidden sm:inline-block text-xs font-medium text-slate-600 hover:text-slate-900"
                }
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-xs font-medium text-rose-600 hover:text-rose-700"
              >
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


