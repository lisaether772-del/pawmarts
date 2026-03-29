import React, { useState, useEffect, createContext } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Admin from './Admin';

import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
  collection, onSnapshot, query, orderBy, where,
  serverTimestamp, getDocs,
} from 'firebase/firestore';

export const StoreContext = createContext(null);

const SEED_PRODUCTS = [
  { name: "Premium Salmon Dog Food",   category: "dog",   type: "food",        price: 899,  stock: 45, rating: 4.8, emoji: "🐟", tag: "Bestseller", desc: "Grain-free, high-protein formula for adult dogs. Rich in Omega-3.", pet: ["dog"] },
  { name: "Cozy Cat Cave Bed",         category: "cat",   type: "accessories", price: 1299, stock: 12, rating: 4.9, emoji: "🛏️", tag: "New",        desc: "Hooded cave-style bed for cats who love privacy and warmth.", pet: ["cat"] },
  { name: "Interactive Laser Toy",     category: "cat",   type: "toys",        price: 449,  stock: 30, rating: 4.6, emoji: "🔴", tag: "Hot",        desc: "Automatic rotating laser keeps cats mentally stimulated for hours.", pet: ["cat"] },
  { name: "Orthopedic Dog Bed",        category: "dog",   type: "accessories", price: 2199, stock: 8,  rating: 4.7, emoji: "🦴", tag: "Premium",    desc: "Memory foam support for senior or large breed dogs.", pet: ["dog"] },
  { name: "Tropical Fish Flakes",      category: "fish",  type: "food",        price: 249,  stock: 60, rating: 4.5, emoji: "🐠", tag: "Value",      desc: "Complete nutrition for all tropical freshwater fish species.", pet: ["fish"] },
  { name: "Bird Swing Perch Set",      category: "bird",  type: "accessories", price: 399,  stock: 25, rating: 4.4, emoji: "🦜", tag: "Popular",    desc: "3-piece natural wood perch set for parakeets and cockatiels.", pet: ["bird"] },
  { name: "Puppy Training Treats",     category: "dog",   type: "food",        price: 329,  stock: 50, rating: 4.7, emoji: "🦴", tag: "Training",   desc: "Soft bite-sized treats perfect for reward-based puppy training.", pet: ["dog"] },
  { name: "Cat Scratching Post Tower", category: "cat",   type: "accessories", price: 1599, stock: 15, rating: 4.8, emoji: "🐾", tag: "Bestseller", desc: "5-tier tower with sisal posts, platforms, and dangling toys.", pet: ["cat"] },
  { name: "Aquarium Starter Kit 20L",  category: "fish",  type: "accessories", price: 3499, stock: 6,  rating: 4.6, emoji: "🐟", tag: "Kit",        desc: "Complete setup with filter, LED lighting, and thermometer.", pet: ["fish"] },
  { name: "Hamster Exercise Wheel",    category: "small", type: "accessories", price: 299,  stock: 35, rating: 4.3, emoji: "🐹", tag: "Popular",    desc: "Silent spinner wheel, 8-inch diameter, safe for hamsters and gerbils.", pet: ["small"] },
  { name: "Natural Cat Catnip Spray",  category: "cat",   type: "toys",        price: 199,  stock: 40, rating: 4.5, emoji: "🌿", tag: "Organic",    desc: "100% organic catnip extract spray to energize and entertain your cat.", pet: ["cat"] },
  { name: "Dog Flea & Tick Collar",    category: "dog",   type: "health",      price: 549,  stock: 22, rating: 4.6, emoji: "🛡️", tag: "Health",     desc: "8-month protection against fleas, ticks, and mosquitoes.", pet: ["dog"] },
];

async function seedProductsIfEmpty() {
  const snap = await getDocs(collection(db, 'products'));
  if (snap.empty) {
    for (const p of SEED_PRODUCTS) {
      await addDoc(collection(db, 'products'), p);
    }
  }
}

const lbl = { display: "block", fontSize: 12, fontWeight: 800, color: "#7c5c3e", marginBottom: 6, textTransform: "uppercase", letterSpacing: .6 };
const inp = { width: "100%", border: "2px solid #e5d5c5", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "'Nunito', sans-serif", outline: "none", color: "#2d1a0e", background: "#fdfaf7", boxSizing: "border-box" };

