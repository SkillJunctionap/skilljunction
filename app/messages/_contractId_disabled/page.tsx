"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";

type Chat = {
  id: string;
  contractId: string;
  jobId: string;
  clientUid: string;
  freelancerUid: string;
};

type ChatMessage = {
  id: string;
  senderUid: string;
  senderEmail?: string | null;
  text: string;
  timestamp?: any;
};

export default function ContractChatPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = (params?.contractId as string) || "";

  const [user, setUser] = useState<User | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // --- Auth listener ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
    });
    return () => unsub();
  }, []);

  // --- Load chat + subscribe to messages ---
  useEffect(() => {
    if (!contractId) return;

    const loadChatAndMessages = async () => {
      setLoading(true);
      setError("");

      try {
        // 1) Load chat document
        const chatRef = doc(db, "chats", contractId);
        const snap = await getDoc(chatRef);

        if (!snap.exists()) {
          setError("This chat does not exist.");
          setLoading(false);
          return;
        }

        const data = snap.data() as any;
        const chatData: Chat = {
          id: snap.id,
          contractId: data.contractId || contractId,
          jobId: data.jobId,
          clientUid: data.clientUid || data.clientId,
          freelancerUid: data.freelancerUid || data.freelancerId,
        };
        setChat(chatData);

        // 2) Subscribe to messages for this chat
        const msgsRef = collection(db, "chats", contractId, "messages");
        const q = query(msgsRef, orderBy("timestamp", "asc"));

        const unsubMsgs = onSnapshot(q, (snapshot) => {
          const list: ChatMessage[] = [];
          snapshot.forEach((docSnap) => {
            const m = docSnap.data() as any;
            list.push({
              id: docSnap.id,
              senderUid: m.senderUid,
              senderEmail: m.senderEmail ?? null,
              text: m.text,
              timestamp: m.timestamp,
            });
          });
          setMessages(list);
          setLoading(false);
        });

        return () => unsubMsgs();
      } catch (err) {
        console.error(err);
        setError("Could not load this chat.");
        setLoading(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadChatAndMessages();
  }, [contractId]);

  const handleSend = async (e: FormEvent) => {
  e.preventDefault();
  setError("");

  if (!user) {
    setError("You must be logged in to send messages.");
    return;
  }
  if (!chat) {
    setError("Chat is not ready yet.");
    return;
  }

  const trimmed = draft.trim();
  if (!trimmed) return;

  try {
    setSending(true);

    // 1) Add message to messages subcollection
    const msgsRef = collection(db, "chats", contractId, "messages");
    await addDoc(msgsRef, {
      senderUid: user.uid,
      senderEmail: user.email ?? null,
      text: trimmed,
      timestamp: serverTimestamp(),
    });

    // 2) Update the chat summary (for inbox view)
    const chatRef = doc(db, "chats", contractId);
    await updateDoc(chatRef, {
      lastMessage: trimmed,
      lastMessageAt: serverTimestamp(),
    });

    setDraft("");
  } catch (err) {
    console.error(err);
    setError("Could not send message. Please try again.");
  } finally {
    setSending(false);
  }
};


  const formattedMessages = messages.map((msg) => {
    let time = "";
    if (msg.timestamp?.toDate) {
      const d = msg.timestamp.toDate() as Date;
      time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return { ...msg, formattedTime: time };
  });

  const otherPartyLabel =
    user && chat
      ? user.uid === chat.clientUid
        ? "Your freelancer"
        : "Your client"
      : "Chat partner";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Top bar / breadcrumbs */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.back()}
              className="text-xs font-medium text-sky-600 hover:underline"
            >
              ← Back
            </button>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Messages
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Keep all project communication and agreements inside Skill
              Junction.
            </p>
          </div>

          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
              Contract / Chat ID
            </p>
            <p className="mt-1 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-mono text-slate-600 max-w-xs truncate">
              {contractId}
            </p>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[540px]">
          {/* Header inside card */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Contract discussion
              </p>
              <p className="text-xs text-slate-500">
                {otherPartyLabel} will appear here once they join the chat.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-100">
              Protected chat
            </span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/70">
            {loading ? (
              <p className="text-xs text-slate-500 text-center mt-8">
                Loading messages…
              </p>
            ) : formattedMessages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center mt-8">
                No messages yet. Start the conversation by sending a message
                below.
              </p>
            ) : (
              formattedMessages.map((msg) => {
                const isMe = user && msg.senderUid === user.uid;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                        isMe
                          ? "bg-sky-600 text-white rounded-br-md"
                          : "bg-white text-slate-900 border border-slate-200 rounded-bl-md"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          isMe ? "text-sky-100/80" : "text-slate-400"
                        } text-right`}
                      >
                        {msg.formattedTime}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="border-t border-slate-100 bg-white px-4 py-3 flex items-end gap-3"
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
            />

            <button
              type="submit"
              disabled={!draft.trim() || sending}
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </form>

          {error && (
            <p className="px-5 pb-3 text-[11px] text-rose-600">{error}</p>
          )}
        </div>

        <p className="mt-3 text-[11px] text-slate-400">
          Chat is saved securely in Firestore. Only the client and freelancer
          on this contract can see these messages.
        </p>
      </div>
    </main>
  );
}


