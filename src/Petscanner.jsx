import { useState, useRef, useContext, useEffect, useCallback } from "react";
import { StoreContext } from "./index";

const tagColors = { Bestseller:"#f97316", New:"#8b5cf6", Hot:"#ef4444", Premium:"#eab308", Value:"#22c55e", Popular:"#3b82f6", Training:"#06b6d4", Kit:"#ec4899", Health:"#10b981", Organic:"#84cc16" };

const SCANNER_PROMPT = `You are PawScan — an expert AI pet breed identifier for PawMart Philippines.
Analyze the image and return ONLY a valid JSON object with no markdown or extra text:
{
  "detected": true,
  "petType": "dog",
  "breed": "Shih Tzu",
  "confidence": "High",
  "alternativeBreeds": ["Maltese", "Lhasa Apso"],
  "overview": "Brief 2-sentence overview.",
  "traits": {
    "size": "Small", "energy": "Medium", "temperament": "Friendly, Playful",
    "goodWithKids": true, "apartmentFriendly": true, "hypoallergenic": true,
    "sheddingLevel": "Low", "trainability": "Medium"
  },
  "philippineContext": {
    "priceRange": "₱5,000 – ₱25,000",
    "heatTolerance": "Moderate — needs AC in PH summers",
    "popularity": "Very popular in Metro Manila",
    "adoptionNote": "Available at CARA Welfare Philippines"
  },
  "care": {
    "grooming": "Daily brushing, grooming every 6-8 weeks",
    "exercise": "30 min daily walk",
    "feeding": "1/2 to 1 cup dry food daily",
    "lifespan": "10–16 years",
    "commonHealthIssues": ["Eye problems", "Hip dysplasia"]
  },
  "funFact": "An interesting fact.",
  "recommendedProductTypes": ["dog food", "grooming"]
}
If no pet detected: { "detected": false, "message": "No pet detected. Please try again." }
RETURN ONLY JSON.`;

