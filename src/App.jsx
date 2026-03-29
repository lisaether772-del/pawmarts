import { useState, useRef, useEffect, useContext } from "react";
import { StoreContext } from "./index";
import PetScanner from "./PetScanner";

const PAWS_SYSTEM_PROMPT = `You are Paws 🐾 — the friendly, expert AI pet advisor for PawMart, a Philippine-based online pet shop.

Your personality:
- Warm, enthusiastic, and genuinely knowledgeable
- You use relevant emojis naturally (not excessively)
- You speak conversationally, not like a textbook
- You always give practical, actionable advice
- You are especially knowledgeable about pets in the Philippine context

Your expertise covers:
1. **Dog breeds** — full profiles including temperament, size, energy level, trainability, shedding, hypoallergenic status, good with kids, apartment-friendly, price range in the Philippines, common health issues, lifespan
2. **Cat breeds** — same depth as dogs
3. **Fish** — freshwater and saltwater species, tank requirements, compatibility, care difficulty
4. **Birds** — parrots, budgerigars, cockatiels, lovebirds, finches, etc.
5. **Small animals** — hamsters, guinea pigs, rabbits, gerbils, ferrets
6. **Pet health** — symptoms, when to see a vet, vaccination schedules, deworming, common diseases in the Philippines
7. **Nutrition** — what to feed, what's toxic, feeding schedules
8. **Training** — basic commands, potty training, behavior issues
9. **Lifestyle matching** — help people find the perfect pet for their lifestyle, living situation, activity level, budget, family situation
10. **Philippine-specific knowledge** — local vet resources, PAWS/CARA adoption, price ranges in PHP (₱), climate considerations (PH heat), popular local breeds like Aspin and Puspin

Always remember: You are Paws, PawMart's beloved pet advisor. Be helpful, be honest, and help people make great decisions for their pets and families! 🐾`;

const PET_ENCY = {
  dog:   { title:"Dogs 🐕",         overview:"Dogs (Canis lupus familiaris) are loyal, intelligent mammals with over 340 recognized breeds worldwide.", lifespan:"10–16 yrs", diet:"Omnivores — quality commercial food, lean meats, vegetables. Avoid grapes, onions, chocolate, xylitol.", care:["Daily exercise 30 min–2 hrs","Regular grooming & nail trims","Annual vet checkups + vaccines","Dental hygiene 2–3x/week","Socialization from puppyhood"], funFact:"Dogs have ~300 million olfactory receptors — humans have only 6 million!" },
  cat:   { title:"Cats 🐈",         overview:"Cats (Felis catus) are agile, independent creatures. Indoor cats live significantly longer than outdoor cats.", lifespan:"12–18 years", diet:"Obligate carnivores — high-protein meat diet. Taurine is essential.", care:["Litter box cleaned daily","Annual vet visits + vaccines","Scratching posts + enrichment toys","Brush coat 1–2x/week","Keep indoors for safety"], funFact:"Cats spend 70% of their lives sleeping and can make over 100 distinct vocal sounds!" },
  fish:  { title:"Fish 🐠",         overview:"Aquarium fish range from hardy beginner species to delicate reef dwellers. Water quality is the single most important factor.", lifespan:"1–15+ years", diet:"Species-specific: flakes, pellets, live/frozen foods like bloodworms and brine shrimp.", care:["Weekly 25–30% water changes","Monitor pH, ammonia & nitrites","Never overfeed","Provide hiding spots","Quarantine new fish 2 weeks"], funFact:"Betta fish can breathe atmospheric air using a special labyrinth organ!" },
  bird:  { title:"Birds 🦜",        overview:"Pet birds range from 5-year budgerigars to 60-year African Greys. They are highly intelligent.", lifespan:"5–60 years", diet:"Seeds, pellets, fresh fruits and vegetables. Never avocado, chocolate, or caffeine.", care:["Large cage with horizontal bars","Daily out-of-cage time","Fresh water daily","Regular vet visits","Rotate toys weekly"], funFact:"African Grey Parrots have the cognitive ability of a 5-year-old human child!" },
  small: { title:"Small Animals 🐹", overview:"Hamsters, guinea pigs, and rabbits need less space but still require daily care and enrichment.", lifespan:"2–12 years", diet:"Unlimited hay for rabbits/guinea pigs, seeds and pellets for hamsters, plus fresh vegetables.", care:["Clean cage weekly","Handle gently daily","Provide enrichment: tunnels, wheels","Fresh water always","Keep away from drafts"], funFact:"Guinea pigs are born with open eyes and can run within hours of birth!" },
};

const BREED_ICONS = {
  dog: ["🦮","🐕","🐩","🐺","🦺","🐾"],
  cat: ["😺","🐱","💙","🦁","🐆","🐈"],
  fish: ["🐟","🐠","🫧"],
  bird: ["💚","🐦","❤️","🦜"],
  small: ["🐹","🐾","🐰"],
};

const QUICK_PROMPTS = [
  { label:"🐕 Best dog for me?",    msg:"I'm looking for a dog — can you help me find the right breed for my lifestyle?" },
  { label:"🏠 Apartment pets?",     msg:"What pets are best for apartment or condo living in the Philippines?" },
  { label:"🐱 Calm cat breeds?",    msg:"What are the calmest and most low-maintenance cat breeds?" },
  { label:"🇵🇭 Aspin vs purebred?", msg:"What's the difference between an Aspin and a purebred dog? Should I adopt an Aspin?" },
  { label:"🐟 Beginner fish?",      msg:"What are the best fish for a complete beginner with no aquarium experience?" },
  { label:"👶 Pets for kids?",      msg:"What pets are safe and good for families with young children?" },
  { label:"💰 Affordable pets?",    msg:"What are the most affordable pets to own in the Philippines?" },
  { label:"🤧 Hypoallergenic?",     msg:"I have pet allergies — what hypoallergenic pets or breeds would you recommend?" },
];