// ── PET PROFILE SETUP ─────────────────────────────────────────────────────────
function PetProfileSetup({ userDoc, onComplete }) {
  const [petName,  setPetName]  = useState("");
  const [petType,  setPetType]  = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petAge,   setPetAge]   = useState("");
  const [loading,  setLoading]  = useState(false);

  const petTypes = [
    { id: "dog",   label: "Dog 🐕" },
    { id: "cat",   label: "Cat 🐈" },
    { id: "fish",  label: "Fish 🐠" },
    { id: "bird",  label: "Bird 🦜" },
    { id: "small", label: "Small Pet 🐹" },
  ];

  const handleSave = async () => {
    if (!petName || !petType) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", userDoc.uid), {
        petProfile: { name: petName.trim(), type: petType, breed: petBreed.trim(), age: petAge },
        profileComplete: true,
      });
      onComplete({ name: petName.trim(), type: petType, breed: petBreed.trim(), age: petAge });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSkip = async () => {
    await updateDoc(doc(db, "users", userDoc.uid), { profileComplete: true });
    onComplete(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fdf6ee", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito', sans-serif", padding: 20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🐾</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "#2d1a0e", fontWeight: 700 }}>Tell us about your pet!</div>
          <div style={{ color: "#7c5c3e", fontSize: 14, marginTop: 6 }}>We'll personalize your PawMart experience</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 8px 40px rgba(45,26,14,0.1)" }}>
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>What kind of pet do you have?</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {petTypes.map(t => (
                <button key={t.id} onClick={() => setPetType(t.id)}
                  style={{ background: petType === t.id ? "#f97316" : "#fdf6ee", color: petType === t.id ? "#fff" : "#2d1a0e", border: `2px solid ${petType === t.id ? "#f97316" : "#e5d5c5"}`, borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'Nunito', sans-serif", transition: "all .2s" }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Pet's Name</label>
            <input value={petName} onChange={e => setPetName(e.target.value)} placeholder="e.g. Buddy, Luna, Nemo" style={inp} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Breed (optional)</label>
            <input value={petBreed} onChange={e => setPetBreed(e.target.value)} placeholder="e.g. Shih Tzu, Aspin, Betta" style={inp} />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={lbl}>Age</label>
            <select value={petAge} onChange={e => setPetAge(e.target.value)} style={{ ...inp, appearance: "none" }}>
              <option value="">Select age range</option>
              <option value="baby">Baby / Newborn (0–3 months)</option>
              <option value="young">Young (3–12 months)</option>
              <option value="adult">Adult (1–6 years)</option>
              <option value="senior">Senior (7+ years)</option>
            </select>
          </div>
          <button onClick={handleSave} disabled={!petName || !petType || loading}
            style={{ width: "100%", background: petName && petType ? "linear-gradient(135deg,#f97316,#ea6c0a)" : "#e5d5c5", color: "#fff", border: "none", borderRadius: 12, padding: 14, cursor: petName && petType ? "pointer" : "not-allowed", fontWeight: 900, fontSize: 15, fontFamily: "'Nunito', sans-serif", marginBottom: 10 }}>
            {loading ? "Saving…" : "Save My Pet Profile 🐾"}
          </button>
          <button onClick={handleSkip}
            style={{ width: "100%", background: "transparent", color: "#7c5c3e", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'Nunito', sans-serif", padding: 8 }}>
            Skip for now →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── LOGIN / REGISTER ──────────────────────────────────────────────────────────
function LoginScreen({ initialTab = "login" }) {
  const [tab,        setTab]        = useState(initialTab);
  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);

  const [regName,    setRegName]    = useState("");
  const [regEmail,   setRegEmail]   = useState("");
  const [regPhone,   setRegPhone]   = useState("");
  const [regPass,    setRegPass]    = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  // ── SIGN IN ───────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setError(""); setLoading(true);
    if (!identifier.trim() || !password.trim()) {
      setError("Please fill in all fields."); setLoading(false); return;
    }
    try {
      const userCred = await signInWithEmailAndPassword(auth, identifier.trim().toLowerCase(), password);
      if (!userCred.user.emailVerified) {
        await signOut(auth);
        setError("Please verify your email first. Check your inbox for the verification link.");
        setLoading(false); return;
      }
    } catch (e) {
      setError(
        e.code === "auth/invalid-credential" || e.code === "auth/wrong-password"
          ? "Invalid email or password."
          : e.message
      );
    } finally { setLoading(false); }
  };

  // ── REGISTER ─────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    setError(""); setLoading(true);
    if (!regName || !regEmail || !regPhone || !regPass) { setError("Please fill in all fields."); setLoading(false); return; }
    if (regName.trim().split(" ").filter(w => w).length < 2) { setError("Please enter your full name (first and last name)."); setLoading(false); return; }
    if (!/^[^\s@]+@[^\s@]+\.(com|net|org|edu|gov|ph|co|io|me|info)$/i.test(regEmail.trim())) { setError("Please enter a valid email address (e.g. name@gmail.com)."); setLoading(false); return; }
    if (!/^09\d{9}$/.test(regPhone)) { setError("Phone must be 11 digits starting with 09."); setLoading(false); return; }
    if (regPass.length < 6) { setError("Password must be at least 6 characters."); setLoading(false); return; }
    try {
      const cred = await createUserWithEmailAndPassword(auth, regEmail.trim().toLowerCase(), regPass);
      await sendEmailVerification(cred.user);
      await setDoc(doc(db, "users", cred.user.uid), {
        name: regName.trim(), email: regEmail.trim().toLowerCase(), phone: regPhone,
        role: "customer", orders: 0, spent: 0, status: "New",
        joined: new Date().toLocaleDateString(), createdAt: serverTimestamp(),
        profileComplete: false,
      });
      await setDoc(doc(db, "phoneIndex", regPhone), { email: regEmail.trim().toLowerCase() });
      await signOut(auth);
      setRegSuccess(true);
    } catch (e) {
      setError(
        e.code === "auth/email-already-in-use" ? "An account with this email already exists." :
        e.code === "auth/invalid-email"        ? "That email address is not valid." :
        e.message
      );
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fdf6ee", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito', sans-serif", padding: 20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🐾</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: "#2d1a0e", fontWeight: 700 }}>PawMart</div>
          <div style={{ color: "#7c5c3e", fontSize: 14, marginTop: 4 }}>Your pet's best life starts here</div>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 8px 40px rgba(45,26,14,0.1)", border: "1px solid #f0e8de" }}>

          {/* Tabs */}
          <div style={{ display: "flex", background: "#fdf6ee", borderRadius: 12, padding: 4, marginBottom: 24 }}>
            {["login", "register"].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(""); }}
                style={{ flex: 1, background: tab === t ? "#fff" : "transparent", border: "none", borderRadius: 10, padding: "10px 0", cursor: "pointer", fontWeight: 800, fontSize: 14, color: tab === t ? "#f97316" : "#7c5c3e", fontFamily: "'Nunito', sans-serif", boxShadow: tab === t ? "0 2px 8px rgba(0,0,0,0.08)" : "none", transition: "all .2s" }}>
                {t === "login" ? "🔑 Sign In" : "✨ Register"}
              </button>
            ))}
          </div>

          {/* ── SIGN IN ── */}
          {tab === "login" && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Email Address</label>
                <input
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="you@gmail.com"
                  type="email"
                  style={inp}
                />
              </div>
              <div style={{ marginBottom: 14, position: "relative" }}>
                <label style={lbl}>Password</label>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="Enter your password"
                  style={inp}
                />
                <button onClick={() => setShowPass(v => !v)}
                  style={{ position: "absolute", right: 12, top: 34, background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
              {error && (
                <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
                  ❌ {error}
                </div>
              )}
              <button onClick={handleLogin} disabled={loading}
                style={{ width: "100%", background: loading ? "#e5d5c5" : "linear-gradient(135deg,#f97316,#ea6c0a)", color: "#fff", border: "none", borderRadius: 12, padding: 14, cursor: loading ? "not-allowed" : "pointer", fontWeight: 900, fontSize: 16, fontFamily: "'Nunito', sans-serif" }}>
                {loading ? "Signing in…" : "Sign In →"}
              </button>
              <div style={{ marginTop: 14, fontSize: 12, color: "#7c5c3e", textAlign: "center" }}>
                Don't have an account? <span onClick={() => { setTab("register"); setError(""); }} style={{ color: "#f97316", fontWeight: 800, cursor: "pointer" }}>Register here</span>
              </div>
            </div>
          )}

          {/* ── REGISTER ── */}
          {tab === "register" && (
            <div>
              {regSuccess ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>📧</div>
                  <div style={{ fontWeight: 900, fontSize: 20, color: "#2d1a0e", marginBottom: 8 }}>Check your email!</div>
                  <div style={{ color: "#7c5c3e", fontSize: 14, lineHeight: 1.7 }}>
                    We sent a verification link to <strong>{regEmail}</strong>.<br />
                    Please verify your email before signing in.
                  </div>
                  <button onClick={() => { setTab("login"); setRegSuccess(false); setError(""); }}
                    style={{ marginTop: 20, background: "#f97316", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 800, fontFamily: "'Nunito', sans-serif" }}>
                    Go to Sign In →
                  </button>
                </div>
              ) : (
                <>
                  {[
                    { label: "Full Name", val: regName,  set: setRegName,  placeholder: "e.g. Maria Santos", type: "text" },
                    { label: "Email",     val: regEmail, set: setRegEmail, placeholder: "you@gmail.com",     type: "email" },
                    { label: "Phone",     val: regPhone, set: setRegPhone, placeholder: "09XXXXXXXXX",       type: "tel" },
                    { label: "Password",  val: regPass,  set: setRegPass,  placeholder: "Min. 6 characters", type: "password" },
                  ].map(f => (
                    <div key={f.label} style={{ marginBottom: 14 }}>
                      <label style={lbl}>{f.label}</label>
                      <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={inp} />
                    </div>
                  ))}
                  {error && (
                    <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
                      ❌ {error}
                    </div>
                  )}
                  <button onClick={handleRegister} disabled={loading}
                    style={{ width: "100%", background: loading ? "#e5d5c5" : "linear-gradient(135deg,#f97316,#ea6c0a)", color: "#fff", border: "none", borderRadius: 12, padding: 14, cursor: loading ? "not-allowed" : "pointer", fontWeight: 900, fontSize: 16, fontFamily: "'Nunito', sans-serif" }}>
                    {loading ? "Creating account…" : "Create Account ✨"}
                  </button>
                  <div style={{ marginTop: 14, fontSize: 12, color: "#7c5c3e", textAlign: "center" }}>
                    Already have an account? <span onClick={() => { setTab("login"); setError(""); }} style={{ color: "#f97316", fontWeight: 800, cursor: "pointer" }}>Sign in here</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#b08060" }}>
          🔒 Secured by Firebase Authentication
        </div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
function Root() {
  const [authReady,    setAuthReady]    = useState(false);
  const [userDoc,      setUserDoc]      = useState(null);
  const [showLogin,    setShowLogin]    = useState(false);
  const [initialTab,   setInitialTab]   = useState("login");
  const [showPetSetup, setShowPetSetup] = useState(false);
  const [products,     setProducts]     = useState([]);
  const [orders,       setOrders]       = useState([]);
  const [customers,    setCustomers]    = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (!firebaseUser.emailVerified) {
          await signOut(auth);
          setUserDoc(null);
          setAuthReady(true);
          return;
        }
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (snap.exists()) {
          const data = { uid: firebaseUser.uid, ...snap.data() };
          setUserDoc(data);
          if (!data.profileComplete && data.role !== "admin") setShowPetSetup(true);
        } else {
          setUserDoc({ uid: firebaseUser.uid, name: firebaseUser.email, email: firebaseUser.email, role: "customer" });
        }
      } else {
        setUserDoc(null);
        setShowPetSetup(false);
      }
      setAuthReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    seedProductsIfEmpty();
    return unsub;
  }, []);

  useEffect(() => {
    if (!userDoc) return;
    let q;
    if (userDoc.role === "admin") {
      q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    } else {
      q = query(collection(db, "orders"), where("customerEmail", "==", userDoc.email), orderBy("createdAt", "desc"));
    }
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [userDoc]);

  useEffect(() => {
    if (!userDoc || userDoc.role !== "admin") return;
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.role === "customer"));
    });
    return unsub;
  }, [userDoc]);

  const updateProduct = async (updated) => { const { id, ...data } = updated; await updateDoc(doc(db, "products", id), data); };
  const addProduct    = async (p) => { await addDoc(collection(db, "products"), p); };
  const deleteProduct = async (id) => { await deleteDoc(doc(db, "products", id)); };

  const addOrder = async (order) => {
    await addDoc(collection(db, "orders"), { ...order, createdAt: serverTimestamp() });
    if (userDoc?.uid) {
      const newOrders = (userDoc.orders || 0) + 1;
      const newSpent  = (userDoc.spent  || 0) + order.total;
      await updateDoc(doc(db, "users", userDoc.uid), { orders: newOrders, spent: newSpent, status: newSpent > 10000 ? "VIP" : "Active" });
      setUserDoc(prev => ({ ...prev, orders: newOrders, spent: newSpent }));
    }
  };

  const updateOrder  = async (updated) => { const { id, ...data } = updated; await updateDoc(doc(db, "orders", id), data); };
  const handleLogout = () => { signOut(auth); setShowLogin(false); };

  const handlePetProfileComplete = (petProfile) => {
    setUserDoc(prev => ({ ...prev, petProfile, profileComplete: true }));
    setShowPetSetup(false);
  };

  // Loading
  if (!authReady) {
    return (
      <div style={{ minHeight: "100vh", background: "#fdf6ee", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 16, animation: "pulse 1.5s ease infinite" }}>🐾</div>
          <div style={{ color: "#7c5c3e", fontWeight: 700, fontSize: 16 }}>Loading PawMart…</div>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
        </div>
      </div>
    );
  }

  // Show login/register screen
  if (showLogin && !userDoc) return (
    <div>
      <LoginScreen initialTab={initialTab} />
      <button onClick={() => setShowLogin(false)}
        style={{ position: "fixed", top: 16, left: 16, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'Nunito', sans-serif", color: "#2d1a0e", zIndex: 9999, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        ← Browse as Guest
      </button>
    </div>
  );

  // Pet profile setup
  if (showPetSetup && userDoc) {
    return <PetProfileSetup userDoc={userDoc} onComplete={handlePetProfileComplete} />;
  }

  // Admin
  if (userDoc?.role === "admin") {
    return (
      <StoreContext.Provider value={{ products, updateProduct, addProduct, deleteProduct, orders, addOrder, updateOrder, customers, user: userDoc }}>
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 99999, background: "#140d05", borderBottom: "1px solid rgba(249,115,22,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", fontFamily: "'Nunito', sans-serif" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🐾</span>
            <span style={{ color: "#f97316", fontWeight: 900, fontSize: 14 }}>PawMart</span>
            <span style={{ background: "#ef4444", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>🔴 ADMIN</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#f0e8de", fontSize: 12, fontWeight: 600 }}>👤 {userDoc.name}</span>
            <button onClick={handleLogout} style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "'Nunito', sans-serif" }}>Sign Out</button>
          </div>
        </div>
        <div style={{ paddingTop: 44 }}><Admin /></div>
      </StoreContext.Provider>
    );
  }

  // Guest or logged-in customer
  return (
    <StoreContext.Provider value={{ products, updateProduct, addProduct, deleteProduct, orders, addOrder, updateOrder, customers, user: userDoc }}>
      {/* Top auth bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 99999, background: "#2d1a0e", borderBottom: "1px solid rgba(249,115,22,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", fontFamily: "'Nunito', sans-serif", minHeight: 44 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🐾</span>
          <span style={{ color: "#f97316", fontWeight: 900, fontSize: 13 }}>PawMart</span>
          {userDoc && <span style={{ background: "#22c55e", color: "#fff", borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 800 }}>🟢 CUSTOMER</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {userDoc ? (
            <>
              <span style={{ color: "#f0e8de", fontSize: 12, fontWeight: 600, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                👤 {userDoc.name?.split(" ")[0]}
              </span>
              <button onClick={handleLogout} style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontWeight: 700, fontSize: 11, fontFamily: "'Nunito', sans-serif" }}>Sign Out</button>
            </>
          ) : (
            <>
              <button onClick={() => { setInitialTab("login"); setShowLogin(true); }}
                style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "'Nunito', sans-serif" }}>
                Sign In
              </button>
              <button onClick={() => { setInitialTab("register"); setShowLogin(true); }}
                style={{ background: "#f97316", color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "'Nunito', sans-serif" }}>
                Register
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ paddingTop: 44 }}>
        <App onLoginRequest={() => { setInitialTab("register"); setShowLogin(true); }} />
      </div>

      {/* Guest register banner */}
      {!userDoc && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "linear-gradient(135deg,#2d1a0e,#7c3f1a)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 9998, boxShadow: "0 -4px 20px rgba(0,0,0,0.2)", flexWrap: "wrap", gap: 8 }}>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
            🐾 <span style={{ color: "#f97316" }}>Join PawMart</span> — Get personalized pet advice & exclusive deals!
          </div>
          <button onClick={() => { setInitialTab("register"); setShowLogin(true); }}
            style={{ background: "#f97316", color: "#fff", border: "none", borderRadius: 10, padding: "8px 20px", cursor: "pointer", fontWeight: 900, fontSize: 13, fontFamily: "'Nunito', sans-serif", whiteSpace: "nowrap" }}>
            Register Free →
          </button>
        </div>
      )}
    </StoreContext.Provider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />);