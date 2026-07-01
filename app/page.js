"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Mail, AlertTriangle, ArrowRight, Lock, Shield } from "lucide-react";

export default function LoginPage() {
  const { user, loading, companyId, error: authError, signInWithEmail, logout } = useAuth();
  const [email, setEmail] = useState("");
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
    if (!email) {
      setLocalError("Please enter your email address.");
      return;
    }
    setIsSubmitting(true);
    setLocalError(null);
    try {
      await signInWithEmail(email);
    } catch (err) {
      console.error(err);
      setLocalError(err.message || "Unable to find a business account for this email.");
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
            <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "8px" }}>Account Not Found</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
              No business found for <strong style={{ color: "var(--text-main)" }}>{user.email}</strong>.
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", marginTop: "12px" }}>
              Make sure you have synced your desktop software at least once, then try signing in with the same email used in the desktop app.
            </p>
          </div>
          
          {authError && (
            <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px dashed var(--danger)", borderRadius: "8px", padding: "12px", color: "var(--danger)", fontSize: "13px" }}>
              {authError}
            </div>
          )}

          <button onClick={logout} className="btn-primary" style={{ width: "100%" }}>
            Try Another Email
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
            <label className="input-label">Business Email Address</label>
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
            <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "6px" }}>
              Enter the email address used in your desktop POS software.
            </p>
          </div>

          <button type="submit" className="btn-primary" style={{ width: "100%", height: "46px" }} disabled={isSubmitting}>
            {isSubmitting ? "Verifying Account..." : "Access Dashboard"}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Security Info */}
        <div style={{ backgroundColor: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.15)", borderRadius: "12px", padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <Shield size={18} style={{ color: "var(--primary)", flexShrink: 0, marginTop: "2px" }} />
          <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.5" }}>
            <strong style={{ color: "var(--text-main)" }}>How it works:</strong> Your desktop POS software syncs business data to the cloud. This portal lets you view your inventory and reports from anywhere using the same email.
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "var(--text-muted)", fontSize: "12px" }}>
          <Lock size={12} />
          <span>Only authorized business emails allowed.</span>
        </div>
      </div>
    </div>
  );
}