export default function PetScanner({ onLoginRequest }) {
  const store    = useContext(StoreContext);
  const PRODUCTS = store?.products ?? [];
  const user     = store?.user;

  const [mode,        setMode]      = useState("home");
  const [image,       setImage]     = useState(null);
  const [imageBase64, setBase64]    = useState(null);
  const [imageMime,   setMime]      = useState("image/jpeg");
  const [result,      setResult]    = useState(null);
  const [error,       setError]     = useState("");
  const [camError,    setCamError]  = useState("");
  const [facingMode,  setFacingMode]= useState("environment");
  const [dragOver,    setDragOver]  = useState(false);
  const [flash,       setFlash]     = useState(false);
  const [camReady,    setCamReady]  = useState(false);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef   = useRef(null);

  // ── Stop stream helper ────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCamReady(false);
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => stopStream(), [stopStream]);

  // ── Attach stream to video once camera mode is active ─────────────────────
  useEffect(() => {
    if (mode === "camera" && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      // Critical for Android Chrome
      video.setAttribute("playsinline", true);
      video.setAttribute("webkit-playsinline", true);
      video.muted = true;
      video.play().then(() => {
        setCamReady(true);
      }).catch(err => {
        console.error("Video play error:", err);
        setCamReady(true); // Still mark ready, some browsers don't need explicit play
      });
    }
  }, [mode]);

  // ── Start camera ──────────────────────────────────────────────────────────
  const startCamera = async (facing) => {
    const useFacing = facing || facingMode;
    setCamError(""); setCamReady(false);
    stopStream();

    try {
      // Try ideal constraints first, fall back to basic if needed
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: useFacing }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
      } catch {
        // Fallback — just get any video stream
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setFacingMode(useFacing);
      setMode("camera"); // This triggers the useEffect above to attach stream
    } catch (err) {
      console.error("Camera error:", err);
      const msg =
        err.name === "NotAllowedError"   ? "Camera permission denied. Please allow camera access in your browser settings." :
        err.name === "NotFoundError"     ? "No camera found. Please use the Upload option." :
        err.name === "NotReadableError"  ? "Camera is in use by another app. Please close it and try again." :
        err.name === "OverconstrainedError" ? "Camera not supported. Please use Upload." :
        `Camera unavailable: ${err.message}`;
      setCamError(msg);
    }
  };

  // ── Flip camera ───────────────────────────────────────────────────────────
  const flipCamera = () => {
    const newFacing = facingMode === "environment" ? "user" : "environment";
    startCamera(newFacing);
  };

  // ── Take photo ────────────────────────────────────────────────────────────
  const takePhoto = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth  || video.clientWidth  || 1280;
    const h = video.videoHeight || video.clientHeight || 720;
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    if (facingMode === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);

    setFlash(true);
    setTimeout(() => setFlash(false), 180);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setImage(dataUrl);
    setBase64(dataUrl.split(",")[1]);
    setMime("image/jpeg");
    stopStream();
    setMode("preview");
  };

  // ── Handle file upload ────────────────────────────────────────────────────
  const handleFile = (file) => {
    if (!file?.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    if (file.size > 10 * 1024 * 1024)    { setError("Image must be under 10MB.");     return; }
    setError(""); setResult(null);
    setMime(file.type);
    setImage(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = e => setBase64(e.target.result.split(",")[1]);
    reader.readAsDataURL(file);
    setMode("preview");
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

  // ── Analyze ───────────────────────────────────────────────────────────────
  const analyze = async () => {
    if (!imageBase64) return;
    setMode("loading"); setError(""); setResult(null);
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer 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" },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          max_tokens: 1024,
          messages: [{ role: "user", content: [
            { type: "image_url", image_url: { url: `data:${imageMime};base64,${imageBase64}` } },
            { type: "text", text: SCANNER_PROMPT }
          ]}]
        })
      });
      const data = await res.json();
      if (data.error) { setError(`Error: ${data.error.message}`); setMode("preview"); return; }
      const text   = data.choices?.[0]?.message?.content || "";
      const clean  = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setMode("result");
    } catch (e) {
      setError("Could not analyze. Please try a clearer photo.");
      console.error(e);
      setMode("preview");
    }
  };

  const reset = () => { stopStream(); setImage(null); setBase64(null); setResult(null); setError(""); setCamError(""); setMode("home"); };

  const suggestedProducts = result?.detected
    ? PRODUCTS.filter(p => p.pet?.includes(result.petType) || result.recommendedProductTypes?.some(t => p.type?.includes(t) || p.category?.includes(result.petType))).slice(0, 4)
    : [];

  const confidenceColor = { High:"#22c55e", Medium:"#f59e0b", Low:"#ef4444" };

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!user) return (
    <div style={{ maxWidth:480, margin:"60px auto", textAlign:"center", padding:"0 20px", fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ fontSize:64, marginBottom:16 }}>📷</div>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, marginBottom:10, color:"#2d1a0e" }}>Pet Breed Scanner</h2>
      <p style={{ color:"#7c5c3e", fontSize:14, marginBottom:24, lineHeight:1.7 }}>Sign in to use our AI-powered breed scanner — point your camera at any pet for an instant analysis!</p>
      <button onClick={onLoginRequest} style={{ background:"#f97316", color:"#fff", border:"none", borderRadius:12, padding:"12px 28px", cursor:"pointer", fontWeight:900, fontSize:15, fontFamily:"'Nunito',sans-serif" }}>
        Sign In to Use Scanner 🐾
      </button>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif" }}>

      {/* ── FULLSCREEN CAMERA ──────────────────────────────────────────────── */}
      {mode === "camera" && (
        <div style={{ position:"fixed", inset:0, background:"#000", zIndex:9999, display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* Flash */}
          {flash && <div style={{ position:"absolute", inset:0, background:"#fff", zIndex:10, pointerEvents:"none" }}/>}

          {/* Video — fills entire screen */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", transform: facingMode==="user" ? "scaleX(-1)" : "none" }}
          />

          {/* Not ready overlay */}
          {!camReady && (
            <div style={{ position:"absolute", inset:0, background:"#000", display:"flex", alignItems:"center", justifyContent:"center", zIndex:5 }}>
              <div style={{ textAlign:"center", color:"#fff" }}>
                <div style={{ fontSize:40, marginBottom:12, animation:"pawspin 1s linear infinite", display:"inline-block" }}>📷</div>
                <div style={{ fontSize:14, fontWeight:700 }}>Starting camera…</div>
              </div>
            </div>
          )}

          {/* Top bar */}
          <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:20, padding:"env(safe-area-inset-top, 16px) 16px 16px", background:"linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <button onClick={() => { stopStream(); setMode("home"); }}
              style={{ background:"rgba(0,0,0,0.5)", color:"#fff", border:"1px solid rgba(255,255,255,0.3)", borderRadius:10, padding:"8px 16px", cursor:"pointer", fontWeight:700, fontSize:14, fontFamily:"'Nunito',sans-serif" }}>
              ✕ Close
            </button>
            <div style={{ color:"#fff", fontWeight:800, fontSize:14 }}>🐾 PawScan</div>
            <button onClick={flipCamera}
              style={{ background:"rgba(0,0,0,0.5)", color:"#fff", border:"1px solid rgba(255,255,255,0.3)", borderRadius:10, padding:"8px 16px", cursor:"pointer", fontWeight:700, fontSize:14, fontFamily:"'Nunito',sans-serif" }}>
              🔄 Flip
            </button>
          </div>

          {/* Viewfinder */}
          <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-58%)", width:"min(72vw, 300px)", height:"min(72vw, 300px)", zIndex:15, pointerEvents:"none" }}>
            {/* Dimmed outside */}
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:-1 }}/>
            {/* Frame */}
            <div style={{ position:"absolute", inset:0, border:"2px solid rgba(249,115,22,0.8)", borderRadius:16 }}/>
            {/* Corner L-shapes */}
            {[[0,0,"top","left"],[0,"auto","top","right"],["auto",0,"bottom","left"],["auto","auto","bottom","right"]].map(([t,r,v,h], i) => (
              <div key={i} style={{ position:"absolute", top:t, right:r, bottom:t==="auto"?"0":undefined, left:r==="auto"?"0":undefined, width:28, height:28,
                borderTop: v==="top" ? "3px solid #f97316" : "none",
                borderBottom: v==="bottom" ? "3px solid #f97316" : "none",
                borderLeft: h==="left" ? "3px solid #f97316" : "none",
                borderRight: h==="right" ? "3px solid #f97316" : "none",
                borderRadius: i===0?"8px 0 0 0": i===1?"0 8px 0 0": i===2?"0 0 0 8px":"0 0 8px 0"
              }}/>
            ))}
          </div>

          {/* Hint */}
          <div style={{ position:"absolute", top:"calc(50% + min(38vw, 160px) - 52%)", left:0, right:0, zIndex:20, textAlign:"center", marginTop:8 }}>
            <span style={{ background:"rgba(0,0,0,0.55)", color:"#fff", fontSize:12, fontWeight:600, borderRadius:20, padding:"4px 14px" }}>
              Center your pet in the frame
            </span>
          </div>

          {/* Bottom controls */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:20, paddingBottom:"env(safe-area-inset-bottom, 24px)", padding:"16px 20px 32px", background:"linear-gradient(to top, rgba(0,0,0,0.75), transparent)", display:"flex", justifyContent:"space-around", alignItems:"center" }}>
            {/* Gallery */}
            <button onClick={() => { stopStream(); setMode("home"); setTimeout(()=>fileRef.current?.click(), 100); }}
              style={{ width:54, height:54, borderRadius:14, background:"rgba(255,255,255,0.15)", border:"2px solid rgba(255,255,255,0.3)", color:"#fff", fontSize:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              📁
            </button>

            {/* Shutter */}
            <button onClick={takePhoto} disabled={!camReady}
              style={{ width:76, height:76, borderRadius:"50%", background: camReady ? "#fff" : "rgba(255,255,255,0.4)", border:"4px solid rgba(255,255,255,0.4)", cursor: camReady ? "pointer" : "not-allowed", display:"flex", alignItems:"center", justifyContent:"center", boxShadow: camReady ? "0 0 0 3px #f97316" : "none", transition:"all .2s" }}
              onTouchStart={e => { if(camReady) e.currentTarget.style.transform="scale(0.92)"; }}
              onTouchEnd={e => { e.currentTarget.style.transform="scale(1)"; }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background: camReady ? "#f97316" : "rgba(249,115,22,0.4)" }}/>
            </button>

            {/* Flip */}
            <button onClick={flipCamera}
              style={{ width:54, height:54, borderRadius:14, background:"rgba(255,255,255,0.15)", border:"2px solid rgba(255,255,255,0.3)", color:"#fff", fontSize:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              🔄
            </button>
          </div>

          <canvas ref={canvasRef} style={{ display:"none" }}/>
          <style>{`@keyframes pawspin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </div>
      )}

      {/* ── PAGE CONTENT (non-camera modes) ──────────────────────────────── */}
      <div style={{ maxWidth:680, margin:"0 auto", padding:"20px 16px 60px" }}>

        {/* Header */}
        {(mode === "home" || mode === "preview") && (
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <div style={{ fontSize:44, marginBottom:8 }}>📷</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#2d1a0e", margin:"0 0 6px" }}>PawScan — Breed Identifier</h2>
            <p style={{ color:"#7c5c3e", fontSize:13, margin:0 }}>Point your camera at any pet for an instant AI breed analysis</p>
            <div style={{ display:"inline-block", background:"rgba(249,115,22,0.1)", border:"1px solid rgba(249,115,22,0.3)", borderRadius:8, padding:"4px 12px", marginTop:8, fontSize:11, color:"#f97316", fontWeight:700 }}>
              Powered by Groq AI ⚡
            </div>
          </div>
        )}

        {/* ── HOME ── */}
        {mode === "home" && (
          <div>
            {camError && (
              <div style={{ background:"#fee2e2", color:"#dc2626", borderRadius:10, padding:"12px 16px", fontSize:13, fontWeight:700, marginBottom:16, lineHeight:1.6 }}>
                ⚠️ {camError}
              </div>
            )}

            {/* Big camera button */}
            <button onClick={() => startCamera()}
              style={{ width:"100%", background:"linear-gradient(135deg,#2d1a0e,#7c3f1a)", color:"#fff", border:"none", borderRadius:20, padding:"36px 20px", cursor:"pointer", marginBottom:12, display:"flex", flexDirection:"column", alignItems:"center", gap:12, WebkitTapHighlightColor:"transparent" }}>
              <span style={{ fontSize:56 }}>📷</span>
              <span style={{ fontWeight:900, fontSize:19, fontFamily:"'Nunito',sans-serif" }}>Open Camera</span>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)", fontFamily:"'Nunito',sans-serif" }}>Tap to open live camera — then tap the shutter</span>
            </button>

            {/* Upload */}
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current?.click()}
              style={{ border:`2px dashed ${dragOver?"#f97316":"#e5d5c5"}`, borderRadius:16, padding:"24px 20px", textAlign:"center", cursor:"pointer", background:dragOver?"#fff7ed":"#fff", transition:"all .2s" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📁</div>
              <div style={{ fontWeight:800, fontSize:14, color:"#2d1a0e", marginBottom:4 }}>Upload from Gallery</div>
              <div style={{ color:"#7c5c3e", fontSize:12 }}>JPG, PNG, WEBP · Max 10MB</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
          </div>
        )}

        {/* ── PREVIEW ── */}
        {mode === "preview" && image && (
          <div style={{ marginBottom:16 }}>
            <div style={{ position:"relative", borderRadius:16, overflow:"hidden", background:"#000", maxHeight:380 }}>
              <img src={image} alt="Pet" style={{ width:"100%", maxHeight:380, objectFit:"contain", display:"block" }} />
              <button onClick={reset} style={{ position:"absolute", top:10, right:10, background:"rgba(0,0,0,0.6)", color:"#fff", border:"none", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"'Nunito',sans-serif" }}>✕</button>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:12 }}>
              <button onClick={reset} style={{ flex:1, background:"#fdf6ee", color:"#2d1a0e", border:"2px solid #e5d5c5", borderRadius:12, padding:12, cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"'Nunito',sans-serif" }}>← Retake</button>
              <button onClick={analyze} style={{ flex:2, background:"linear-gradient(135deg,#f97316,#ea6c0a)", color:"#fff", border:"none", borderRadius:12, padding:12, cursor:"pointer", fontWeight:900, fontSize:15, fontFamily:"'Nunito',sans-serif" }}>🐾 Identify Breed →</button>
            </div>
            {error && <div style={{ background:"#fee2e2", color:"#dc2626", borderRadius:8, padding:"10px 14px", fontSize:13, fontWeight:700, marginTop:10 }}>❌ {error}</div>}
          </div>
        )}

        {/* ── LOADING ── */}
        {mode === "loading" && (
          <div style={{ textAlign:"center", padding:"40px 0" }}>
            {image && <img src={image} alt="Pet" style={{ width:"100%", maxHeight:200, objectFit:"cover", borderRadius:16, marginBottom:24, opacity:0.5 }} />}
            <div style={{ fontSize:52, animation:"pawspin 1.5s linear infinite", display:"inline-block" }}>🔍</div>
            <div style={{ marginTop:16, fontWeight:800, color:"#2d1a0e", fontSize:16 }}>Analyzing your pet…</div>
            <div style={{ marginTop:6, fontSize:13, color:"#7c5c3e" }}>Identifying breed, traits & Philippine care tips</div>
            <style>{`@keyframes pawspin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
          </div>
        )}

        {/* ── RESULT ── */}
        {mode === "result" && result && (
          <div>
            <div style={{ background:"#fff", borderRadius:20, overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,0.08)", marginBottom:14 }}>
              {image && <img src={image} alt="Pet" style={{ width:"100%", maxHeight:260, objectFit:"cover", display:"block" }} />}

              {!result.detected ? (
                <div style={{ padding:24, textAlign:"center" }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>🤔</div>
                  <div style={{ fontWeight:800, fontSize:16, color:"#2d1a0e", marginBottom:8 }}>No pet detected</div>
                  <div style={{ color:"#7c5c3e", fontSize:13 }}>{result.message}</div>
                  <button onClick={reset} style={{ marginTop:16, background:"#f97316", color:"#fff", border:"none", borderRadius:10, padding:"10px 22px", cursor:"pointer", fontWeight:800, fontFamily:"'Nunito',sans-serif" }}>Try Again</button>
                </div>
              ) : (
                <div style={{ padding:"20px 20px 24px" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:11, color:"#7c5c3e", fontWeight:700, textTransform:"uppercase", letterSpacing:.8, marginBottom:4 }}>{result.petType?.toUpperCase()} BREED DETECTED</div>
                      <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#2d1a0e", margin:0 }}>{result.breed}</h3>
                    </div>
                    <div style={{ background:`${confidenceColor[result.confidence]}22`, color:confidenceColor[result.confidence], borderRadius:10, padding:"6px 12px", fontSize:12, fontWeight:800, whiteSpace:"nowrap", flexShrink:0 }}>
                      {result.confidence} Confidence
                    </div>
                  </div>
                  {result.alternativeBreeds?.length > 0 && (
                    <div style={{ marginBottom:12 }}>
                      <span style={{ fontSize:11, color:"#7c5c3e", fontWeight:700 }}>Could also be: </span>
                      {result.alternativeBreeds.map(b => <span key={b} style={{ background:"#fdf6ee", border:"1px solid #e5d5c5", borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700, marginRight:5, color:"#7c5c3e" }}>{b}</span>)}
                    </div>
                  )}
                  <p style={{ color:"#4a2c0e", fontSize:13, lineHeight:1.7, margin:0 }}>{result.overview}</p>
                </div>
              )}
            </div>

            {result.detected && (
              <>
                {/* Traits */}
                <div style={{ background:"#fff", borderRadius:16, padding:"18px 16px", marginBottom:12, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontWeight:900, fontSize:14, color:"#2d1a0e", marginBottom:14 }}>🧬 Breed Traits</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {[["📏 Size",result.traits?.size],["⚡ Energy",result.traits?.energy],["✂️ Shedding",result.traits?.sheddingLevel],["🎓 Trainability",result.traits?.trainability],["👶 Good with Kids",result.traits?.goodWithKids?"Yes ✅":"No ❌"],["🏠 Apartment OK",result.traits?.apartmentFriendly?"Yes ✅":"No ❌"],["🤧 Hypoallergenic",result.traits?.hypoallergenic?"Yes ✅":"No ❌"],["😊 Temperament",result.traits?.temperament]].map(([l,v])=>(
                      <div key={l} style={{ background:"#fdf6ee", borderRadius:10, padding:"10px 12px" }}>
                        <div style={{ fontSize:10, color:"#f97316", fontWeight:700, marginBottom:3 }}>{l}</div>
                        <div style={{ fontSize:12, fontWeight:700, color:"#2d1a0e" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PH Context */}
                <div style={{ background:"linear-gradient(135deg,#2d1a0e,#7c3f1a)", borderRadius:16, padding:"18px 16px", marginBottom:12 }}>
                  <div style={{ fontWeight:900, fontSize:14, color:"#f97316", marginBottom:14 }}>🇵🇭 Philippine Context</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {[["💰 Price Range",result.philippineContext?.priceRange],["☀️ Heat Tolerance",result.philippineContext?.heatTolerance],["📍 Popularity",result.philippineContext?.popularity],["🏠 Adoption",result.philippineContext?.adoptionNote]].map(([l,v])=>(
                      <div key={l} style={{ background:"rgba(255,255,255,0.08)", borderRadius:10, padding:"10px 12px" }}>
                        <div style={{ fontSize:10, color:"#f97316", fontWeight:700, marginBottom:3 }}>{l}</div>
                        <div style={{ fontSize:11, fontWeight:600, color:"#f0e8de", lineHeight:1.4 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Care */}
                <div style={{ background:"#fff", borderRadius:16, padding:"18px 16px", marginBottom:12, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontWeight:900, fontSize:14, color:"#2d1a0e", marginBottom:14 }}>🏥 Care Guide</div>
                  {[["✂️ Grooming",result.care?.grooming],["🚶 Exercise",result.care?.exercise],["🍖 Feeding",result.care?.feeding],["⏳ Lifespan",result.care?.lifespan]].map(([l,v])=>(
                    <div key={l} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-start" }}>
                      <span style={{ fontSize:13, flexShrink:0 }}>{l.split(" ")[0]}</span>
                      <div>
                        <div style={{ fontSize:10, color:"#f97316", fontWeight:700, marginBottom:2 }}>{l.split(" ").slice(1).join(" ")}</div>
                        <div style={{ fontSize:12, color:"#4a2c0e", lineHeight:1.6 }}>{v}</div>
                      </div>
                    </div>
                  ))}
                  {result.care?.commonHealthIssues?.length > 0 && (
                    <div style={{ background:"#fef3cd", borderRadius:10, padding:"10px 12px", marginTop:4 }}>
                      <div style={{ fontSize:10, color:"#92400e", fontWeight:700, marginBottom:4 }}>⚠️ WATCH OUT FOR</div>
                      <div style={{ fontSize:11, color:"#92400e" }}>{result.care.commonHealthIssues.join(" · ")}</div>
                    </div>
                  )}
                </div>

                {/* Fun Fact */}
                {result.funFact && (
                  <div style={{ background:"linear-gradient(135deg,#f97316,#ea6c0a)", borderRadius:16, padding:16, marginBottom:14 }}>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.7)", fontWeight:700, marginBottom:4 }}>🌟 FUN FACT</div>
                    <div style={{ fontSize:13, color:"#fff", fontWeight:600, lineHeight:1.6 }}>{result.funFact}</div>
                  </div>
                )}

                {/* Products */}
                {suggestedProducts.length > 0 && (
                  <div style={{ background:"#fff", borderRadius:16, padding:"18px 16px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)", marginBottom:14 }}>
                    <div style={{ fontWeight:900, fontSize:14, color:"#2d1a0e", marginBottom:14 }}>🛍️ Recommended for your {result.breed}</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      {suggestedProducts.map(p => (
                        <div key={p.id} style={{ background:"#fdf6ee", borderRadius:12, padding:"12px 10px", display:"flex", flexDirection:"column", gap:6 }}>
                          <div style={{ fontSize:28, textAlign:"center" }}>{p.emoji}</div>
                          <div style={{ fontWeight:800, fontSize:11, color:"#2d1a0e", lineHeight:1.3 }}>{p.name}</div>
                          <div style={{ color:"#f97316", fontWeight:900, fontSize:13 }}>₱{p.price?.toLocaleString()}</div>
                          <span style={{ background:`${tagColors[p.tag]||"#888"}22`, color:tagColors[p.tag]||"#888", borderRadius:5, padding:"1px 7px", fontSize:9, fontWeight:900, alignSelf:"flex-start" }}>{p.tag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={reset} style={{ width:"100%", background:"#2d1a0e", color:"#fff", border:"none", borderRadius:12, padding:14, cursor:"pointer", fontWeight:900, fontSize:15, fontFamily:"'Nunito',sans-serif" }}>
                  📷 Scan Another Pet
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}