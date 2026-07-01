"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, AlertTriangle, ArrowRight, Lock } from "lucide-react";

export default function LoginPage() {
  const { user, loading, companyId, error: authError, signInWithEmail, signInWithGoogle, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && companyId) {
      router.push("/dashboard");
    }
  }, [user, loading, companyId, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError("Please enter both email and password.");
      return;
    }
    setIsSubmitting(true);
    setLocalError(null);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      console.error(err);
      setLocalError(err.message || "Invalid login credentials. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
      setLocalError(err.message || "Google sign-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "16px" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", border: "4px solid var(--border)", borderTopColor: "var(--primary)" }} className="pulse-loading"></div>
        <p style={{ color: "var(--text-muted)", fontSize: "16px" }}>Establishing secure connection...</p>
      </div>
    );
  }

  // 2. Logged in but No Company associated (Unauthorized)
  if (user && !companyId && !loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px" }}>
        <div className="glass animate-fade-in" style={{ maxWidth: "480px", width: "100%", borderRadius: "24px", padding: "40px", textAlign: "center", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ margin: "0 auto", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", padding: "16px", borderRadius: "50%", width: "72px", height: "72px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={36} />
          </div>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "8px" }}>Access Denied</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
              Logged in as <strong style={{ color: "var(--text-main)" }}>{user.email}</strong>.
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", marginTop: "12px" }}>
              This account is not registered as an Owner or Manager of any business in Game Changer POS. Please sign in with the owner account synced on your desktop software.
            </p>
          </div>
          
          {authError && (
            <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px dashed var(--danger)", borderRadius: "8px", padding: "12px", color: "var(--danger)", fontSize: "13px" }}>
              {authError}
            </div>
          )}

          <button onClick={logout} className="btn-primary" style={{ width: "100%" }}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // 3. Login Screen
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px", position: "relative" }}>
      {/* Background blobs for premium depth */}
      <div style={{ position: "absolute", width: "300px", height: "300px", backgroundColor: "rgba(99, 102, 241, 0.15)", filter: "blur(100px)", top: "10%", left: "10%", borderRadius: "50%" }}></div>
      <div style={{ position: "absolute", width: "300px", height: "300px", backgroundColor: "rgba(234, 179, 8, 0.1)", filter: "blur(100px)", bottom: "10%", right: "10%", borderRadius: "50%" }}></div>

      <div className="glass animate-fade-in" style={{ maxWidth: "440px", width: "100%", borderRadius: "24px", padding: "48px 40px", display: "flex", flexDirection: "column", gap: "32px", zIndex: 10 }}>
        
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <div style={{ margin: "0 auto 16px", backgroundColor: "var(--primary)", color: "#fff", width: "50px", height: "50px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "800", boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)" }}>
            GC
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", letterSpacing: "-0.02em", marginBottom: "6px" }}>Game Changer</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Business Owner Cloud Portal</p>
        </div>

        {/* Local/Auth Errors */}
        {(localError || authError) && (
          <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px dashed var(--danger)", borderRadius: "8px", padding: "12px", color: "var(--danger)", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={16} />
            <span>{localError || authError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label className="input-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-muted)" }} />
              <input 
                type="email" 
                placeholder="owner@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field" 
                style={{ paddingLeft: "44px" }}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="input-label">Password</label>
            <div style={{ position: "relative" }}>
              <KeyRound size={18} style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-muted)" }} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field" 
                style={{ paddingLeft: "44px" }}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: "100%", height: "46px" }} disabled={isSubmitting}>
            {isSubmitting ? "Authenticating..." : "Sign In"}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }}></div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>OR</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }}></div>
        </div>

        {/* Google Sign In */}
        <button 
          onClick={handleGoogleSignIn} 
          className="btn-outline" 
          style={{ width: "100%", height: "46px", gap: "10px", fontSize: "14px" }}
          disabled={isSubmitting}
        >
          {/* Custom Google logo */}
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continue with Google
        </button>

        {/* Footer */}
        <div style={{ textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "var(--text-muted)", fontSize: "12px" }}>
          <Lock size={12} />
          <span>Only authorized business credentials allowed.</span>
        </div>
      </div>
    </div>
  );
}
