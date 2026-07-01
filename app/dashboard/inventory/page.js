"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Filter, AlertCircle, RefreshCw, Layers } from "lucide-react";

export default function InventoryPage() {
  const { company, companyId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const fetchInventory = async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const itemsRef = collection(db, "companies", companyId, "items");
      const snap = await getDocs(itemsRef);
      
      const loadedItems = [];
      const loadedCats = new Set(["All"]);

      snap.forEach((doc) => {
        const data = doc.data();
        loadedItems.push({
          id: doc.id,
          ...data
        });
        if (data.Category) {
          loadedCats.add(data.Category);
        }
      });

      // Sort items by Name alphabetically
      loadedItems.sort((a, b) => a.Name.localeCompare(b.Name));

      setItems(loadedItems);
      setFilteredItems(loadedItems);
      setCategories(Array.from(loadedCats));
    } catch (err) {
      console.error("Inventory load error:", err);
      setError("Failed to fetch inventory. Check your network or database rules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [companyId]);

  // Apply filters whenever filters or item lists change
  useEffect(() => {
    let result = [...items];

    // Search filter
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) => 
          item.Name.toLowerCase().includes(term) || 
          item.ModelNumber.toLowerCase().includes(term) ||
          item.QRCode.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter((item) => item.Category === selectedCategory);
    }

    // Low stock filter (threshold of < 5 units)
    if (showLowStockOnly) {
      result = result.filter((item) => item.Quantity < 5);
    }

    setFilteredItems(result);
  }, [searchTerm, selectedCategory, showLowStockOnly, items]);

  const formatCurrency = (amount) => {
    const symbol = company?.Currency || "UGX";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: symbol,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="animate-fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ width: "150px", height: "24px", backgroundColor: "var(--border)", borderRadius: "4px" }} className="pulse-loading"></div>
        </div>
        <div style={{ display: "flex", gap: "16px", height: "46px" }}>
          <div style={{ flex: 1, backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px" }} className="pulse-loading"></div>
          <div style={{ width: "150px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px" }} className="pulse-loading"></div>
        </div>
        <div className="table-container pulse-loading" style={{ height: "450px", backgroundColor: "var(--bg-card)" }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }} className="animate-fade-in">
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.02em" }}>Inventory Manager</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Track and monitor current stock quantities and pricing levels
          </p>
        </div>
        <button onClick={fetchInventory} className="btn-outline" style={{ gap: "8px", fontSize: "13px", padding: "8px 16px" }}>
          <RefreshCw size={14} />
          <span>Sync Stock</span>
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px dashed var(--danger)", borderRadius: "12px", padding: "16px", color: "var(--danger)", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {/* Filter and Search Bar Panel */}
      <div className="glass" style={{ borderRadius: "16px", padding: "20px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
        
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
          <Search size={18} style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-muted)" }} />
          <input 
            type="text" 
            placeholder="Search by product name, model number, or code..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field" 
            style={{ paddingLeft: "44px" }}
          />
        </div>

        {/* Category Dropdown */}
        <div style={{ position: "relative", minWidth: "180px" }}>
          <Filter size={16} style={{ position: "absolute", left: "14px", top: "15px", color: "var(--text-muted)" }} />
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field" 
            style={{ paddingLeft: "38px", cursor: "pointer", appearance: "none" }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} style={{ backgroundColor: "var(--bg-card)" }}>
                {cat === "All" ? "All Categories" : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Low Stock Toggle */}
        <button 
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className="btn-outline"
          style={{
            borderColor: showLowStockOnly ? "var(--warning)" : "var(--border)",
            backgroundColor: showLowStockOnly ? "rgba(245, 158, 11, 0.05)" : "transparent",
            color: showLowStockOnly ? "var(--warning)" : "var(--text-main)",
            gap: "8px",
            height: "46px"
          }}
        >
          <AlertCircle size={16} />
          <span>Low Stock Warning</span>
        </button>
      </div>

      {/* Inventory Table */}
      <div className="table-container">
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Product Inventory List</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>Showing {filteredItems.length} of {items.length} products</p>
          </div>
          <Layers size={18} style={{ color: "var(--primary)" }} />
        </div>

        <div className="table-wrapper">
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 40px", color: "var(--text-muted)" }}>
              No products found matching the filter criteria.
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Model Number</th>
                  <th>Category</th>
                  <th>Cost (Buying)</th>
                  <th>Retail (Selling)</th>
                  <th>In Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isLow = item.Quantity < 5;
                  const isOut = item.Quantity === 0;

                  return (
                    <tr key={item.id} style={{ 
                      backgroundColor: isOut ? "rgba(239, 68, 68, 0.02)" : isLow ? "rgba(245, 158, 11, 0.01)" : "" 
                    }}>
                      <td>
                        <div>
                          <p style={{ fontWeight: "700", color: "var(--text-main)" }}>{item.Name}</p>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>CODE: {item.QRCode || "N/A"}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>
                        {item.ModelNumber || "—"}
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--primary)" }}></span>
                          {item.Category || "Uncategorized"}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {formatCurrency(item.BuyingPrice)}
                      </td>
                      <td style={{ fontWeight: "600" }}>
                        {formatCurrency(item.SellingPrice)}
                      </td>
                      <td style={{ fontWeight: "800" }}>
                        <span style={{ color: isOut ? "var(--danger)" : isLow ? "var(--warning)" : "var(--text-main)" }}>
                          {item.Quantity} units
                        </span>
                      </td>
                      <td>
                        {isOut ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : isLow ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">Good</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
