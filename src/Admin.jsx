import { useState, useContext, useEffect } from "react";
import { StoreContext } from "./index";

const tagColors    = { Bestseller:"#f97316", New:"#8b5cf6", Hot:"#ef4444", Premium:"#eab308", Value:"#22c55e", Popular:"#3b82f6", Training:"#06b6d4", Kit:"#ec4899", Health:"#10b981", Organic:"#84cc16" };
const statusColors = { Delivered:"#22c55e", Processing:"#f59e0b", Shipped:"#3b82f6", Cancelled:"#ef4444", Active:"#22c55e", VIP:"#f97316", New:"#8b5cf6" };
const EMOJIS       = ["🐟","🛏️","🔴","🦴","🐠","🦜","🐾","🌿","🛡️","🐹","🦮","🐕","🐈","🐦","🐡","🎾","🦷","🐰"];
const TAGS         = ["Bestseller","New","Hot","Premium","Value","Popular","Training","Kit","Health","Organic"];
const CATS         = ["dog","cat","fish","bird","small"];
const TYPES        = ["food","accessories","toys","health"];
const petEmojis    = { dog:"🐕", cat:"🐈", fish:"🐠", bird:"🦜", small:"🐹" };

export default function AdminDashboard() {
  const store         = useContext(StoreContext);
  const products      = store?.products      ?? [];
  const updateProduct = store?.updateProduct ?? (() => {});
  const addProduct    = store?.addProduct    ?? (() => {});
  const deleteProduct = store?.deleteProduct ?? (() => {});
  const allOrders     = store?.orders        ?? [];
  const updateOrder   = store?.updateOrder   ?? (() => {});
  const customers     = store?.customers     ?? [];

  const [page, setPage]           = useState("dashboard");
  const [notif, setNotif]         = useState("");
  const [sideOpen, setSideOpen]   = useState(window.innerWidth > 768);
  const [editProduct, setEditProduct]   = useState(null);
  const [productModal, setProductModal] = useState(false);
  const [isNew, setIsNew]               = useState(false);
  const [orderModal, setOrderModal]     = useState(null);
  const [search, setSearch]             = useState("");
  const [catFilter, setCatFilter]       = useState("all");
  const [orderFilter, setOrderFilter]   = useState("All");
  const [isMobile, setIsMobile]         = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setSideOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toast = (msg) => { setNotif(msg); setTimeout(() => setNotif(""), 2800); };

  const totalRevenue  = allOrders.filter(o => o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
  const lowStock      = products.filter(p => p.stock < 10);
  const pendingOrders = allOrders.filter(o => o.status === "Processing").length;
  const vipCount      = customers.filter(c => c.status === "VIP").length;

  const openNew = () => {
    setEditProduct({ name: "", category: "dog", type: "food", price: 0, stock: 0, rating: 4.5, emoji: "🐾", tag: "New", desc: "", pet: ["dog"] });
    setIsNew(true); setProductModal(true);
  };
  const openEdit = (p) => { setEditProduct({ ...p }); setIsNew(false); setProductModal(true); };
  const saveProduct = () => {
    if (!editProduct.name.trim()) { toast("❌ Product name is required!"); return; }
    const enriched = { ...editProduct, pet: editProduct.pet || [editProduct.category] };
    if (isNew) addProduct(enriched);
    else       updateProduct(enriched);
    setProductModal(false);
    toast(isNew ? "✅ Product added! Visible in Shop instantly." : "✅ Product updated!");
  };
  const handleDelete = (id) => { deleteProduct(id); toast("🗑️ Product deleted."); };

  const nextStatus = { Processing: "Shipped", Shipped: "Delivered" };
  const advanceOrder = (o) => {
    if (nextStatus[o.status]) { updateOrder({ ...o, status: nextStatus[o.status] }); toast("✅ Order status updated!"); }
  };
  const cancelOrder = (o) => {
    updateOrder({ ...o, status: "Cancelled" }); toast("🚫 Order cancelled.");
  };

  const filteredProducts = products.filter(p =>
    (catFilter === "all" || p.category === catFilter) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredOrders = allOrders.filter(o =>
    orderFilter === "All" || o.status === orderFilter
  );

  const nav = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "products",  icon: "📦", label: "Products" },
    { id: "orders",    icon: "🛒", label: "Orders" },
    { id: "customers", icon: "👥", label: "Customers" },
    { id: "inventory", icon: "🗄️", label: "Inventory" },
  ];

  return (
    <div style={{ display: "flex", height: "calc(100vh - 44px)", fontFamily: "'DM Sans', sans-serif", background: "#0f0a07", color: "#f0e8de", overflow: "hidden", position: "relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      {notif && (
        <div style={{ position: "fixed", top: 56, left: "50%", transform: "translateX(-50%)", background: "#1a1008", border: "1px solid #f97316", color: "#f0e8de", padding: "10px 20px", borderRadius: 10, zIndex: 9999, fontWeight: 600, fontSize: 13, boxShadow: "0 4px 24px rgba(249,115,22,0.3)", whiteSpace: "nowrap" }}>
          {notif}
        </div>
      )}

      {/* Mobile overlay */}
      {isMobile && sideOpen && (
        <div onClick={() => setSideOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 98 }} />
      )}

      {/* SIDEBAR */}
      <aside style={{
        width: sideOpen ? 220 : (isMobile ? 0 : 60),
        background: "#140d05",
        borderRight: "1px solid rgba(249,115,22,0.15)",
        display: "flex", flexDirection: "column",
        transition: "width .25s",
        flexShrink: 0,
        overflow: "hidden",
        position: isMobile ? "fixed" : "relative",
        top: isMobile ? 44 : 0,
        left: 0,
        height: isMobile ? "calc(100vh - 44px)" : "auto",
        zIndex: isMobile ? 99 : 1,
      }}>
        <div style={{ padding: sideOpen ? "16px 14px" : "16px 10px", borderBottom: "1px solid rgba(249,115,22,0.1)", display: "flex", alignItems: "center", gap: 8, justifyContent: sideOpen ? "space-between" : "center", minWidth: sideOpen ? 220 : 60 }}>
          {sideOpen && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🐾</span>
              <span style={{ fontFamily: "'Playfair Display', serif", color: "#f97316", fontSize: 15, fontWeight: 700 }}>PawMart Admin</span>
            </div>
          )}
          <button onClick={() => setSideOpen(v => !v)} style={{ background: "rgba(249,115,22,0.1)", border: "none", color: "#f97316", borderRadius: 7, width: 28, height: 28, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {sideOpen ? "◀" : "▶"}
          </button>
        </div>

        <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => { setPage(n.id); if (isMobile) setSideOpen(false); }}
              style={{ width: "100%", background: page === n.id ? "rgba(249,115,22,0.15)" : "transparent", borderLeft: page === n.id ? "3px solid #f97316" : "3px solid transparent", border: "none", borderLeft: page === n.id ? "3px solid #f97316" : "3px solid transparent", color: page === n.id ? "#f97316" : "#a89080", padding: sideOpen ? "11px 16px" : "11px 0", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, justifyContent: sideOpen ? "flex-start" : "center", fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>{n.icon}</span>
              {sideOpen && <span>{n.label}</span>}
              {sideOpen && n.id === "orders" && pendingOrders > 0 && (
                <span style={{ marginLeft: "auto", background: "#f97316", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{pendingOrders}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: sideOpen ? "12px 14px" : "12px 8px", borderTop: "1px solid rgba(249,115,22,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: sideOpen ? "flex-start" : "center" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#7c3f1a)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>A</div>
            {sideOpen && <div><div style={{ fontWeight: 600, fontSize: 11 }}>Admin</div><div style={{ fontSize: 9, color: "#7c5c3e" }}>PawMart</div></div>}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", background: "#0f0a07", minWidth: 0 }}>
        {/* Header */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0f0a07", position: "sticky", top: 0, zIndex: 10, gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isMobile && (
              <button onClick={() => setSideOpen(v => !v)} style={{ background: "rgba(249,115,22,0.1)", border: "none", color: "#f97316", borderRadius: 7, width: 32, height: 32, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>☰</button>
            )}
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: "#f0e8de" }}>{nav.find(n => n.id === page)?.label}</div>
              <div style={{ fontSize: 10, color: "#7c5c3e" }}>Live sync active</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {lowStock.length > 0 && <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: 7, padding: "4px 9px", fontSize: 10, fontWeight: 600 }}>⚠️ {lowStock.length} low stock</div>}
            <div style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#f97316", borderRadius: 7, padding: "4px 9px", fontSize: 10, fontWeight: 600 }}>🔔 {pendingOrders} pending</div>
          </div>
        </div>

        <div style={{ padding: "16px" }}>

          {/* ── DASHBOARD ── */}
          {page === "dashboard" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Revenue",   value: `₱${totalRevenue.toLocaleString()}`, sub: "All time",          icon: "💰", color: "#f97316" },
                  { label: "Orders",    value: allOrders.length,                     sub: `${pendingOrders} pending`, icon: "🛒", color: "#3b82f6" },
                  { label: "Products",  value: products.length,                      sub: `${lowStock.length} low stock`, icon: "📦", color: "#8b5cf6" },
                  { label: "Customers", value: customers.length,                     sub: `${vipCount} VIP`,   icon: "👥", color: "#22c55e" },
                ].map(k => (
                  <div key={k.label} style={{ background: "#1a1008", borderRadius: 12, padding: "16px 14px", border: "1px solid rgba(249,115,22,0.1)", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", right: -4, top: -4, fontSize: 40, opacity: .07 }}>{k.icon}</div>
                    <div style={{ fontSize: 9, color: "#7c5c3e", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{k.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: k.color, margin: "5px 0 2px", fontFamily: "'Playfair Display', serif" }}>{k.value}</div>
                    <div style={{ fontSize: 10, color: "#a89080" }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "9px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span>🔄</span>
                <span style={{ color: "#4ade80", fontWeight: 600 }}>Live Sync Active</span>
                <span style={{ color: "#a89080" }}>— Changes sync instantly to the Customer Shop.</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
                {/* Recent orders */}
                <div style={{ background: "#1a1008", borderRadius: 12, border: "1px solid rgba(249,115,22,0.1)", overflow: "hidden" }}>
                  <div style={{ padding: "13px 16px", borderBottom: "1px solid rgba(249,115,22,0.08)", fontWeight: 700, fontSize: 13 }}>Recent Orders</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 280 }}>
                      <thead><tr style={{ borderBottom: "1px solid rgba(249,115,22,0.08)" }}>
                        {["Order","Customer","Total","Status"].map(h => <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, color: "#7c5c3e", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {allOrders.slice(0, 6).map(o => (
                          <tr key={o.id} style={{ borderBottom: "1px solid rgba(249,115,22,0.05)" }}>
                            <td style={{ padding: "8px 12px", fontSize: 11, color: "#f97316", fontWeight: 600 }}>{o.id?.slice(-6)}</td>
                            <td style={{ padding: "8px 12px", fontSize: 11 }}>{o.customer}</td>
                            <td style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700 }}>₱{o.total?.toLocaleString()}</td>
                            <td style={{ padding: "8px 12px" }}><span style={{ background: `${statusColors[o.status]}22`, color: statusColors[o.status], borderRadius: 5, padding: "2px 7px", fontSize: 9, fontWeight: 700 }}>{o.status}</span></td>
                          </tr>
                        ))}
                        {allOrders.length === 0 && <tr><td colSpan={4} style={{ padding: 16, color: "#7c5c3e", fontSize: 12, textAlign: "center" }}>No orders yet</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Low stock */}
                <div style={{ background: "#1a1008", borderRadius: 12, border: "1px solid rgba(249,115,22,0.1)", overflow: "hidden" }}>
                  <div style={{ padding: "13px 16px", borderBottom: "1px solid rgba(249,115,22,0.08)", fontWeight: 700, fontSize: 13 }}>⚠️ Low Stock Alert</div>
                  {lowStock.length === 0
                    ? <div style={{ padding: 16, color: "#7c5c3e", fontSize: 12 }}>All products well-stocked ✅</div>
                    : lowStock.map(p => (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderBottom: "1px solid rgba(249,115,22,0.05)" }}>
                        <span style={{ fontSize: 18 }}>{p.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700 }}>Only {p.stock} left</div>
                        </div>
                        <button onClick={() => openEdit(p)} style={{ background: "rgba(249,115,22,0.12)", border: "none", color: "#f97316", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>Restock</button>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Bar chart */}
              <div style={{ background: "#1a1008", borderRadius: 12, border: "1px solid rgba(249,115,22,0.1)", padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Products by Category</div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 90 }}>
                  {CATS.map(c => {
                    const count = products.filter(p => p.category === c).length;
                    const pct   = products.length ? Math.round(count / products.length * 100) : 0;
                    const clrs  = { dog:"#f97316", cat:"#8b5cf6", fish:"#3b82f6", bird:"#22c55e", small:"#f59e0b" };
                    const icons = { dog:"🐕", cat:"🐈", fish:"🐠", bird:"🦜", small:"🐹" };
                    return (
                      <div key={c} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: clrs[c] }}>{pct}%</div>
                        <div style={{ width: "100%", height: pct * 0.8 + 4, background: `linear-gradient(to top,${clrs[c]},${clrs[c]}88)`, borderRadius: "4px 4px 0 0", minHeight: 4 }} />
                        <div style={{ fontSize: 14 }}>{icons[c]}</div>
                        <div style={{ fontSize: 9, color: "#a89080", textTransform: "capitalize" }}>{c}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── PRODUCTS ── */}
          {page === "products" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search products..."
                  style={{ background: "#1a1008", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 8, padding: "8px 12px", color: "#f0e8de", fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", flex: 1, minWidth: 140 }} />
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {["all", ...CATS].map(c => (
                    <button key={c} onClick={() => setCatFilter(c)}
                      style={{ background: catFilter === c ? "#f97316" : "rgba(249,115,22,0.08)", color: catFilter === c ? "#fff" : "#a89080", border: `1px solid ${catFilter === c ? "#f97316" : "rgba(249,115,22,0.15)"}`, borderRadius: 7, padding: "6px 10px", cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", textTransform: "capitalize" }}>{c}</button>
                  ))}
                </div>
                <button onClick={openNew} style={{ background: "#f97316", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>+ Add Product</button>
              </div>

              <div style={{ background: "#1a1008", borderRadius: 12, border: "1px solid rgba(249,115,22,0.1)", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                  <thead><tr style={{ borderBottom: "1px solid rgba(249,115,22,0.1)" }}>
                    {["","Product","Cat","Price","Stock","Tag","Actions"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 9, color: "#7c5c3e", fontWeight: 600, textTransform: "uppercase", letterSpacing: .8 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id} style={{ borderBottom: "1px solid rgba(249,115,22,0.05)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(249,115,22,0.04)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "10px 12px", fontSize: 22 }}>{p.emoji}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</div>
                          <div style={{ fontSize: 9, color: "#7c5c3e", marginTop: 1 }}>{p.desc?.slice(0, 38)}...</div>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 11, textTransform: "capitalize", color: "#a89080" }}>{p.category}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "#f97316", fontSize: 12 }}>₱{p.price?.toLocaleString()}</td>
                        <td style={{ padding: "10px 12px" }}><span style={{ color: p.stock < 10 ? "#ef4444" : "#22c55e", fontWeight: 700, fontSize: 12 }}>{p.stock}</span></td>
                        <td style={{ padding: "10px 12px" }}><span style={{ background: `${tagColors[p.tag]||"#888"}22`, color: tagColors[p.tag]||"#888", borderRadius: 5, padding: "2px 6px", fontSize: 9, fontWeight: 700 }}>{p.tag}</span></td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => openEdit(p)} style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "none", borderRadius: 5, padding: "3px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Edit</button>
                            <button onClick={() => handleDelete(p.id)} style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "none", borderRadius: 5, padding: "3px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Del</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ORDERS ── */}
          {page === "orders" && (
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                {["All", "Processing", "Shipped", "Delivered", "Cancelled"].map(s => (
                  <button key={s} onClick={() => setOrderFilter(s)}
                    style={{ background: orderFilter === s ? "#f97316" : "rgba(249,115,22,0.08)", color: orderFilter === s ? "#fff" : "#a89080", border: `1px solid rgba(249,115,22,0.15)`, borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                    {s} {s !== "All" && allOrders.filter(o => o.status === s).length > 0 && `(${allOrders.filter(o => o.status === s).length})`}
                  </button>
                ))}
              </div>
              <div style={{ background: "#1a1008", borderRadius: 12, border: "1px solid rgba(249,115,22,0.1)", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                  <thead><tr style={{ borderBottom: "1px solid rgba(249,115,22,0.1)" }}>
                    {["Order","Customer","Total","Payment","Status","Date","Actions"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 9, color: "#7c5c3e", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredOrders.map(o => (
                      <tr key={o.id} style={{ borderBottom: "1px solid rgba(249,115,22,0.05)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(249,115,22,0.04)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "10px 12px", color: "#f97316", fontWeight: 700, fontSize: 11 }}>{o.id?.slice(-8)}</td>
                        <td style={{ padding: "10px 12px", fontSize: 11, fontWeight: 600 }}>{o.customer}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "#f97316", fontSize: 12 }}>₱{o.total?.toLocaleString()}</td>
                        <td style={{ padding: "10px 12px", fontSize: 10, color: "#a89080" }}>{o.payment}</td>
                        <td style={{ padding: "10px 12px" }}><span style={{ background: `${statusColors[o.status]}22`, color: statusColors[o.status], borderRadius: 5, padding: "2px 7px", fontSize: 9, fontWeight: 700 }}>{o.status}</span></td>
                        <td style={{ padding: "10px 12px", fontSize: 10, color: "#7c5c3e" }}>{o.date}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => setOrderModal(o)} style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "none", borderRadius: 5, padding: "3px 7px", cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>View</button>
                            {nextStatus[o.status] && <button onClick={() => advanceOrder(o)} style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "none", borderRadius: 5, padding: "3px 7px", cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>→{nextStatus[o.status]}</button>}
                            {o.status === "Processing" && <button onClick={() => cancelOrder(o)} style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "none", borderRadius: 5, padding: "3px 7px", cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: 20, color: "#7c5c3e", fontSize: 12, textAlign: "center" }}>No orders found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── CUSTOMERS ── */}
          {page === "customers" && (
            <div>
              <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "9px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span>👥</span>
                <span style={{ color: "#4ade80", fontWeight: 600 }}>Live Customer List</span>
                <span style={{ color: "#a89080" }}>— New registrations appear instantly.</span>
                <span style={{ marginLeft: "auto", background: "rgba(249,115,22,0.15)", color: "#f97316", borderRadius: 6, padding: "2px 9px", fontWeight: 700, fontSize: 11 }}>{customers.length} total</span>
              </div>

              {/* Customer cards on mobile, table on desktop */}
              {isMobile ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {customers.map(c => (
                    <div key={c.id} style={{ background: "#1a1008", borderRadius: 12, padding: 14, border: "1px solid rgba(249,115,22,0.1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#7c3f1a)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{c.name?.[0]}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                          <div style={{ fontSize: 10, color: "#7c5c3e" }}>{c.email}</div>
                        </div>
                        <span style={{ background: `${statusColors[c.status]||"#888"}22`, color: statusColors[c.status]||"#888", borderRadius: 6, padding: "3px 9px", fontSize: 10, fontWeight: 700 }}>
                          {c.status === "VIP" ? "⭐ VIP" : c.status === "New" ? "🆕 New" : c.status}
                        </span>
                      </div>
                      {c.petProfile && (
                        <div style={{ background: "rgba(249,115,22,0.08)", borderRadius: 8, padding: "7px 10px", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 16 }}>{petEmojis[c.petProfile.type]||"🐾"}</span>
                          <span style={{ fontSize: 11, color: "#f97316", fontWeight: 700 }}>{c.petProfile.name}</span>
                          <span style={{ fontSize: 10, color: "#a89080" }}>{c.petProfile.breed || c.petProfile.type} · {c.petProfile.age || "unknown age"}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#a89080" }}>
                        <span>📦 {c.orders} orders</span>
                        <span>💰 ₱{c.spent?.toLocaleString()}</span>
                        <span>📅 {c.joined}</span>
                      </div>
                    </div>
                  ))}
                  {customers.length === 0 && <div style={{ color: "#7c5c3e", fontSize: 12, textAlign: "center", padding: 20 }}>No customers yet</div>}
                </div>
              ) : (
                <div style={{ background: "#1a1008", borderRadius: 12, border: "1px solid rgba(249,115,22,0.1)", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                    <thead><tr style={{ borderBottom: "1px solid rgba(249,115,22,0.1)" }}>
                      {["Customer","Pet Profile","Orders","Spent","Joined","Status"].map(h => (
                        <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 9, color: "#7c5c3e", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {customers.map(c => (
                        <tr key={c.id} style={{ borderBottom: "1px solid rgba(249,115,22,0.05)" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(249,115,22,0.04)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#7c3f1a)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{c.name?.[0]}</div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 12 }}>{c.name}</div>
                                <div style={{ fontSize: 10, color: "#7c5c3e" }}>{c.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            {c.petProfile ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 16 }}>{petEmojis[c.petProfile.type]||"🐾"}</span>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "#f97316" }}>{c.petProfile.name}</div>
                                  <div style={{ fontSize: 9, color: "#a89080" }}>{c.petProfile.breed || c.petProfile.type}</div>
                                </div>
                              </div>
                            ) : <span style={{ fontSize: 10, color: "#7c5c3e" }}>No pet profile</span>}
                          </td>
                          <td style={{ padding: "12px 14px", fontWeight: 700, fontSize: 12 }}>{c.orders}</td>
                          <td style={{ padding: "12px 14px", color: "#f97316", fontWeight: 700, fontSize: 12 }}>₱{c.spent?.toLocaleString()}</td>
                          <td style={{ padding: "12px 14px", fontSize: 11, color: "#7c5c3e" }}>{c.joined}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ background: `${statusColors[c.status]||"#888"}22`, color: statusColors[c.status]||"#888", borderRadius: 6, padding: "3px 9px", fontSize: 10, fontWeight: 700 }}>
                              {c.status === "VIP" ? "⭐ VIP" : c.status === "New" ? "🆕 New" : c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {customers.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: 20, color: "#7c5c3e", fontSize: 12, textAlign: "center" }}>No customers yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── INVENTORY ── */}
          {page === "inventory" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Total SKUs",    value: products.length,                     icon: "📦", color: "#3b82f6" },
                  { label: "Low Stock",     value: lowStock.length,                     icon: "⚠️", color: "#ef4444" },
                  { label: "Total Units",   value: products.reduce((s,p)=>s+(p.stock||0),0), icon: "🗄️", color: "#22c55e" },
                ].map(k => (
                  <div key={k.label} style={{ background: "#1a1008", borderRadius: 12, padding: "16px 14px", border: "1px solid rgba(249,115,22,0.1)" }}>
                    <div style={{ fontSize: 9, color: "#7c5c3e", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{k.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: k.color, marginTop: 5, fontFamily: "'Playfair Display', serif" }}>{k.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#1a1008", borderRadius: 12, border: "1px solid rgba(249,115,22,0.1)" }}>
                <div style={{ padding: "13px 16px", borderBottom: "1px solid rgba(249,115,22,0.08)", fontWeight: 700, fontSize: 13 }}>Inventory Levels</div>
                <div style={{ padding: "4px 0" }}>
                  {[...products].sort((a, b) => a.stock - b.stock).map(p => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: "1px solid rgba(249,115,22,0.04)" }}>
                      <span style={{ fontSize: 18, width: 24, flexShrink: 0 }}>{p.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min((p.stock||0) / 60 * 100, 100)}%`, background: p.stock < 10 ? "#ef4444" : p.stock < 20 ? "#f59e0b" : "#22c55e", borderRadius: 2 }} />
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span style={{ fontWeight: 700, color: p.stock < 10 ? "#ef4444" : "#f0e8de", fontSize: 12 }}>{p.stock}</span>
                        <span style={{ color: "#7c5c3e", fontSize: 9 }}> units</span>
                      </div>
                      <button onClick={() => openEdit(p)} style={{ background: "rgba(249,115,22,0.12)", color: "#f97316", border: "none", borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>Update</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── PRODUCT MODAL ── */}
      {productModal && editProduct && (
        <div onClick={() => setProductModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#1a1008", borderRadius: 16, padding: 22, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", border: "1px solid rgba(249,115,22,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#f97316", marginBottom: 18, fontSize: 17 }}>{isNew ? "➕ Add New Product" : "✏️ Edit Product"}</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Emoji Icon</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setEditProduct(p => ({ ...p, emoji: e }))}
                    style={{ background: editProduct.emoji === e ? "rgba(249,115,22,0.3)" : "rgba(255,255,255,0.05)", border: `1px solid ${editProduct.emoji === e ? "#f97316" : "transparent"}`, borderRadius: 7, padding: "4px 8px", cursor: "pointer", fontSize: 16 }}>{e}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={lbl}>Product Name *</label>
                <input value={editProduct.name} onChange={e => setEditProduct(p => ({ ...p, name: e.target.value }))} style={inp} placeholder="e.g. Premium Dog Food" />
              </div>
              <div>
                <label style={lbl}>Category</label>
                <select value={editProduct.category} onChange={e => setEditProduct(p => ({ ...p, category: e.target.value, pet: [e.target.value] }))} style={inp}>
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Type</label>
                <select value={editProduct.type} onChange={e => setEditProduct(p => ({ ...p, type: e.target.value }))} style={inp}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Price (₱)</label>
                <input type="number" value={editProduct.price} onChange={e => setEditProduct(p => ({ ...p, price: +e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Stock</label>
                <input type="number" value={editProduct.stock} onChange={e => setEditProduct(p => ({ ...p, stock: +e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Rating (0–5)</label>
                <input type="number" step="0.1" min="0" max="5" value={editProduct.rating} onChange={e => setEditProduct(p => ({ ...p, rating: +e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Tag</label>
                <select value={editProduct.tag} onChange={e => setEditProduct(p => ({ ...p, tag: e.target.value }))} style={inp}>
                  {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={lbl}>Description</label>
                <textarea value={editProduct.desc} onChange={e => setEditProduct(p => ({ ...p, desc: e.target.value }))} rows={3} style={{ ...inp, resize: "vertical" }} placeholder="Short product description..." />
              </div>
            </div>
            <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 8, padding: "8px 12px", marginTop: 14, fontSize: 11, color: "#4ade80", fontWeight: 600 }}>
              🔄 Changes sync instantly to the Customer Shop
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => setProductModal(false)} style={{ flex: 1, background: "rgba(255,255,255,0.06)", color: "#a89080", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 11, cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
              <button onClick={saveProduct} style={{ flex: 2, background: "#f97316", color: "#fff", border: "none", borderRadius: 8, padding: 11, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{isNew ? "Add to Shop" : "Save & Sync"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ORDER DETAIL MODAL ── */}
      {orderModal && (
        <div onClick={() => setOrderModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#1a1008", borderRadius: 16, padding: 22, width: "100%", maxWidth: 380, border: "1px solid rgba(249,115,22,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#f97316", margin: 0, fontSize: 17 }}>{orderModal.id?.slice(-10)}</h3>
              <span style={{ background: `${statusColors[orderModal.status]}22`, color: statusColors[orderModal.status], borderRadius: 7, padding: "3px 10px", fontWeight: 700, fontSize: 11 }}>{orderModal.status}</span>
            </div>
            {[["Customer", orderModal.customer], ["Date", orderModal.date], ["Payment", orderModal.payment]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 9, fontSize: 12 }}>
                <span style={{ color: "#7c5c3e" }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <div style={{ margin: "14px 0" }}>
              <div style={{ color: "#7c5c3e", fontSize: 10, fontWeight: 600, marginBottom: 7, textTransform: "uppercase" }}>Items</div>
              {orderModal.items?.map((item, i) => (
                <div key={i} style={{ background: "rgba(249,115,22,0.06)", borderRadius: 6, padding: "7px 10px", marginBottom: 4, fontSize: 11, fontWeight: 600 }}>{item}</div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid rgba(249,115,22,0.1)", paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#7c5c3e", fontSize: 12 }}>Total</span>
              <span style={{ color: "#f97316", fontWeight: 700, fontSize: 17, fontFamily: "'Playfair Display', serif" }}>₱{orderModal.total?.toLocaleString()}</span>
            </div>
            <button onClick={() => setOrderModal(null)} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#a89080", borderRadius: 8, padding: 11, marginTop: 16, cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Close</button>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: #0f0a07; }
        ::-webkit-scrollbar-thumb { background: #3a2510; border-radius: 4px; }
        option { background: #1a1008; color: #f0e8de; }
      `}</style>
    </div>
  );
}

const lbl = { display: "block", fontSize: 10, color: "#7c5c3e", fontWeight: 600, textTransform: "uppercase", letterSpacing: .8, marginBottom: 5 };
const inp = { width: "100%", background: "#0f0a07", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 8, padding: "9px 12px", color: "#f0e8de", fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" };