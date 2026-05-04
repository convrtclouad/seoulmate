"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseClient();
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authErr) {
      setError(authErr.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-korean-cream">
      {/* Hero gradient */}
      <div className="h-56 bg-korean-gradient flex flex-col items-center justify-end pb-8">
        <div className="text-6xl mb-2">🇰🇷</div>
        <h1 className="text-3xl font-black text-white tracking-tight">SeoulMate</h1>
        <p className="text-white/80 text-sm mt-1">Your Korea Travel Companion</p>
      </div>

      {/* Form card */}
      <div className="flex-1 px-5 -mt-6">
        <div className="card shadow-card-hover">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Welcome back 👋</h2>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2">
              Sign In
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            New to SeoulMate?{" "}
            <Link href="/signup" className="font-semibold text-primary-500 hover:underline">
              Create account
            </Link>
          </p>
        </div>

        {/* Demo hint */}
        <p className="mt-4 text-center text-xs text-gray-400">
          Set up your Supabase project and add credentials to{" "}
          <span className="font-mono">.env.local</span>
        </p>
      </div>
    </div>
  );
}
