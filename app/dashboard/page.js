"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { collection, getDocs, limit, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Package, DollarSign, Wallet, Percent, Calendar, RefreshCw, ShoppingCart } from "lucide-react";

export default function DashboardOverview() {
  const { company, companyId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    stockValue: 0,
    retailValue: 0,
    totalRevenue: 0,
    totalProfit: 0,
  });
  const [recentSales, setRecentSales] = useState([]);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Items
      const itemsRef = collection(db, "companies", companyId, "items");
      const itemsSnap = await getDocs(itemsRef);
      
      let totalItems = 0;
      let stockValue = 0;
      let retailValue = 0;

      itemsSnap.forEach((doc) => {
        const item = doc.data();
        const qty = item.Quantity || 0;
        totalItems += qty;
        stockValue += (item.BuyingPrice || 0) * qty;
        retailValue += (item.SellingPrice || 0) * qty;
      });

      // 2. Fetch Sales
      const salesRef = collection(db, "companies", companyId, "sales");
      const salesSnap = await getDocs(salesRef);
      
      let totalRevenue = 0;
      let totalProfit = 0;

      salesSnap.forEach((doc) => {
        const sale = doc.data();
        totalRevenue += sale.TotalAmount || 0;
        totalProfit += sale.TotalProfit || 0;
      });

      setStats({
        totalItems,
        stockValue,
        retailValue,
        totalRevenue,
        totalProfit,
      });

      // 3. Fetch Recent Sales (last 5, sorted by Date desc)
      const recentSalesQuery = query(salesRef, orderBy("Date", "desc"), limit(5));
      const recentSnap = await getDocs(recentSalesQuery);
      const recent = [];
      recentSnap.forEach((doc) => {
        const sale = doc.data();
        // Handle firestore Timestamp conversion
        let saleDate = "";
        if (sale.Date) {
          if (sale.Date.toDate) {
            saleDate = sale.Date.toDate().toLocaleString();
          } else {
            saleDate = new Date(sale.Date).toLocaleString();
          }
        }
        recent.push({
          id: doc.id,
          ...sale,
          formattedDate: saleDate
        });
      });
      setRecentSales(recent);

    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError("Failed to fetch dashboard metrics. Check your Firestore database connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [companyId]);

  const formatCurrency = (amount) => {
    const currencySymbol = company?.Currency || "UGX";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencySymbol,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="animate-fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ width: "180px", height: "24px", backgroundColor: "var(--border)", borderRadius: "4px" }} className="pulse-loading"></div>
            <div style={{ width: "120px", height: "14px", backgroundColor: "var(--border)", borderRadius: "4px" }} className="pulse-loading"></div>
          </div>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card pulse-loading" style={{ height: "120px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}></div>
          ))}
        </div>
        <div className="table-container pulse-loading" style={{ height: "300px", backgroundColor: "var(--bg-card)" }}></div>
      </div>
    );
  }

  const marginPercent = stats.totalRevenue > 0 ? (stats.totalProfit / stats.totalRevenue) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }} className="animate-fade-in">
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.02em" }}>Business Dashboard</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Real-time performance metrics for <strong style={{ color: "var(--text-main)" }}>{company?.CompanyName}</strong>
          </p>
        </div>
        <button onClick={fetchDashboardData} className="btn-outline" style={{ gap: "8px", fontSize: "13px", padding: "8px 16px" }}>
          <RefreshCw size={14} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px dashed var(--danger)", borderRadius: "12px", padding: "16px", color: "var(--danger)", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="stats-grid">
        {/* Total Stock Items */}
        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Inventory Stock</span>
            <div style={{ backgroundColor: "rgba(99,102,241,0.1)", color: "var(--primary)", padding: "8px", borderRadius: "10px" }}>
              <Package size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", marginTop: "12px" }}>{stats.totalItems.toLocaleString()}</h2>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total units in warehouse</span>
        </div>

        {/* Stock Valuation */}
        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Stock Valuation</span>
            <div style={{ backgroundColor: "rgba(234,179,8,0.1)", color: "var(--accent)", padding: "8px", borderRadius: "10px" }}>
              <Wallet size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", marginTop: "12px" }}>{formatCurrency(stats.stockValue)}</h2>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Potential retail: {formatCurrency(stats.retailValue)}
          </span>
        </div>

        {/* Total Revenue */}
        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Total Revenue</span>
            <div style={{ backgroundColor: "rgba(16,185,129,0.1)", color: "var(--success)", padding: "8px", borderRadius: "10px" }}>
              <DollarSign size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", marginTop: "12px" }}>{formatCurrency(stats.totalRevenue)}</h2>
          <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: "600" }}>Accumulated Sales</span>
        </div>

        {/* Net Profit */}
        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Net Profit</span>
            <div style={{ backgroundColor: "rgba(99,102,241,0.1)", color: "var(--primary)", padding: "8px", borderRadius: "10px" }}>
              <Percent size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", marginTop: "12px" }}>{formatCurrency(stats.totalProfit)}</h2>
          <span style={{ fontSize: "12px", color: "var(--primary)", fontWeight: "600" }}>
            Margin: {marginPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Main Dashboard Layout Split */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
        
        {/* Recent Transactions Card */}
        <div className="table-container">
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Recent Transactions</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>Latest sales synchronized from POS systems</p>
            </div>
            <ShoppingCart size={18} style={{ color: "var(--primary)" }} />
          </div>

          <div className="table-wrapper">
            {recentSales.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                No sales records found. Sync your Game Changer desktop software first.
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Date</th>
                    <th>Cashier</th>
                    <th>Gross Amount</th>
                    <th>Net Profit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td style={{ fontWeight: "700" }}>#{sale.ReceiptNumber}</td>
                      <td>{sale.formattedDate}</td>
                      <td>{sale.CashierName || "System"}</td>
                      <td style={{ fontWeight: "600" }}>{formatCurrency(sale.TotalAmount)}</td>
                      <td style={{ color: "var(--success)", fontWeight: "600" }}>
                        +{formatCurrency(sale.TotalProfit)}
                      </td>
                      <td>
                        <span className="badge badge-success">Completed</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
