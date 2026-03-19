"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

type ChatSummary = {
  id: string;
  jobId?: string;
  lastMessage?: string;
  lastMessageAt?: any;
  clientUid?: string;
  freelancerUid?: string;
};

export default function MessagesInboxPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
    });
    return () => unsub();
  }, []);

  // Load chats for this user
  useEffect(() => {
    const loadChats = async () => {
      if (!user) {
        setChats([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const chatsRef = collection(db, "chats");

        // You might be client OR freelancer on a chat, so we query both.
        const qAsClient = query(chatsRef, where("clientUid", "==", user.uid));
        const qAsFreelancer = query(
          chatsRef,
          where("freelancerUid", "==", user.uid)
        );

        const [snapClient, snapFreelancer] = await Promise.all([
          getDocs(qAsClient),
          getDocs(qAsFreelancer),
        ]);

        const listMap = new Map<string, ChatSummary>();

        snapClient.forEach((docSnap) => {
          const data = docSnap.data() as any;
          listMap.set(docSnap.id, {
            id: docSnap.id,
            jobId: data.jobId,
            lastMessage: data.lastMessage,
            lastMessageAt: data.lastMessageAt,
            clientUid: data.clientUid,
            freelancerUid: data.freelancerUid,
          });
        });

        snapFreelancer.forEach((docSnap) => {
          const data = docSnap.data() as any;
          listMap.set(docSnap.id, {
            id: docSnap.id,
            jobId: data.jobId,
            lastMessage: data.lastMessage,
            lastMessageAt: data.lastMessageAt,
            clientUid: data.clientUid,
            freelancerUid: data.freelancerUid,
          });
        });

        let list = Array.from(listMap.values());

        // Sort newest first by lastMessageAt, fallback to unsorted
        list.sort((a, b) => {
          const ta =
            a.lastMessageAt?.toDate?.() instanceof Date
              ? a.lastMessageAt.toDate().getTime()
              : 0;
          const tb =
            b.lastMessageAt?.toDate?.() instanceof Date
              ? b.lastMessageAt.toDate().getTime()
              : 0;
          return tb - ta;
        });

        setChats(list);
      } catch (err) {
        console.error(err);
        setError("Could not load your messages.");
      } finally {
        setLoading(false);
      }
    };

    // Only load after we know auth state
    if (user !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      loadChats();
    }
  }, [user]);

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center max-w-sm">
          <p className="text-sm text-slate-600 mb-3">
            Please log in to view your messages.
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="text-xs text-sky-600 hover:underline mb-3"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Messages
        </h1>
        <p className="text-sm text-slate-500 mb-4">
          View all your active conversations as a client or freelancer.
        </p>

        {loading ? (
          <p className="text-sm text-slate-500">Loading your chats…</p>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : chats.length === 0 ? (
          <p className="text-sm text-slate-500">
            You don&apos;t have any conversations yet. Once a contract is
            accepted, your chat will appear here.
          </p>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => {
              const isClient = chat.clientUid === user.uid;
              const roleLabel = isClient ? "You are the client" : "You are the freelancer";

              let lastText = chat.lastMessage || "No messages yet.";
              if (lastText.length > 80) {
                lastText = lastText.slice(0, 77) + "...";
              }

              let timeLabel = "";
              if (chat.lastMessageAt?.toDate) {
                const d = chat.lastMessageAt.toDate() as Date;
                timeLabel = d.toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
              }

              return (
                <Link
                  key={chat.id}
                  href={`/messages/${chat.id}`}
                  className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-sky-400 hover:shadow-sm transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-900">
                      Contract chat
                    </p>
                    {timeLabel && (
                      <p className="text-[11px] text-slate-400">
                        {timeLabel}
                      </p>
                    )}
                  </div>
                  {chat.jobId && (
                    <p className="text-xs text-slate-500 mb-1">
                      Job ID:{" "}
                      <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                        {chat.jobId}
                      </span>
                    </p>
                  )}
                  <p className="text-xs text-slate-600 mb-1">{lastText}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {roleLabel}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