const tagColors = { Bestseller:"#f97316", New:"#8b5cf6", Hot:"#ef4444", Premium:"#eab308", Value:"#22c55e", Popular:"#3b82f6", Training:"#06b6d4", Kit:"#ec4899", Health:"#10b981", Organic:"#84cc16" };
const petEmojis = { dog:"🐕", cat:"🐈", fish:"🐠", bird:"🦜", small:"🐹" };
const petColors = { dog:"#f97316", cat:"#8b5cf6", fish:"#3b82f6", bird:"#22c55e", small:"#ec4899" };

export default function PawMart({ onLoginRequest }) {
  const store    = useContext(StoreContext);
  const PRODUCTS = store ? store.products : [];
  const { addOrder, user } = store || {};
  const petProfile = user?.petProfile;

  const [view, setView]             = useState("home");
  const [filter, setFilter]         = useState("all");
  const [cart, setCart]             = useState([]);
  const [chatOpen, setChatOpen]     = useState(false);
  const [msgs, setMsgs]             = useState([{
    role: "assistant",
    content: petProfile
      ? `Hi ${user?.name?.split(" ")[0]}! 🐾 I'm **Paws**, your AI pet advisor!\n\nI see you have **${petProfile.name}** the ${petProfile.breed || petProfile.type}! 🎉 I can give personalized advice for ${petProfile.name} or help with any other pet questions.\n\nWhat can I help you with today? 😊`
      : `Hi! 🐾 I'm **Paws**, your AI pet advisor!\n\nAsk me anything about pets — breeds, health, care, costs in ₱, and more!\n\n🇵🇭 I specialize in Philippine pet care too! 😊`
  }]);
  const [input, setInput]           = useState("");
  const [isTyping, setIsTyping]     = useState(false);
  const [selProd, setSelProd]       = useState(null);
  const [encyPet, setEncyPet]       = useState("dog");
  const [checkoutStep, setChkStep]  = useState(0);
  const [payMethod, setPayMethod]   = useState("");
  const [orderDone, setOrderDone]   = useState(false);
  const [notif, setNotif]           = useState("");
  const [highlights, setHighlights] = useState([]);
  const chatEnd = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, isTyping]);

  const toast = (msg) => { setNotif(msg); setTimeout(() => setNotif(""), 2800); };

  const addToCart = (p) => {
    if (!user && onLoginRequest) { onLoginRequest(); toast("🔑 Please sign in to add items to cart!"); return; }
    setCart(prev => { const ex = prev.find(i => i.id === p.id); if (ex) return prev.map(i => i.id === p.id ? {...i, qty: i.qty+1} : i); return [...prev, {...p, qty:1}]; });
    toast(`✅ ${p.name} added to cart!`);
  };
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQty = (id, d) => setCart(prev => prev.map(i => i.id === id ? {...i, qty: Math.max(1, i.qty+d)} : i));
  const cartTotal = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s,i) => s + i.qty, 0);
  const filtered  = filter === "all" ? PRODUCTS : PRODUCTS.filter(p => p.category === filter || p.type === filter);

  const personalizedProducts = petProfile
    ? PRODUCTS.filter(p => p.pet && p.pet.includes(petProfile.type))
    : [];

  const sendMessage = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || isTyping) return;
    setInput("");
    const userMsg = { role:"user", content: text };
    const updatedMsgs = [...msgs, userMsg];
    setMsgs(updatedMsgs);
    setIsTyping(true);
    const productContext = PRODUCTS.length > 0
      ? `\n\nCurrent PawMart product catalogue: ${PRODUCTS.map(p => `${p.name} (₱${p.price}, ${p.category}, ${p.stock} in stock)`).join(" | ")}`
      : "";
    const petContext = petProfile
      ? `\n\nThis user owns: ${petProfile.name}, a ${petProfile.age || ""} ${petProfile.breed || petProfile.type}. Personalize advice for their pet when relevant.`
      : "";
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer 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" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          messages: [
            { role: "system", content: PAWS_SYSTEM_PROMPT + productContext + petContext },
            ...updatedMsgs.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }))
          ]
        })
      });
      const data = await response.json();
      const replyText = data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response. Please try again! 🐾";
      setMsgs(prev => [...prev, { role:"assistant", content: replyText }]);
      const mentioned = PRODUCTS.filter(p => replyText.toLowerCase().includes(p.name.toLowerCase().split(" ")[0])).map(p => p.id).slice(0, 4);
      if (mentioned.length > 0) { setHighlights(mentioned); toast("💡 Relevant products highlighted in Shop!"); }
    } catch (err) {
      setMsgs(prev => [...prev, { role:"assistant", content:"Oops — I had trouble connecting! 🐾 Please check your internet and try again." }]);
    } finally { setIsTyping(false); }
  };

  const placeOrder = () => {
    const o = { id:"ORD-"+Date.now(), customer:user?.name||"Guest", customerEmail:user?.email, items:cart.map(i=>i.name), total:cartTotal, status:"Processing", date:new Date().toISOString().slice(0,10), payment:payMethod };
    if (addOrder) addOrder(o);
    setOrderDone(true); setCart([]); setChkStep(0); setPayMethod("");
  };

  const fmt = (text) => text.split("\n").map((line, i, arr) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
      /^\*\*[^*]+\*\*$/.test(part) ? <strong key={j}>{part.slice(2,-2)}</strong> : part
    );
    return <span key={i}>{parts}{i < arr.length-1 && <br/>}</span>;
  });

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif", background:"#fdf6ee", minHeight:"100vh", color:"#2d1a0e" }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Playfair+Display:wght@700&display=swap" rel="stylesheet"/>

      {notif && (
        <div style={{ position:"fixed",top:52,left:"50%",transform:"translateX(-50%)",background:"#2d1a0e",color:"#fff",padding:"10px 18px",borderRadius:12,zIndex:9000,fontWeight:700,fontSize:13,boxShadow:"0 4px 20px rgba(0,0,0,0.2)",animation:"slideIn .3s ease",whiteSpace:"nowrap",maxWidth:"90vw",textAlign:"center" }}>
          {notif}
        </div>
      )}

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav style={{ background:"#2d1a0e",padding:"0 12px",display:"flex",alignItems:"center",justifyContent:"space-between",height:52,position:"sticky",top:44,zIndex:100,boxShadow:"0 2px 12px rgba(0,0,0,0.25)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer",flexShrink:0 }} onClick={()=>setView("home")}>
          <span style={{ fontSize:20 }}>🐾</span>
          <span style={{ fontFamily:"'Playfair Display',serif",color:"#f97316",fontSize:18,fontWeight:700 }}>PawMart</span>
        </div>
        <div style={{ display:"flex",gap:2,overflow:"hidden" }}>
          {["home","shop","encyclopedia","scan","cart"].map(v => (
            <button key={v} onClick={()=>{ setView(v); if(v==="shop") setHighlights([]); }}
              style={{ background:view===v?"#f97316":"transparent",color:"#fff",border:"none",borderRadius:8,padding:"6px 8px",cursor:"pointer",fontWeight:700,fontSize:11,textTransform:"capitalize",fontFamily:"'Nunito',sans-serif",transition:"background .2s",whiteSpace:"nowrap" }}>
              {v==="cart" ? `🛒${cartCount>0?` (${cartCount})`:""}`
                : v==="encyclopedia" ? "📚"
                : v==="scan" ? "📷"
                : v.charAt(0).toUpperCase()+v.slice(1)}
            </button>
          ))}
        </div>
      </nav>

      {/* ── HOME ───────────────────────────────────────────────────────────── */}
      {view==="home" && (
        <div style={{ paddingBottom: !user ? 80 : 0 }}>
          <div style={{ background:"linear-gradient(135deg,#2d1a0e 0%,#7c3f1a 55%,#f97316 100%)",padding:"48px 20px 52px",textAlign:"center",position:"relative",overflow:"hidden" }}>
            <div style={{ position:"absolute",top:-60,right:-60,width:200,height:200,borderRadius:"50%",background:"rgba(249,115,22,0.12)",pointerEvents:"none" }}/>
            <div style={{ position:"absolute",bottom:-40,left:-40,width:140,height:140,borderRadius:"50%",background:"rgba(255,255,255,0.05)",pointerEvents:"none" }}/>
            {petProfile && (
              <div style={{ display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",borderRadius:20,padding:"6px 16px",marginBottom:16,border:"1px solid rgba(255,255,255,0.2)" }}>
                <span style={{ fontSize:18 }}>{petEmojis[petProfile.type]||"🐾"}</span>
                <span style={{ color:"#fff",fontWeight:700,fontSize:13 }}>{petProfile.name}'s Store</span>
              </div>
            )}
            <div style={{ fontSize:48,marginBottom:12 }}>🐾</div>
            <h1 style={{ fontFamily:"'Playfair Display',serif",color:"#fff",fontSize:"clamp(22px,6vw,40px)",margin:"0 0 12px",lineHeight:1.25 }}>
              {user ? `Welcome, ${user.name?.split(" ")[0]}!` : "Welcome to PawMart!"}<br/>
              <span style={{ color:"#f97316" }}>Your Pet's Best Life Starts Here</span>
            </h1>
            <p style={{ color:"rgba(255,255,255,0.82)",fontSize:14,maxWidth:480,margin:"0 auto 24px",lineHeight:1.7 }}>
              Shop premium pet products, get personalized AI advice, and learn everything about pet care.
            </p>
            <div style={{ display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap" }}>
              <button onClick={()=>setView("shop")} style={{ background:"#f97316",color:"#fff",border:"none",borderRadius:12,padding:"12px 24px",cursor:"pointer",fontWeight:900,fontSize:14,fontFamily:"'Nunito',sans-serif",boxShadow:"0 4px 20px rgba(249,115,22,0.4)" }}>
                Shop Now →
              </button>
              <button onClick={()=>setChatOpen(true)} style={{ background:"rgba(255,255,255,0.12)",color:"#fff",border:"2px solid rgba(255,255,255,0.35)",borderRadius:12,padding:"12px 24px",cursor:"pointer",fontWeight:900,fontSize:14,fontFamily:"'Nunito',sans-serif" }}>
                Ask Paws AI 🤖
              </button>
              <button onClick={()=>setView("scan")} style={{ background:"rgba(255,255,255,0.12)",color:"#fff",border:"2px solid rgba(255,255,255,0.35)",borderRadius:12,padding:"12px 24px",cursor:"pointer",fontWeight:900,fontSize:14,fontFamily:"'Nunito',sans-serif" }}>
                Scan Pet 📷
              </button>
              {!user && (
                <button onClick={onLoginRequest} style={{ background:"#fff",color:"#f97316",border:"none",borderRadius:12,padding:"12px 24px",cursor:"pointer",fontWeight:900,fontSize:14,fontFamily:"'Nunito',sans-serif" }}>
                  Join Free ✨
                </button>
              )}
            </div>
          </div>

          {petProfile && personalizedProducts.length > 0 && (
            <div style={{ padding:"24px 16px 0",maxWidth:1060,margin:"0 auto" }}>
              <div style={{ background:`linear-gradient(135deg,${petColors[petProfile.type]}22,${petColors[petProfile.type]}11)`,border:`2px solid ${petColors[petProfile.type]}44`,borderRadius:16,padding:"16px 20px" }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
                  <span style={{ fontSize:24 }}>{petEmojis[petProfile.type]}</span>
                  <div>
                    <div style={{ fontWeight:900,fontSize:15,color:"#2d1a0e" }}>Picked for {petProfile.name} 💛</div>
                    <div style={{ fontSize:12,color:"#7c5c3e" }}>Products tailored for your {petProfile.breed || petProfile.type}</div>
                  </div>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10 }}>
                  {personalizedProducts.slice(0,4).map(p => (
                    <ProductCard key={p.id} p={p} addToCart={addToCart} setSelProd={setSelProd} highlight={false} compact={true} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Feature cards */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,padding:"24px 16px",maxWidth:1060,margin:"0 auto" }}>
            {[
              { icon:"🤖", title:"Paws AI",       desc:"Ask anything about pets",    action:()=>setChatOpen(true),  badge:"AI" },
              { icon:"📷", title:"PawScan",        desc:"Identify any pet breed",     action:()=>setView("scan"),    badge:"NEW" },
              { icon:"🔍", title:"Shop",           desc:"Browse all products",        action:()=>setView("shop") },
              { icon:"📚", title:"Encyclopedia",  desc:"Pet care guides",             action:()=>setView("encyclopedia") },
              { icon:"💳", title:"Checkout",       desc:"GCash, COD & more",          action:()=>setView("cart") },
            ].map(f => (
              <div key={f.title} onClick={f.action} style={{ background:"#fff",borderRadius:14,padding:"16px 14px",cursor:"pointer",boxShadow:"0 2px 12px rgba(0,0,0,0.07)",border:"2px solid transparent",transition:"all .25s",position:"relative",textAlign:"center" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#f97316";e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="transparent";e.currentTarget.style.transform="translateY(0)";}}>
                {f.badge && <span style={{ position:"absolute",top:8,right:8,background:"#f97316",color:"#fff",borderRadius:5,padding:"1px 6px",fontSize:9,fontWeight:900 }}>{f.badge}</span>}
                <div style={{ fontSize:30,marginBottom:8 }}>{f.icon}</div>
                <h3 style={{ margin:"0 0 4px",fontWeight:900,fontSize:13,color:"#2d1a0e" }}>{f.title}</h3>
                <p style={{ margin:0,color:"#7c5c3e",fontSize:11,lineHeight:1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Quick AI prompts */}
          <div style={{ padding:"0 16px 20px",maxWidth:1060,margin:"0 auto" }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12 }}>
              <span style={{ fontSize:18 }}>🤖</span>
              <span style={{ fontWeight:800,fontSize:14,color:"#2d1a0e" }}>Ask Paws anything</span>
            </div>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {QUICK_PROMPTS.map(q => (
                <button key={q.label} onClick={()=>{setChatOpen(true);setTimeout(()=>sendMessage(q.msg),200);}}
                  style={{ background:"#fff",border:"2px solid #e5d5c5",borderRadius:16,padding:"6px 12px",cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"'Nunito',sans-serif",color:"#2d1a0e",transition:"all .2s" }}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Featured products */}
          <div style={{ padding:"0 16px 52px",maxWidth:1060,margin:"0 auto" }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:16 }}>⭐ Featured Products</h2>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12 }}>
              {PRODUCTS.filter(p=>["Bestseller","New","Hot"].includes(p.tag)).map(p=>(
                <ProductCard key={p.id} p={p} addToCart={addToCart} setSelProd={setSelProd} highlight={false}/>
              ))}
            </div>
          </div>

          {!user && (
            <div style={{ margin:"0 16px 80px",background:"linear-gradient(135deg,#2d1a0e,#7c3f1a)",borderRadius:20,padding:"28px 20px",textAlign:"center" }}>
              <div style={{ fontSize:40,marginBottom:12 }}>🐾</div>
              <h3 style={{ color:"#fff",fontFamily:"'Playfair Display',serif",fontSize:20,margin:"0 0 10px" }}>Unlock the Full PawMart Experience</h3>
              <p style={{ color:"rgba(255,255,255,0.75)",fontSize:13,marginBottom:20,lineHeight:1.7 }}>
                Create a free account to get personalized pet recommendations, save your cart, track orders, and unlock PawScan & Paws AI!
              </p>
              <div style={{ display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap" }}>
                <button onClick={onLoginRequest} style={{ background:"#f97316",color:"#fff",border:"none",borderRadius:12,padding:"11px 24px",cursor:"pointer",fontWeight:900,fontSize:14,fontFamily:"'Nunito',sans-serif" }}>Register Free ✨</button>
                <button onClick={onLoginRequest} style={{ background:"transparent",color:"#fff",border:"2px solid rgba(255,255,255,0.4)",borderRadius:12,padding:"11px 24px",cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"'Nunito',sans-serif" }}>Sign In →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SHOP ───────────────────────────────────────────────────────────── */}
      {view==="shop" && (
        <div style={{ maxWidth:1060,margin:"0 auto",padding:"20px 16px",paddingBottom:!user?80:20 }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:24,marginBottom:4 }}>Shop All Products</h2>
          <p style={{ color:"#7c5c3e",marginBottom:16,fontSize:13 }}>{filtered.length} products available</p>
          {highlights.length>0 && (
            <div style={{ background:"#fff7ed",border:"2px solid #f97316",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,fontWeight:700,color:"#9a3412",display:"flex",alignItems:"center",gap:8 }}>
              <span>🤖 Paws recommended these!</span>
              <button onClick={()=>setHighlights([])} style={{ background:"none",border:"none",cursor:"pointer",color:"#f97316",fontWeight:900,fontSize:14,marginLeft:"auto" }}>✕</button>
            </div>
          )}
          <div style={{ display:"flex",gap:6,marginBottom:18,overflowX:"auto",paddingBottom:4,WebkitOverflowScrolling:"touch" }}>
            {[["all","All 🐾"],["dog","Dogs 🐕"],["cat","Cats 🐈"],["fish","Fish 🐠"],["bird","Birds 🦜"],["small","Small 🐹"],["food","Food 🍖"],["accessories","Accessories 🧸"],["toys","Toys 🎮"],["health","Health 🏥"]].map(([val,label]) => (
              <button key={val} onClick={()=>setFilter(val)}
                style={{ background:filter===val?"#2d1a0e":"#fff",color:filter===val?"#fff":"#2d1a0e",border:`2px solid ${filter===val?"#2d1a0e":"#e5d5c5"}`,borderRadius:20,padding:"6px 12px",cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"'Nunito',sans-serif",transition:"all .2s",whiteSpace:"nowrap",flexShrink:0 }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12 }}>
            {filtered.map(p=><ProductCard key={p.id} p={p} addToCart={addToCart} setSelProd={setSelProd} highlight={highlights.includes(p.id)}/>)}
          </div>
        </div>
      )}

      {/* ── ENCYCLOPEDIA ───────────────────────────────────────────────────── */}
      {view==="encyclopedia" && (
        <div style={{ maxWidth:920,margin:"0 auto",padding:"20px 16px",paddingBottom:!user?80:20 }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:24,marginBottom:4 }}>🐾 Pet Encyclopedia</h2>
          <p style={{ color:"#7c5c3e",marginBottom:20,fontSize:13 }}>Tap any breed to ask Paws for more detail!</p>
          <div style={{ display:"flex",gap:6,marginBottom:24,overflowX:"auto",paddingBottom:4,WebkitOverflowScrolling:"touch" }}>
            {Object.entries(PET_ENCY).map(([key,val]) => (
              <button key={key} onClick={()=>setEncyPet(key)}
                style={{ background:encyPet===key?"#f97316":"#fff",color:encyPet===key?"#fff":"#2d1a0e",border:`2px solid ${encyPet===key?"#f97316":"#e5d5c5"}`,borderRadius:20,padding:"8px 16px",cursor:"pointer",fontWeight:800,fontSize:12,fontFamily:"'Nunito',sans-serif",transition:"all .2s",whiteSpace:"nowrap",flexShrink:0 }}>
                {val.title}
              </button>
            ))}
          </div>
          {(() => {
            const pet = PET_ENCY[encyPet];
            const icons = BREED_ICONS[encyPet] || ["🐾"];
            const breedExamples = {
              dog:   ["Golden Retriever","Labrador","Shih Tzu","Aspin","Poodle","Beagle","Pomeranian","Husky","German Shepherd","French Bulldog","Dachshund","Maltese"],
              cat:   ["Persian","Siamese","Ragdoll","Maine Coon","Bengal","Puspin","Scottish Fold","Sphynx"],
              fish:  ["Betta","Goldfish","Guppy","Molly","Neon Tetra","Oscar","Angelfish","Discus"],
              bird:  ["Budgerigar","Cockatiel","Lovebird","African Grey","Macaw","Conure","Finch"],
              small: ["Hamster","Guinea Pig","Rabbit","Gerbil","Chinchilla","Ferret"],
            };
            return (
              <div style={{ background:"#fff",borderRadius:18,padding:"20px 16px",boxShadow:"0 4px 20px rgba(0,0,0,0.08)" }}>
                <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:12 }}>{pet.title}</h3>
                <p style={{ lineHeight:1.8,color:"#4a2c0e",marginBottom:16,fontSize:14 }}>{pet.overview}</p>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16 }}>
                  {[["⏳ Lifespan",pet.lifespan],["🍽️ Diet",pet.diet]].map(([label,val]) => (
                    <div key={label} style={{ background:"#fdf6ee",borderRadius:10,padding:12 }}>
                      <div style={{ fontWeight:900,fontSize:11,color:"#f97316",marginBottom:4 }}>{label}</div>
                      <div style={{ fontSize:12,lineHeight:1.6,color:"#4a2c0e" }}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:"#fdf6ee",borderRadius:10,padding:14,marginBottom:16 }}>
                  <div style={{ fontWeight:900,fontSize:11,color:"#f97316",marginBottom:8,textTransform:"uppercase" }}>🏥 Care Checklist</div>
                  {pet.care.map((c,i) => (
                    <div key={i} style={{ display:"flex",gap:8,marginBottom:6 }}>
                      <span style={{ color:"#f97316",fontWeight:900,flexShrink:0 }}>✓</span>
                      <span style={{ fontSize:12,color:"#4a2c0e",lineHeight:1.6 }}>{c}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background:"linear-gradient(135deg,#2d1a0e,#7c3f1a)",borderRadius:10,padding:14,marginBottom:20 }}>
                  <div style={{ fontWeight:900,fontSize:11,color:"#f97316",marginBottom:4 }}>🌟 Fun Fact</div>
                  <div style={{ color:"#fff",fontSize:12,lineHeight:1.7 }}>{pet.funFact}</div>
                </div>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontWeight:900,fontSize:14,marginBottom:12 }}>🔍 Breeds — Ask Paws for details</div>
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                    {(breedExamples[encyPet]||[]).map((breed,i) => (
                      <button key={breed}
                        onClick={()=>{ setChatOpen(true); setTimeout(()=>sendMessage(`Tell me everything about the ${breed} — personality, care, price in Philippines, pros and cons`), 200); }}
                        style={{ background:"#fdf6ee",border:"2px solid #e5d5c5",borderRadius:10,padding:"7px 12px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:12,color:"#2d1a0e",display:"flex",alignItems:"center",gap:5,transition:"all .2s" }}>
                        <span>{icons[i % icons.length]}</span><span>{breed}</span><span style={{ color:"#f97316",fontSize:10 }}>→</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 style={{ fontWeight:900,marginBottom:10,fontSize:14 }}>🛍️ Recommended Products</h4>
                  <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                    {PRODUCTS.filter(p=>p.pet&&p.pet.includes(encyPet)).map(p => (
                      <div key={p.id} onClick={()=>addToCart(p)}
                        style={{ background:"#fdf6ee",borderRadius:10,padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,border:"2px solid #e5d5c5",transition:"all .2s" }}>
                        <span style={{ fontSize:20 }}>{p.emoji}</span>
                        <div>
                          <div style={{ fontWeight:800,fontSize:11 }}>{p.name}</div>
                          <div style={{ color:"#f97316",fontWeight:900,fontSize:11 }}>₱{p.price.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── PET SCANNER ────────────────────────────────────────────────────── */}
      {view==="scan" && (
        <PetScanner onLoginRequest={onLoginRequest} />
      )}

      {/* ── CART ───────────────────────────────────────────────────────────── */}
      {view==="cart" && !orderDone && (
        <div style={{ maxWidth:640,margin:"0 auto",padding:"20px 16px",paddingBottom:!user?80:20 }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:24,marginBottom:16 }}>🛒 Your Cart</h2>
          {!user ? (
            <div style={{ textAlign:"center",padding:"48px 20px" }}>
              <div style={{ fontSize:52,marginBottom:14 }}>🔑</div>
              <p style={{ color:"#7c5c3e",fontSize:15,marginBottom:20 }}>Sign in to view your cart and checkout!</p>
              <button onClick={onLoginRequest} style={{ background:"#f97316",color:"#fff",border:"none",borderRadius:12,padding:"11px 24px",cursor:"pointer",fontWeight:900,fontSize:14,fontFamily:"'Nunito',sans-serif" }}>Sign In / Register</button>
            </div>
          ) : cart.length===0 ? (
            <div style={{ textAlign:"center",padding:"48px 20px" }}>
              <div style={{ fontSize:52,marginBottom:14 }}>🛒</div>
              <p style={{ color:"#7c5c3e",fontSize:15,marginBottom:20 }}>Your cart is empty!</p>
              <button onClick={()=>setView("shop")} style={{ background:"#f97316",color:"#fff",border:"none",borderRadius:12,padding:"11px 24px",cursor:"pointer",fontWeight:900,fontSize:14,fontFamily:"'Nunito',sans-serif" }}>Browse Products</button>
            </div>
          ) : checkoutStep===0 ? (
            <>
              {cart.map(item => (
                <div key={item.id} style={{ background:"#fff",borderRadius:12,padding:14,marginBottom:10,display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                  <span style={{ fontSize:30,flexShrink:0 }}>{item.emoji}</span>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:800,fontSize:13,lineHeight:1.3 }}>{item.name}</div>
                    <div style={{ color:"#7c5c3e",fontSize:11,marginBottom:6 }}>₱{item.price.toLocaleString()} each</div>
                    <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                      <button onClick={()=>updateQty(item.id,-1)} style={{ background:"#fdf6ee",border:"1px solid #e5d5c5",borderRadius:6,width:26,height:26,cursor:"pointer",fontWeight:700,fontSize:13 }}>−</button>
                      <span style={{ fontWeight:700,minWidth:18,textAlign:"center",fontSize:13 }}>{item.qty}</span>
                      <button onClick={()=>updateQty(item.id,1)} style={{ background:"#fdf6ee",border:"1px solid #e5d5c5",borderRadius:6,width:26,height:26,cursor:"pointer",fontWeight:700,fontSize:13 }}>+</button>
                    </div>
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,flexShrink:0 }}>
                    <div style={{ fontWeight:900,color:"#f97316",fontSize:15 }}>₱{(item.price*item.qty).toLocaleString()}</div>
                    <button onClick={()=>removeFromCart(item.id)} style={{ background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontWeight:700,fontSize:11 }}>✕</button>
                  </div>
                </div>
              ))}
              <div style={{ background:"#fff",borderRadius:12,padding:18,marginTop:8 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8,color:"#7c5c3e",fontSize:13 }}><span>Subtotal</span><span>₱{cartTotal.toLocaleString()}</span></div>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8,color:"#7c5c3e",fontSize:13 }}><span>Delivery</span><span style={{ color:"#22c55e",fontWeight:700 }}>FREE</span></div>
                <div style={{ display:"flex",justifyContent:"space-between",fontWeight:900,fontSize:17,borderTop:"2px solid #fdf6ee",paddingTop:10,marginTop:6 }}>
                  <span>Total</span><span style={{ color:"#f97316" }}>₱{cartTotal.toLocaleString()}</span>
                </div>
                <button onClick={()=>setChkStep(1)} style={{ width:"100%",background:"#2d1a0e",color:"#fff",border:"none",borderRadius:10,padding:13,cursor:"pointer",fontWeight:900,fontSize:14,marginTop:12,fontFamily:"'Nunito',sans-serif" }}>
                  Proceed to Checkout →
                </button>
              </div>
            </>
          ) : (
            <div style={{ background:"#fff",borderRadius:18,padding:24,boxShadow:"0 4px 20px rgba(0,0,0,0.08)" }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:18,marginBottom:18 }}>Select Payment Method</h3>
              {[
                {id:"gcash",icon:"📱",label:"GCash",           desc:"Instant transfer via GCash wallet"},
                {id:"card", icon:"💳",label:"Credit/Debit Card",desc:"Visa, Mastercard, JCB accepted"},
                {id:"cod",  icon:"📦",label:"Cash on Delivery", desc:"Pay when your order arrives"},
                {id:"maya", icon:"🔵",label:"Maya",             desc:"Pay via Maya digital wallet"},
                {id:"bank", icon:"🏦",label:"Online Banking",   desc:"BDO, BPI, Metrobank, UnionBank"},
              ].map(pm => (
                <div key={pm.id} onClick={()=>setPayMethod(pm.id)}
                  style={{ display:"flex",alignItems:"center",gap:12,padding:12,borderRadius:10,marginBottom:8,cursor:"pointer",border:`2px solid ${payMethod===pm.id?"#f97316":"#e5d5c5"}`,background:payMethod===pm.id?"#fff7ed":"#fff",transition:"all .2s" }}>
                  <span style={{ fontSize:22,flexShrink:0 }}>{pm.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800,fontSize:13 }}>{pm.label}</div>
                    <div style={{ color:"#7c5c3e",fontSize:11 }}>{pm.desc}</div>
                  </div>
                  <div style={{ width:18,height:18,borderRadius:"50%",border:`2px solid ${payMethod===pm.id?"#f97316":"#ccc"}`,background:payMethod===pm.id?"#f97316":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    {payMethod===pm.id && <div style={{ width:7,height:7,borderRadius:"50%",background:"#fff" }}/>}
                  </div>
                </div>
              ))}
              <div style={{ display:"flex",gap:8,marginTop:16 }}>
                <button onClick={()=>setChkStep(0)} style={{ flex:1,background:"#fdf6ee",color:"#2d1a0e",border:"2px solid #e5d5c5",borderRadius:10,padding:12,cursor:"pointer",fontWeight:700,fontFamily:"'Nunito',sans-serif",fontSize:13 }}>← Back</button>
                <button onClick={placeOrder} disabled={!payMethod}
                  style={{ flex:2,background:payMethod?"#f97316":"#ccc",color:"#fff",border:"none",borderRadius:10,padding:12,cursor:payMethod?"pointer":"not-allowed",fontWeight:900,fontSize:13,fontFamily:"'Nunito',sans-serif" }}>
                  Place Order — ₱{cartTotal.toLocaleString()} 🎉
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {view==="cart" && orderDone && (
        <div style={{ maxWidth:460,margin:"60px auto",textAlign:"center",padding:28 }}>
          <div style={{ fontSize:64,marginBottom:14 }}>🎉</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:24,marginBottom:10 }}>Order Placed!</h2>
          <p style={{ color:"#7c5c3e",fontSize:14,marginBottom:24,lineHeight:1.7 }}>Your furry friends will love their new goodies! We'll send a confirmation shortly. 🐾</p>
          <button onClick={()=>{setOrderDone(false);setView("shop");}} style={{ background:"#f97316",color:"#fff",border:"none",borderRadius:12,padding:"12px 24px",cursor:"pointer",fontWeight:900,fontSize:14,fontFamily:"'Nunito',sans-serif" }}>Continue Shopping</button>
        </div>
      )}

      {/* ── PRODUCT MODAL ──────────────────────────────────────────────────── */}
      {selProd && (
        <div onClick={()=>setSelProd(null)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#fff",borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:480,boxShadow:"0 -8px 40px rgba(0,0,0,0.2)",maxHeight:"85vh",overflowY:"auto" }}>
            <div style={{ textAlign:"center",fontSize:60,marginBottom:12 }}>{selProd.emoji}</div>
            <div style={{ background:tagColors[selProd.tag]||"#888",color:"#fff",display:"inline-block",borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:900,marginBottom:8 }}>{selProd.tag}</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:19,margin:"0 0 8px" }}>{selProd.name}</h3>
            <p style={{ color:"#7c5c3e",lineHeight:1.7,marginBottom:14,fontSize:13 }}>{selProd.desc}</p>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
              <span style={{ color:"#f97316",fontWeight:900,fontSize:20 }}>₱{selProd.price.toLocaleString()}</span>
              <span style={{ color:"#22c55e",fontWeight:700,fontSize:12 }}>⭐ {selProd.rating} · {selProd.stock} in stock</span>
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>setSelProd(null)} style={{ flex:1,background:"#fdf6ee",border:"2px solid #e5d5c5",borderRadius:10,padding:12,cursor:"pointer",fontWeight:700,fontFamily:"'Nunito',sans-serif",fontSize:13 }}>Close</button>
              <button onClick={()=>{addToCart(selProd);setSelProd(null);}} style={{ flex:2,background:"#f97316",color:"#fff",border:"none",borderRadius:10,padding:12,cursor:"pointer",fontWeight:900,fontFamily:"'Nunito',sans-serif",fontSize:13 }}>Add to Cart 🛒</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CHAT BUTTON ────────────────────────────────────────────────────── */}
      <button onClick={()=>setChatOpen(!chatOpen)}
        style={{ position:"fixed",bottom:!user?76:20,right:16,width:52,height:52,borderRadius:"50%",background:"#f97316",color:"#fff",border:"none",cursor:"pointer",fontSize:22,boxShadow:"0 4px 24px rgba(249,115,22,0.55)",zIndex:150,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s" }}>
        {chatOpen ? "✕" : "🐾"}
      </button>

      {/* ── CHATBOT WINDOW ─────────────────────────────────────────────────── */}
      {chatOpen && (
        <div style={{ position:"fixed",bottom:!user?140:84,right:0,left:0,margin:"0 auto",width:"min(380px,100vw)",background:"#fff",borderRadius:"20px 20px 0 0",boxShadow:"0 -8px 40px rgba(0,0,0,0.18)",zIndex:150,display:"flex",flexDirection:"column",overflow:"hidden",maxHeight:"70vh" }}>
          <div style={{ background:"linear-gradient(135deg,#2d1a0e,#7c3f1a)",padding:"12px 16px",display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:"50%",background:"rgba(249,115,22,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>🐾</div>
            <div style={{ flex:1 }}>
              <div style={{ color:"#fff",fontWeight:900,fontSize:13 }}>Paws AI Advisor</div>
              <div style={{ color:"rgba(255,255,255,0.6)",fontSize:10 }}>
                {petProfile ? `Personalized for ${petProfile.name} · Powered by Groq` : "Powered by Groq · Ask anything about pets"}
              </div>
            </div>
            <div style={{ width:8,height:8,borderRadius:"50%",background:"#22c55e" }}/>
          </div>
          <div style={{ flex:1,overflowY:"auto",padding:"12px 12px 6px",display:"flex",flexDirection:"column",gap:8 }}>
            {msgs.map((m,i) => (
              <div key={i} style={{ display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start" }}>
                <div style={{ background:m.role==="user"?"#f97316":"#fdf6ee",color:m.role==="user"?"#fff":"#2d1a0e",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"9px 13px",maxWidth:"88%",fontSize:13,lineHeight:1.7,fontWeight:500 }}>
                  {fmt(m.content)}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display:"flex",alignItems:"flex-start" }}>
                <div style={{ background:"#fdf6ee",borderRadius:"16px 16px 16px 4px",padding:"10px 14px",display:"flex",gap:5,alignItems:"center" }}>
                  {[0,1,2].map(i => <div key={i} style={{ width:7,height:7,borderRadius:"50%",background:"#f97316",animation:`bounce 1.2s ease ${i*0.2}s infinite` }}/>)}
                </div>
              </div>
            )}
            <div ref={chatEnd}/>
          </div>
          <div style={{ padding:"6px 10px 4px",display:"flex",gap:4,flexWrap:"wrap",borderTop:"1px solid #f0e8de" }}>
            {QUICK_PROMPTS.slice(0,4).map(q => (
              <button key={q.label} onClick={()=>sendMessage(q.msg)} disabled={isTyping}
                style={{ background:"#fdf6ee",border:"1px solid #e5d5c5",borderRadius:8,padding:"3px 8px",cursor:isTyping?"not-allowed":"pointer",fontSize:10,fontWeight:700,fontFamily:"'Nunito',sans-serif",opacity:isTyping?0.5:1 }}>
                {q.label}
              </button>
            ))}
          </div>
          <div style={{ padding:"6px 10px 10px",borderTop:"1px solid #f0e8de",display:"flex",gap:6,alignItems:"center" }}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!isTyping&&sendMessage()}
              placeholder={isTyping?"Paws is thinking...":"Ask anything about pets..."}
              disabled={isTyping}
              style={{ flex:1,border:"2px solid #e5d5c5",borderRadius:10,padding:"8px 12px",fontSize:13,fontFamily:"'Nunito',sans-serif",outline:"none",background:isTyping?"#fafafa":"#fff",color:"#2d1a0e" }}
              onFocus={e=>e.target.style.borderColor="#f97316"}
              onBlur={e=>e.target.style.borderColor="#e5d5c5"} />
            <button onClick={()=>sendMessage()} disabled={isTyping||!input.trim()}
              style={{ background:isTyping||!input.trim()?"#e5d5c5":"#f97316",color:"#fff",border:"none",borderRadius:10,width:38,height:38,cursor:isTyping||!input.trim()?"not-allowed":"pointer",fontWeight:900,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              ↑
            </button>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        @keyframes slideIn { from { transform: translateX(-50%) translateY(-10px); opacity:0; } to { transform: translateX(-50%) translateY(0); opacity:1; } }
        @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-thumb { background: #e5d5c5; border-radius: 4px; }
        input, button, select { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}

function ProductCard({ p, addToCart, setSelProd, highlight, compact }) {
  return (
    <div style={{ background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:highlight?"0 0 0 3px #f97316, 0 4px 16px rgba(249,115,22,0.15)":"0 2px 10px rgba(0,0,0,0.07)",border:`2px solid ${highlight?"#f97316":"transparent"}`,transition:"all .25s",position:"relative" }}>
      {highlight && <div style={{ position:"absolute",top:6,left:6,background:"#f97316",color:"#fff",borderRadius:5,padding:"1px 7px",fontSize:9,fontWeight:900,zIndex:1 }}>🤖 PICK</div>}
      <div style={{ background:"linear-gradient(135deg,#fdf6ee,#fff3e8)",height:compact?90:110,display:"flex",alignItems:"center",justifyContent:"center",fontSize:compact?44:52,cursor:"pointer" }}
        onClick={()=>setSelProd(p)}>
        {p.emoji}
      </div>
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5 }}>
          <span style={{ background:tagColors[p.tag]||"#888",color:"#fff",borderRadius:4,padding:"1px 7px",fontSize:9,fontWeight:900 }}>{p.tag}</span>
          <span style={{ color:"#7c5c3e",fontSize:10,fontWeight:600 }}>⭐ {p.rating}</span>
        </div>
        <div style={{ fontWeight:800,fontSize:12,marginBottom:3,lineHeight:1.4,color:"#2d1a0e" }}>{p.name}</div>
        {!compact && <div style={{ color:"#7c5c3e",fontSize:10,marginBottom:8,lineHeight:1.4 }}>{p.desc ? p.desc.slice(0,48)+"..." : ""}</div>}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:compact?6:0 }}>
          <span style={{ color:"#f97316",fontWeight:900,fontSize:14 }}>₱{p.price.toLocaleString()}</span>
          <button onClick={()=>addToCart(p)}
            style={{ background:"#2d1a0e",color:"#fff",border:"none",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontWeight:700,fontSize:10,fontFamily:"'Nunito',sans-serif" }}
            onMouseEnter={e=>e.currentTarget.style.background="#f97316"}
            onMouseLeave={e=>e.currentTarget.style.background="#2d1a0e"}>
            + Cart
          </button>
        </div>
        <div style={{ color:p.stock<10?"#dc2626":"#22c55e",fontSize:9,fontWeight:700,marginTop:4 }}>
          {p.stock<10 ? `⚠️ Only ${p.stock} left!` : `✅ ${p.stock} in stock`}
        </div>
      </div>
    </div>
  );
}