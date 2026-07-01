"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, TrendingUp, LogOut, Menu, X, Building2, User } from "lucide-react";

export default function DashboardLayout({ children }) {
  const { user, loading, company, companyId, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !companyId)) {
      router.push("/");
    }
  }, [user, loading, companyId, router]);

  if (loading || !user || !companyId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "16px" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", border: "4px solid var(--border)", borderTopColor: "var(--primary)" }} className="pulse-loading"></div>
        <p style={{ color: "var(--text-muted)", fontSize: "16px" }}>Verifying security credentials...</p>
      </div>
    );
  }

  const navLinks = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/inventory", label: "Inventory", icon: Package },
    { href: "/dashboard/reports", label: "Reports", icon: TrendingUp },
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar for Desktop */}
      <aside className={`sidebar ${mobileMenuOpen ? "open" : ""}`} style={{
        left: mobileMenuOpen ? "0" : "",
        transform: mobileMenuOpen ? "translateX(0)" : "",
        transition: "transform 0.3s ease",
      }}>
        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px", padding: "0 8px" }}>
          <div style={{ backgroundColor: "var(--primary)", color: "#fff", width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "800" }}>
            GC
          </div>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "700", letterSpacing: "-0.01em" }}>Game Changer</h2>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500" }}>Cloud Portal</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)} 
            style={{ display: "none", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", marginLeft: "auto" }}
            className="mobile-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Company Box */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "24px" }}>
          <Building2 size={18} style={{ color: "var(--primary)" }} />
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
              {company?.CompanyName || "My Business"}
            </p>
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              ID: {companyId.substring(0, 8)}...
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          {navLinks.map((link) => {
            const LinkIcon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: isActive ? "600" : "500",
                  color: isActive ? "#fff" : "var(--text-muted)",
                  backgroundColor: isActive ? "var(--primary)" : "transparent",
                  transition: "background-color 0.2s ease, color 0.2s ease",
                  textDecoration: "none"
                }}
                className={!isActive ? "nav-link-hover" : ""}
              >
                <LinkIcon size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
              <User size={16} />
            </div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                {user.displayName || user.email.split("@")[0]}
              </p>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.email}
              </span>
            </div>
          </div>

          <button onClick={logout} className="btn-outline" style={{ width: "100%", justifyContent: "flex-start", gap: "12px", padding: "10px 16px", borderRadius: "10px", borderColor: "transparent", color: "var(--danger)", backgroundColor: "rgba(239,68,68,0.05)" }}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <header className="mobile-header" style={{
        display: "none",
        width: "100%",
        height: "60px",
        backgroundColor: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
        alignItems: "center",
        padding: "0 20px",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          style={{ background: "none", border: "none", color: "var(--text-main)", cursor: "pointer" }}
        >
          <Menu size={24} />
        </button>
        <span style={{ fontSize: "16px", fontWeight: "700", marginLeft: "16px" }}>Game Changer POS</span>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {children}
      </main>

      {/* Custom styles override for layout */}
      <style jsx global>{`
        .nav-link-hover:hover {
          background-color: var(--bg-hover) !important;
          color: var(--text-main) !important;
        }
        @media (max-width: 768px) {
          .mobile-header {
            display: flex !important;
          }
          .sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            transform: translateX(-100%) !important;
            height: 100vh !important;
            width: 280px !important;
            box-shadow: 10px 0 30px rgba(0,0,0,0.5);
          }
          .sidebar.open {
            transform: translateX(0) !important;
          }
          .mobile-close-btn {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
