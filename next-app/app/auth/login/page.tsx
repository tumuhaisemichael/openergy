"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    // @ts-ignore
    if (res?.error) {
      // @ts-ignore
      setError(res.error);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">Email</label>
          <input className="w-full mb-3 p-2 border rounded" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="block mb-2">Password</label>
          <input type="password" className="w-full mb-3 p-2 border rounded" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="w-full bg-green-600 text-white p-2 rounded">Sign in</button>
        </form>
        <div className="mt-4 text-sm">
          <a href="/auth/register" className="text-blue-600">Register</a> • <a href="/auth/forgot-password" className="text-blue-600">Forgot password</a>
        </div>
      </div>
    </div>
  );
}
