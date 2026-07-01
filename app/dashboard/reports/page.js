"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TrendingUp, RefreshCw, BarChart2, Calendar, FileSpreadsheet, ArrowUpRight } from "lucide-react";

export default function ReportsPage() {
  const { company, companyId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [timeRange, setTimeRange] = useState("30"); // "7", "30", "month", "ytd", "all"
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState({
    salesCount: 0,
    totalRevenue: 0,
    totalProfit: 0,
    avgSale: 0,
    margin: 0
  });

  const fetchSalesData = async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const salesRef = collection(db, "companies", companyId, "sales");
      const snap = await getDocs(salesRef);
      const loadedSales = [];

      snap.forEach((doc) => {
        const sale = doc.data();
        let saleDate = null;
        if (sale.Date) {
          if (sale.Date.toDate) {
            saleDate = sale.Date.toDate();
          } else {
            saleDate = new Date(sale.Date);
          }
        }
        loadedSales.push({
          id: doc.id,
          ...sale,
          dateObj: saleDate
        });
      });

      // Sort by Date ascending for trend chart calculations
      loadedSales.sort((a, b) => (a.dateObj || 0) - (b.dateObj || 0));

      setSales(loadedSales);
    } catch (err) {
      console.error("Sales load error:", err);
      setError("Failed to load sales data reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [companyId]);

  // Handle time range filtering
  useEffect(() => {
    if (sales.length === 0) return;

    const now = new Date();
    let cutoff = new Date();

    if (timeRange === "7") {
      cutoff.setDate(now.getDate() - 7);
    } else if (timeRange === "30") {
      cutoff.setDate(now.getDate() - 30);
    } else if (timeRange === "month") {
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month
    } else if (timeRange === "ytd") {
      cutoff = new Date(now.getFullYear(), 0, 1); // Start of year
    } else {
      cutoff = new Date(0); // All time
    }

    const filtered = sales.filter((s) => s.dateObj && s.dateObj >= cutoff);
    setFilteredSales(filtered);

    // Calculate Summary Stats
    const count = filtered.length;
    let rev = 0;
    let profit = 0;

    filtered.forEach((s) => {
      rev += s.TotalAmount || 0;
      profit += s.TotalProfit || 0;
    });

    const avg = count > 0 ? rev / count : 0;
    const margin = rev > 0 ? (profit / rev) * 100 : 0;

    setSummary({
      salesCount: count,
      totalRevenue: rev,
      totalProfit: profit,
      avgSale: avg,
      margin
    });

    // Calculate Best Sellers
    const itemsMap = {};
    filtered.forEach((sale) => {
      try {
        if (sale.ItemsJson) {
          const itemsList = JSON.parse(sale.ItemsJson);
          itemsList.forEach((item) => {
            const name = item.ItemName || "Unknown Item";
            const qty = item.Quantity || 0;
            const revenue = item.LineTotal || 0;
            
            if (!itemsMap[name]) {
              itemsMap[name] = { name, quantity: 0, revenue: 0 };
            }
            itemsMap[name].quantity += qty;
            itemsMap[name].revenue += revenue;
          });
        }
      } catch (err) {
        console.error("Error parsing sale ItemsJson:", err);
      }
    });

    const sortedBest = Object.values(itemsMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // Top 5 sellers
    setBestSellers(sortedBest);

  }, [timeRange, sales]);

  const formatCurrency = (amount) => {
    const symbol = company?.Currency || "UGX";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: symbol,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleExportCSV = () => {
    if (filteredSales.length === 0) return;
    
    // Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Receipt Number,Date,Cashier,Total Amount,Total Profit\n";
    
    // Rows
    filteredSales.forEach((s) => {
      const dateStr = s.dateObj ? s.dateObj.toISOString().split("T")[0] : "N/A";
      csvContent += `${s.ReceiptNumber},"${dateStr}","${s.CashierName || "System"}",${s.TotalAmount},${s.TotalProfit}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${timeRange}_days.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generating coordinates for custom trend SVG path
  const renderTrendSVG = () => {
    if (filteredSales.length === 0) return null;

    // Group sales by day
    const dailyMap = {};
    filteredSales.forEach((s) => {
      if (!s.dateObj) return;
      const dayStr = s.dateObj.toISOString().split("T")[0];
      if (!dailyMap[dayStr]) {
        dailyMap[dayStr] = { label: s.dateObj.toLocaleDateString(undefined, {month: "short", day: "numeric"}), revenue: 0 };
      }
      dailyMap[dayStr].revenue += s.TotalAmount || 0;
    });

    const dataPoints = Object.values(dailyMap);
    if (dataPoints.length < 2) {
      return (
        <div style={{ textAlign: "center", padding: "80px", color: "var(--text-muted)", fontSize: "14px" }}>
          Insufficient daily transaction spread to plot chart. Make sales on multiple days to see trends.
        </div>
      );
    }

    const maxVal = Math.max(...dataPoints.map((d) => d.revenue), 1);
    
    const width = 800;
    const height = 240;
    const padding = 30;
    
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = dataPoints.map((dp, idx) => {
      const x = padding + (idx / (dataPoints.length - 1)) * chartWidth;
      const y = height - padding - (dp.revenue / maxVal) * chartHeight;
      return { x, y, ...dp };
    });

    const pathData = points.reduce((acc, p, idx) => {
      return acc + `${idx === 0 ? "M" : "L"} ${p.x} ${p.y} `;
    }, "");

    const areaData = pathData + `L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--border)" strokeDasharray="4 4" />
          <line x1={padding} y1={padding + chartHeight / 2} x2={width - padding} y2={padding + chartHeight / 2} stroke="var(--border)" strokeDasharray="4 4" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border)" />

          {/* Area under curve */}
          <path d={areaData} fill="url(#chartGradient)" />

          {/* Main curve */}
          <path d={pathData} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points / Dots */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="var(--primary)" strokeWidth="2" style={{ cursor: "pointer" }} />
              {/* Floating label for peaks/ends */}
              {(idx === 0 || idx === points.length - 1 || p.revenue === maxVal) && (
                <text x={p.x} y={p.y - 10} fill="var(--text-main)" fontSize="10" textAnchor="middle" fontWeight="bold">
                  {formatCurrency(p.revenue)}
                </text>
              )}
            </g>
          ))}

          {/* X Axis Labels */}
          {points.map((p, idx) => {
            // Only show labels for first, middle, last, or max to prevent overlap
            const showLabel = idx === 0 || idx === points.length - 1 || idx === Math.floor(points.length / 2);
            if (!showLabel) return null;
            return (
              <text key={idx} x={p.x} y={height - 10} fill="var(--text-muted)" fontSize="11" textAnchor="middle">
                {p.label}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="pulse-loading">
        <div style={{ width: "120px", height: "24px", backgroundColor: "var(--border)", borderRadius: "4px" }}></div>
        <div style={{ display: "flex", gap: "16px", height: "120px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ flex: 1, backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px" }}></div>
          ))}
        </div>
        <div style={{ height: "300px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px" }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }} className="animate-fade-in">
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.02em" }}>Analytics Reports</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Visual and exportable insights into sales revenue, margins, and performance
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={handleExportCSV} className="btn-outline" style={{ gap: "8px", fontSize: "13px", padding: "8px 16px" }} disabled={filteredSales.length === 0}>
            <FileSpreadsheet size={14} />
            <span>Export CSV</span>
          </button>
          <button onClick={fetchSalesData} className="btn-outline" style={{ gap: "8px", fontSize: "13px", padding: "8px 16px" }}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px dashed var(--danger)", borderRadius: "12px", padding: "16px", color: "var(--danger)", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {/* Date Filter Bar */}
      <div className="glass" style={{ borderRadius: "16px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
          <Calendar size={16} style={{ color: "var(--primary)" }} />
          Select Time Range:
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { value: "7", label: "Last 7 Days" },
            { value: "30", label: "Last 30 Days" },
            { value: "month", label: "This Month" },
            { value: "ytd", label: "Year to Date" },
            { value: "all", label: "All Time" }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setTimeRange(item.value)}
              className="btn-outline"
              style={{
                padding: "8px 14px",
                fontSize: "12px",
                borderRadius: "6px",
                height: "auto",
                borderColor: timeRange === item.value ? "var(--primary)" : "var(--border)",
                backgroundColor: timeRange === item.value ? "var(--primary)" : "transparent",
                color: timeRange === item.value ? "#fff" : "var(--text-muted)"
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Report Summary Cards */}
      <div className="stats-grid">
        {/* Sales count */}
        <div className="stat-card">
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Transaction Volume</span>
          <h2 style={{ fontSize: "28px", fontWeight: "800", marginTop: "4px" }}>{summary.salesCount}</h2>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Completed invoices</span>
        </div>

        {/* Total Revenue */}
        <div className="stat-card">
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Total Sales Revenue</span>
          <h2 style={{ fontSize: "28px", fontWeight: "800", marginTop: "4px" }}>{formatCurrency(summary.totalRevenue)}</h2>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Gross incoming funds</span>
        </div>

        {/* Total Profit */}
        <div className="stat-card">
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Accumulated Profit</span>
          <h2 style={{ fontSize: "28px", fontWeight: "800", marginTop: "4px", color: "var(--success)" }}>{formatCurrency(summary.totalProfit)}</h2>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Average margin: {summary.margin.toFixed(1)}%</span>
        </div>

        {/* Avg Invoice */}
        <div className="stat-card">
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Average Ticket Value</span>
          <h2 style={{ fontSize: "28px", fontWeight: "800", marginTop: "4px" }}>{formatCurrency(summary.avgSale)}</h2>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Revenue per transaction</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
        
        {/* Trend Chart */}
        <div className="table-container" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Revenue Trend Chart</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>Sales distribution over the selected timeframe</p>
            </div>
            <TrendingUp size={18} style={{ color: "var(--primary)" }} />
          </div>
          {renderTrendSVG()}
        </div>

        {/* Best Sellers */}
        <div className="table-container" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Top Selling Products</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>Most popular items ranked by units sold</p>
            </div>
            <BarChart2 size={18} style={{ color: "var(--primary)" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {bestSellers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "14px" }}>
                No product sales records available.
              </div>
            ) : (
              bestSellers.map((item, idx) => {
                const maxQty = Math.max(...bestSellers.map((b) => b.quantity), 1);
                const percent = (item.quantity / maxQty) * 100;
                
                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                      <span style={{ fontWeight: "600" }}>{idx + 1}. {item.name}</span>
                      <span style={{ color: "var(--text-muted)" }}>
                        <strong>{item.quantity} sold</strong> ({formatCurrency(item.revenue)})
                      </span>
                    </div>
                    {/* Bar container */}
                    <div style={{ width: "100%", height: "8px", backgroundColor: "var(--border)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${percent}%`, height: "100%", backgroundColor: "var(--primary)", borderRadius: "4px", transition: "width 0.5s ease" }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
