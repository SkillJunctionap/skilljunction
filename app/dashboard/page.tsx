"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

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

export default function DashboardPage() {

  const router = useRouter();

  const [user,setUser] = useState<User | null>(null);
  const [checkingAuth,setCheckingAuth] = useState(true);

  const [applications,setApplications] = useState<Application[]>([]);
  const [loadingApps,setLoadingApps] = useState(true);
  const [error,setError] = useState("");


// Protect dashboard: only logged-in users
useEffect(()=>{

const unsub = onAuthStateChanged(auth,(firebaseUser)=>{

if(firebaseUser){

setUser(firebaseUser);

}else{

router.push("/login");

}

setCheckingAuth(false);

});

return ()=>unsub();

},[router]);



  // Load applications for this freelancer
useEffect(()=>{

if(!user) return;

const fetchApplications = async()=>{

setLoadingApps(true);
setError("");

try{

const q = query(
collection(db,"applications"),
where("applicantUid","==",user.uid)
);

const snap = await getDocs(q);

const list:Application[] = [];

snap.forEach((docSnap)=>{

const data = docSnap.data() as any;

list.push({

id:docSnap.id,
jobId:data.jobId ?? null,
jobTitle:data.jobTitle ?? null,
clientEmail:data.clientEmail ?? null,
offerBudget: typeof data.offerBudget === "number"
? data.offerBudget
: null,
timeline:data.timeline ?? null,
status:data.status ?? "pending",
createdAt:(data.createdAt as Timestamp) ?? null,

});

});

list.sort((a,b)=>{

const aTime = a.createdAt?.toMillis?.() ?? 0;
const bTime = b.createdAt?.toMillis?.() ?? 0;

return bTime - aTime;

});

setApplications(list);

}catch(err){

console.error(err);
setError("Could not load your applications. Please try again.");

}finally{

setLoadingApps(false);

}

};

fetchApplications();

},[user]);



const formatDate = (ts?:Timestamp | null)=>{

if(!ts) return "";

try{

const d = ts.toDate();

return d.toLocaleDateString();

}catch{

return "";

}

};



const statusStyles = (status:string)=>{

const s = status.toLowerCase();

if(s==="accepted"){

return "bg-emerald-50 text-emerald-700 border-emerald-200";

}

if(s==="declined" || s==="rejected"){

return "bg-rose-50 text-rose-700 border-rose-200";

}

return "bg-sky-50 text-sky-700 border-sky-200";

};



if(checkingAuth){

return(

<div className="min-h-screen flex items-center justify-center bg-slate-50">

<p className="text-sm text-slate-500">
Checking your session…
</p>

</div>

);

}



if(!user) return null;



return (

<div className="min-h-screen bg-slate-50">

<div className="max-w-5xl mx-auto px-4 py-10">

{/* Header */}

<div className="flex items-center justify-between mb-6">

<div>

<h1 className="text-2xl font-bold text-slate-900">
Freelancer Dashboard
</h1>

<p className="text-sm text-slate-600 mt-1">
Logged in as <span className="font-medium">{user.email}</span>
</p>

</div>

<div className="flex gap-2">

<Link
href="/jobs"
className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100"
>
Browse jobs
</Link>

<Link
href="/post-job"
className="px-3 py-1.5 rounded-lg bg-sky-600 text-xs font-medium text-white hover:bg-sky-700"
>
Post a job
</Link>

</div>

</div>



{/* Applications section */}

<div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-7">

<div className="flex items-center justify-between mb-4">

<h2 className="text-sm font-semibold text-slate-900">
My applications
</h2>

{!loadingApps &&(

<p className="text-xs text-slate-500">

{applications.length===0
? "No applications yet."
: `${applications.length} application${applications.length>1 ? "s":""}`}

</p>

)}

</div>



{error &&(

<p className="mb-4 text-sm text-rose-600">
{error}
</p>

)}



{loadingApps ?(

<p className="text-sm text-slate-500">
Loading your applications…
</p>

): applications.length===0 ?(

<div className="text-sm text-slate-600">

<p>
You haven't applied to any jobs yet.
</p>

<p className="mt-1">

<Link
href="/jobs"
className="text-sky-600 font-medium hover:underline"
>
Browse jobs
</Link>

{" "}to send your first proposal.

</p>

</div>

):( 

<div className="space-y-3">

{applications.map((app)=>(

<div
key={app.id}
className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
>

<div>

<div className="flex flex-wrap items-center gap-2 mb-1">

<p className="text-sm font-semibold text-slate-900">
{app.jobTitle || "Untitled job"}
</p>

<span
className={`text-[11px] px-2 py-0.5 rounded-full border ${statusStyles(app.status)}`}
>

{app.status.charAt(0).toUpperCase()+app.status.slice(1)}

</span>

</div>

<div className="flex flex-wrap gap-3 text-[11px] text-slate-500">

{app.offerBudget!==null &&(

<span>

Your offer:
<span className="font-medium">
${app.offerBudget}
</span>

</span>

)}

{app.timeline &&(
<span>
Timeline: {app.timeline}
</span>
)}

{app.clientEmail &&(
<span>
Client: {app.clientEmail}
</span>
)}

{app.createdAt &&(

<span>
Applied on {formatDate(app.createdAt)}
</span>

)}

</div>

</div>



<div className="flex items-center gap-2 md:self-end">

{app.jobId &&(

<Link
href={`/jobs/${app.jobId}`}
className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100"
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

</div>

);

}


