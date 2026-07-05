import React, { useState } from "react";
import { Sparkles, User, Key, ArrowRight, CornerDownRight } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (username: string, fullName: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isRegister ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegister 
      ? { username, password, fullName }
      : { username, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Please try again.");
      }

      if (isRegister) {
        // Automatically transition to log in or directly authenticate
        // For smoother user experience, let's auto-authenticate on successful sign-up!
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          onLoginSuccess(loginData.username, loginData.fullName);
        } else {
          setIsRegister(false);
          setError("Account created successfully! Please sign in.");
        }
      } else {
        onLoginSuccess(data.username, data.fullName);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#1A1A1A] flex flex-col justify-center items-center p-4 antialiased selection:bg-[#1A1A1A]/10">
      
      {/* Brand Watermark */}
      <div className="mb-10 text-center max-w-sm">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#1A1A1A]/40 block mb-2">
          Financial Intelligence Platform
        </span>
        <h1 className="text-5xl font-serif italic tracking-tight text-[#1A1A1A]">
          BudgetWise
        </h1>
        <p className="text-[11px] font-mono mt-3 text-[#1A1A1A]/60 leading-relaxed">
          Secure multi-user double-entry ledger with real-time AI-driven classification and anomaly monitoring.
        </p>
      </div>

      {/* Main Authentic Card */}
      <div className="w-full max-w-md bg-white border border-[#1A1A1A] p-8 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] relative overflow-hidden transition-all duration-300">
        
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-50 border-b border-l border-[#1A1A1A] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#1A1A1A]/60 animate-pulse" />
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-[#1A1A1A]/10 pb-6 mb-6">
          <button
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-center cursor-pointer transition-all border-b-2 ${
              !isRegister 
                ? "border-[#1A1A1A] text-[#1A1A1A]" 
                : "border-transparent text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            className={`flex-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-center cursor-pointer transition-all border-b-2 ${
              isRegister 
                ? "border-[#1A1A1A] text-[#1A1A1A]" 
                : "border-transparent text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
            }`}
          >
            Register Account
          </button>
        </div>

        <h2 className="font-serif italic text-2xl text-[#1A1A1A] mb-2 flex items-center gap-2">
          {isRegister ? "Create Credentials" : "Access Your Workspace"}
        </h2>
        <p className="text-[10px] text-[#1A1A1A]/60 font-mono mb-6">
          {isRegister 
            ? "Enter your details to provision a clean workspace." 
            : "Use your private keys to decrypt your ledger database."}
        </p>

        {error && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 p-4 mb-6 text-xs font-mono flex items-start gap-2">
            <CornerDownRight className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/60 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-[#1A1A1A]/30" />
                <input
                  type="text"
                  placeholder="e.g. Sourav Biswas"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#1A1A1A]/20 text-xs font-medium text-[#1A1A1A] placeholder-[#1A1A1A]/30 focus:outline-none focus:border-[#1A1A1A] transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/60 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-4 h-4 text-[#1A1A1A]/30" />
              <input
                type="text"
                placeholder="Enter username"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#1A1A1A]/20 text-xs font-mono text-[#1A1A1A] placeholder-[#1A1A1A]/30 focus:outline-none focus:border-[#1A1A1A] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/60 mb-2">
              Password
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-3.5 w-4 h-4 text-[#1A1A1A]/30" />
              <input
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#1A1A1A]/20 text-xs font-mono text-[#1A1A1A] placeholder-[#1A1A1A]/30 focus:outline-none focus:border-[#1A1A1A] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#1A1A1A] text-white hover:bg-neutral-800 border border-[#1A1A1A] rounded-none transition-all text-[11px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_rgba(26,26,26,0.2)] disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isRegister ? "Register & Enter" : "Authorize Session"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-8 pt-6 border-t border-[#1A1A1A]/10 text-center">
          <p className="text-[10px] font-mono text-[#1A1A1A]/50">
            Demo Account Username: <strong className="text-[#1A1A1A]/80 font-semibold">soubisouma</strong> / Password: <strong className="text-[#1A1A1A]/80 font-semibold">password123</strong>
          </p>
        </div>
      </div>

      {/* Outer elegant footer */}
      <div className="mt-12 text-[10px] font-mono text-[#1A1A1A]/40 flex gap-6">
        <span>Local Storage Cached</span>
        <span>•</span>
        <span>256-bit Cryptography Mock</span>
      </div>
    </div>
  );
}
