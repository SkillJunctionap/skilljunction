"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";

import { signInWithEmailAndPassword } from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

export default function LoginPage(){

const router = useRouter();

const [form,setForm] = useState({

email:"",

password:""

});

const [loading,setLoading] = useState(false);

const [error,setError] = useState("");



const handleChange = (e:ChangeEvent<HTMLInputElement>)=>{

setForm(prev=>({

...prev,

[e.target.name]:e.target.value

}));

};



const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const userCred = await signInWithEmailAndPassword(
      auth,
      form.email,
      form.password
    );

    const user = userCred.user;

    const snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists()) {
      const data = snap.data() as any;

      if (data.role === "client") {
        router.push("/client-dashboard");
      } else {
        router.push("/dashboard");
      }
    } else {
      router.push("/dashboard");
    }
  } catch (err) {
    console.error(err);
    setError("Invalid email or password");
  }

  setLoading(false);
};



return(

<div className="min-h-screen flex items-center justify-center bg-slate-100">

<div className="w-full max-w-md bg-white shadow-md rounded-xl p-6">

<h1 className="text-2xl font-bold mb-4 text-center">

Login to Skill Junction

</h1>



<form onSubmit={handleSubmit} className="space-y-4">

<div>

<label className="block mb-1 text-sm font-medium text-gray-700">

Email

</label>



<input

type="email"

name="email"

value={form.email}

onChange={handleChange}

required

className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"

/>

</div>



<div>

<label className="block mb-1 text-sm font-medium text-gray-700">

Password

</label>



<input

type="password"

name="password"

value={form.password}

onChange={handleChange}

required

className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"

/>

</div>



{error &&(

<p className="text-sm text-red-500">

{error}

</p>

)}



<button

type="submit"

disabled={loading}

className="w-full py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 transition disabled:opacity-60"

>

{loading ? "Logging in..." : "Log In"}

</button>



</form>



<p className="mt-4 text-sm text-center text-gray-600">

Don't have an account?

<span

onClick={()=>router.push("/signup")}

className="text-sky-600 hover:underline cursor-pointer ml-1"

>

Sign up

</span>

</p>



</div>

</div>

);

}
