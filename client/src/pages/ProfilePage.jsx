import React, { useState, useEffect } from "react";
import {
  ArrowLeft, User, Mail, Phone, ShieldCheck, Film, Users,
  Copy, Check, Trash2, ArrowRight, Video, Calendar, Heart,
  Edit3, Save, X, Sparkles, Clock, Award, Star,
  RefreshCw, LogOut
} from "lucide-react";
import HeaderProfileMenu from "../components/HeaderProfileMenu";
import { SERVER_URL } from "../utils/apiUrl";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=200&q=80",
];

const GENRE_OPTIONS = ["Action", "Sci-Fi", "Romance", "Horror", "Comedy", "Thriller", "Anime", "Drama", "Documentary", "Fantasy"];

const inp = { width: "100%", padding: "10px 14px", background: "#09090b", border: "1px solid #27272a", borderRadius: "10px", color: "#f4f4f5", fontSize: "13px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" };
const lbl = { fontSize: "11px", fontWeight: "600", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px", display: "block" };

export default function ProfilePage({ userAccount, onBack, onRejoinRoom, onPlayShow, onLogout }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [roomHistory, setRoomHistory] = useState([]);
  const [showHistory, setShowHistory] = useState([]);
  const [copiedCode, setCopiedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const user = userAccount || (() => {
    try { return JSON.parse(localStorage.getItem("cypr_user_account")); } catch { return null; }
  })();

  const [editName, setEditName] = useState(user?.name || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [editDob, setEditDob] = useState(user?.dob || "");
  const [editGender, setEditGender] = useState(user?.gender || "Male");
  const [editGenre, setEditGenre] = useState(user?.favoriteGenre || "Sci-Fi");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [editAvatar, setEditAvatar] = useState(user?.avatar || AVATAR_PRESETS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [preferredQuality, setPreferredQuality] = useState(user?.preferredQuality || "1080p");
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || "en");
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(user?.subtitlesEnabled !== undefined ? !!user.subtitlesEnabled : true);
  const [autoPlayNext, setAutoPlayNext] = useState(user?.autoPlayNext !== undefined ? !!user.autoPlayNext : true);
  const [theme, setTheme] = useState(user?.theme || "dark");

  useEffect(() => {
    if ((activeTab === "rooms" || activeTab === "shows") && user?.email) fetchHistory();
  }, [activeTab]);

  const fetchHistory = async () => {
    if (!user?.email) return;
    setHistoryLoading(true);
    try {
      const [rr, sr] = await Promise.all([
        fetch(SERVER_URL + "/api/auth/history/room?email=" + encodeURIComponent(user.email)),
        fetch(SERVER_URL + "/api/auth/history/watch?email=" + encodeURIComponent(user.email))
      ]);
      const rd = await rr.json(); const sd = await sr.json();
      if (rd.success) setRoomHistory(rd.history || []);
      if (sd.success) setShowHistory(sd.history || []);
    } catch {
      try {
        const r = localStorage.getItem("cypr_room_history");
        const s = localStorage.getItem("cypr_show_history");
        if (r) setRoomHistory(JSON.parse(r));
        if (s) setShowHistory(JSON.parse(s));
      } catch {}
    }
    setHistoryLoading(false);
  };

  const handleSave = async () => {
    if (!user?.email) return;
    setLoading(true); setSaveMsg("");
    try {
      const res = await fetch(SERVER_URL + "/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: editName.trim(),
          phone: editPhone.trim(),
          dob: editDob,
          gender: editGender,
          favoriteGenre: editGenre,
          bio: editBio.trim(),
          avatar: customAvatarUrl.trim() || editAvatar,
          preferredQuality,
          preferredLanguage,
          subtitlesEnabled,
          autoPlayNext,
          theme
        })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        localStorage.setItem("cypr_user_account", JSON.stringify({ ...user, ...data.user }));
        setIsEditing(false); setSaveMsg("Profile & Personalization saved!");
      } else { setSaveMsg(data.error || "Update failed."); }
    } catch {
      setLoading(false);
      localStorage.setItem("cypr_user_account", JSON.stringify({
        ...user,
        name: editName,
        phone: editPhone,
        dob: editDob,
        gender: editGender,
        favoriteGenre: editGenre,
        bio: editBio,
        avatar: customAvatarUrl.trim() || editAvatar,
        preferredQuality,
        preferredLanguage,
        subtitlesEnabled,
        autoPlayNext,
        theme
      }));
      setIsEditing(false); setSaveMsg("Saved locally (offline)");
    }
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const handleCancel = () => {
    setEditName(user?.name || ""); setEditPhone(user?.phone || ""); setEditDob(user?.dob || "");
    setEditGender(user?.gender || "Male"); setEditGenre(user?.favoriteGenre || "Sci-Fi");
    setEditBio(user?.bio || ""); setEditAvatar(user?.avatar || AVATAR_PRESETS[0]);
    setPreferredQuality(user?.preferredQuality || "1080p");
    setPreferredLanguage(user?.preferredLanguage || "en");
    setSubtitlesEnabled(user?.subtitlesEnabled !== undefined ? !!user.subtitlesEnabled : true);
    setAutoPlayNext(user?.autoPlayNext !== undefined ? !!user.autoPlayNext : true);
    setTheme(user?.theme || "dark");
    setCustomAvatarUrl(""); setIsEditing(false);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(window.location.origin + "/?room=" + encodeURIComponent(code));
    setCopiedCode(code); setTimeout(() => setCopiedCode(""), 2000);
  };

  const clearHistory = () => {
    if (!confirm("Clear all watch & room history?")) return;
    localStorage.removeItem("cypr_room_history"); localStorage.removeItem("cypr_show_history");
    setRoomHistory([]); setShowHistory([]);
  };

  const fmtDate = (ts) => {
    if (!ts) return "Just now";
    return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  const displayAvatar = customAvatarUrl.trim() || editAvatar || user?.avatar || AVATAR_PRESETS[0];
  const tabs = [
    { id: "profile", label: "My Profile", icon: <User size={14} /> },
    { id: "rooms", label: "Rooms (" + roomHistory.length + ")", icon: <Users size={14} /> },
    { id: "shows", label: "Watched (" + showHistory.length + ")", icon: <Film size={14} /> },
    { id: "security", label: "Security", icon: <ShieldCheck size={14} /> },
  ];

  const Btn = ({ onClick, disabled, children, bg, color, ...rest }) => (
    <button onClick={onClick} disabled={disabled} style={{ background: bg || "#141417", border: "none", color: color || "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", borderRadius: "8px", padding: "7px 14px", opacity: disabled ? 0.7 : 1, ...rest }} {...rest}>{children}</button>
  );

  return (
    <div style={{ minHeight: "100vh", width: "100vw", background: "#09090b", color: "#f4f4f5", display: "flex", flexDirection: "column", fontFamily: "Inter, Plus Jakarta Sans, sans-serif" }}>
      <header style={{ height: "64px", background: "#09090b", borderBottom: "1px solid #27272a", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button onClick={onBack} style={{ background: "#141417", border: "1px solid #27272a", color: "#fff", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }} onMouseEnter={e => e.currentTarget.style.background = "#27272a"} onMouseLeave={e => e.currentTarget.style.background = "#141417"}>
            <ArrowLeft size={14} /><span>Back to Lounge</span>
          </button>
          <img src="/viam_logo.png" alt="CYPR ViAM" style={{ height: "48px", objectFit: "contain" }} />
        </div>
        {saveMsg && <div style={{ fontSize: "12px", fontWeight: "600", padding: "6px 14px", borderRadius: "8px", background: saveMsg.includes("saved") || saveMsg.includes("Profile") ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: saveMsg.includes("saved") || saveMsg.includes("Profile") ? "#22c55e" : "#ef4444", border: "1px solid rgba(34,197,94,0.3)" }}>{saveMsg}</div>}
        <HeaderProfileMenu userAccount={user} onOpenProfile={() => setActiveTab("profile")} onOpenHistory={() => setActiveTab("shows")} onLogout={onLogout} />
      </header>

      <main style={{ flex: 1, maxWidth: "1280px", width: "100%", margin: "0 auto", padding: "32px 32px 60px", display: "grid", gridTemplateColumns: "280px 1fr", gap: "28px" }}>
        <aside style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "#141417", border: "1px solid #27272a", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
            <img src={displayAvatar} alt={user?.name || "User"} onError={e => { e.target.src = AVATAR_PRESETS[0]; }} style={{ width: "88px", height: "88px", borderRadius: "50%", objectFit: "cover", border: "3px solid #ff5500", display: "block", margin: "0 auto 14px" }} />
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#ffffff" }}>{user?.name || "CYPR Member"}</h2>
            {user?.bio && <p style={{ fontSize: "12px", color: "#71717a", margin: "6px 0 0", lineHeight: 1.4 }}>{user.bio}</p>}
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "10px", fontSize: "11px", fontWeight: "600", background: "rgba(255,85,0,0.12)", color: "#ff5500", borderRadius: "6px", padding: "3px 10px", border: "1px solid rgba(255,85,0,0.25)" }}>
              <Sparkles size={10} /> Pro Member
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px", textAlign: "left", background: "#09090b", padding: "12px", borderRadius: "10px", border: "1px solid #27272a" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#a1a1aa" }}><Mail size={13} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</span></div>
              {user?.phone && <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#a1a1aa" }}><Phone size={13} /><span>{user.phone}</span></div>}
              {user?.dob && <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#a1a1aa" }}><Calendar size={13} /><span>{fmtDate(user.dob)}</span></div>}
              {user?.favoriteGenre && <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#a1a1aa" }}><Heart size={13} color="#ff5500" /><span>Loves {user.favoriteGenre}</span></div>}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#a1a1aa" }}><ShieldCheck size={13} color="#22c55e" /><span>AES-256 Verified</span></div>
            </div>
          </div>

          <div style={{ background: "#141417", border: "1px solid #27272a", borderRadius: "14px", padding: "6px", display: "flex", flexDirection: "column", gap: "3px" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", background: activeTab === t.id ? "#27272a" : "transparent", border: "none", color: activeTab === t.id ? "#ffffff" : "#a1a1aa", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.15s" }}>
                {t.icon}<span>{t.label}</span>
              </button>
            ))}
          </div>

          <button onClick={onLogout} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}>
            <LogOut size={14} /><span>Log Out</span>
          </button>
        </aside>

        <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {[
              { label: "Rooms Joined", value: roomHistory.length || "—", icon: <Users size={16} color="#ff5500" /> },
              { label: "Shows Watched", value: showHistory.length || "—", icon: <Film size={16} color="#a855f7" /> },
              { label: "Fav Genre", value: user?.favoriteGenre || "Sci-Fi", icon: <Heart size={16} color="#ec4899" /> },
              { label: "Encryption", value: "AES-256", icon: <ShieldCheck size={16} color="#22c55e" /> },
            ].map((s, i) => (
              <div key={i} style={{ background: "#141417", border: "1px solid #27272a", borderRadius: "14px", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>{s.icon}<span style={{ fontSize: "11px", fontWeight: "600", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</span></div>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#ffffff" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {activeTab === "profile" && (
            <div style={{ background: "#141417", border: "1px solid #27272a", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #27272a", paddingBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#fff" }}>Profile Information</h3>
                {!isEditing
                  ? <button onClick={() => setIsEditing(true)} style={{ background: "#ff5500", border: "none", color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", borderRadius: "8px", padding: "7px 14px" }}><Edit3 size={13} /> Edit Profile</button>
                  : <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={handleCancel} style={{ background: "#27272a", border: "none", color: "#a1a1aa", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", borderRadius: "8px", padding: "7px 14px" }}><X size={13} /> Cancel</button>
                      <button onClick={handleSave} disabled={loading} style={{ background: "#22c55e", border: "none", color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", borderRadius: "8px", padding: "7px 14px", opacity: loading ? 0.7 : 1 }}><Save size={13} /> {loading ? "Saving..." : "Save Changes"}</button>
                    </div>
                }
              </div>

              {isEditing && (
                <div>
                  <label style={lbl}>Choose Avatar</label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                    {AVATAR_PRESETS.map((av, i) => (
                      <img key={i} src={av} alt="" onClick={() => { setEditAvatar(av); setCustomAvatarUrl(""); }} style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", cursor: "pointer", border: editAvatar === av && !customAvatarUrl ? "2px solid #ff5500" : "2px solid #27272a" }} />
                    ))}
                  </div>
                  <input type="url" placeholder="Or paste a custom avatar URL..." value={customAvatarUrl} onChange={e => setCustomAvatarUrl(e.target.value)} style={inp} onFocus={e => e.target.style.borderColor = "#ff5500"} onBlur={e => e.target.style.borderColor = "#27272a"} />
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {[
                  { label: "Full Name", val: user?.name, el: <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your full name" style={inp} onFocus={e => e.target.style.borderColor = "#ff5500"} onBlur={e => e.target.style.borderColor = "#27272a"} /> },
                  { label: "Gender", val: user?.gender, el: <select value={editGender} onChange={e => setEditGender(e.target.value)} style={{ ...inp, cursor: "pointer" }} onFocus={e => e.target.style.borderColor = "#ff5500"} onBlur={e => e.target.style.borderColor = "#27272a"}>{["Male", "Female", "Non-binary", "Rather not say"].map(g => <option key={g} value={g} style={{ background: "#09090b" }}>{g}</option>)}</select> },
                  { label: "Phone Number", val: user?.phone, el: <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+91 9876543210" style={inp} onFocus={e => e.target.style.borderColor = "#ff5500"} onBlur={e => e.target.style.borderColor = "#27272a"} /> },
                  { label: "Date of Birth", val: user?.dob ? fmtDate(user.dob) : "—", el: <input type="date" value={editDob} onChange={e => setEditDob(e.target.value)} style={{ ...inp, colorScheme: "dark" }} onFocus={e => e.target.style.borderColor = "#ff5500"} onBlur={e => e.target.style.borderColor = "#27272a"} /> },
                  { label: "Favourite Genre", val: user?.favoriteGenre, el: <select value={editGenre} onChange={e => setEditGenre(e.target.value)} style={{ ...inp, cursor: "pointer" }} onFocus={e => e.target.style.borderColor = "#ff5500"} onBlur={e => e.target.style.borderColor = "#27272a"}>{GENRE_OPTIONS.map(g => <option key={g} value={g} style={{ background: "#09090b" }}>{g}</option>)}</select> },
                  { label: "Stream Quality", val: user?.preferredQuality || "1080p Ultra HD", el: <select value={preferredQuality} onChange={e => setPreferredQuality(e.target.value)} style={{ ...inp, cursor: "pointer" }} onFocus={e => e.target.style.borderColor = "#ff5500"} onBlur={e => e.target.style.borderColor = "#27272a"}>{["1080p", "720p", "4K", "Auto"].map(q => <option key={q} value={q} style={{ background: "#09090b" }}>{q}</option>)}</select> },
                  { label: "Preferred Language", val: user?.preferredLanguage === "hi" ? "Hindi" : user?.preferredLanguage === "es" ? "Spanish" : user?.preferredLanguage === "ja" ? "Japanese" : "English", el: <select value={preferredLanguage} onChange={e => setPreferredLanguage(e.target.value)} style={{ ...inp, cursor: "pointer" }} onFocus={e => e.target.style.borderColor = "#ff5500"} onBlur={e => e.target.style.borderColor = "#27272a"}>{[{ id: "en", name: "English" }, { id: "hi", name: "Hindi" }, { id: "es", name: "Spanish" }, { id: "ja", name: "Japanese" }].map(l => <option key={l.id} value={l.id} style={{ background: "#09090b" }}>{l.name}</option>)}</select> },
                  { label: "Subtitles Default", val: (user?.subtitlesEnabled !== undefined ? user.subtitlesEnabled : true) ? "Enabled (Auto)" : "Disabled", el: <select value={subtitlesEnabled ? "1" : "0"} onChange={e => setSubtitlesEnabled(e.target.value === "1")} style={{ ...inp, cursor: "pointer" }} onFocus={e => e.target.style.borderColor = "#ff5500"} onBlur={e => e.target.style.borderColor = "#27272a"}><option value="1" style={{ background: "#09090b" }}>Enabled (Auto)</option><option value="0" style={{ background: "#09090b" }}>Disabled</option></select> },
                  { label: "Autoplay Next Episode", val: (user?.autoPlayNext !== undefined ? user.autoPlayNext : true) ? "Enabled" : "Disabled", el: <select value={autoPlayNext ? "1" : "0"} onChange={e => setAutoPlayNext(e.target.value === "1")} style={{ ...inp, cursor: "pointer" }} onFocus={e => e.target.style.borderColor = "#ff5500"} onBlur={e => e.target.style.borderColor = "#27272a"}><option value="1" style={{ background: "#09090b" }}>Enabled</option><option value="0" style={{ background: "#09090b" }}>Disabled</option></select> },
                ].map(({ label, val, el }) => (
                  <div key={label}>
                    <label style={lbl}>{label}</label>
                    {isEditing ? el : <div style={{ ...inp, color: "#fff", cursor: "default" }}>{val || "—"}</div>}
                  </div>
                ))}
                <div>
                  <label style={lbl}>Email (Verified)</label>
                  <div style={{ ...inp, color: "#71717a", cursor: "not-allowed", display: "flex", alignItems: "center", gap: "6px" }}><ShieldCheck size={13} color="#22c55e" />{user?.email || "—"}</div>
                </div>
              </div>

              <div>
                <label style={lbl}>Bio / About Me</label>
                {isEditing
                  ? <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell your co-watch partner about yourself..." rows={3} style={{ ...inp, resize: "vertical", minHeight: "80px", lineHeight: "1.5" }} onFocus={e => e.target.style.borderColor = "#ff5500"} onBlur={e => e.target.style.borderColor = "#27272a"} />
                  : <div style={{ ...inp, color: "#fff", cursor: "default", minHeight: "64px", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>{user?.bio || "No bio added yet."}</div>
                }
              </div>
              {user?.createdAt && <div style={{ fontSize: "12px", color: "#52525b", display: "flex", alignItems: "center", gap: "6px" }}><Clock size={12} /> Member since {fmtDate(user.createdAt)}</div>}
            </div>
          )}

          {activeTab === "rooms" && (
            <div style={{ background: "#141417", border: "1px solid #27272a", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #27272a", paddingBottom: "14px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#fff" }}>Room Co-Watching History</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={fetchHistory} style={{ background: "#27272a", border: "none", color: "#a1a1aa", cursor: "pointer", borderRadius: "7px", padding: "6px 10px", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: "600" }}><RefreshCw size={12} /> Refresh</button>
                  <button onClick={clearHistory} style={{ background: "transparent", border: "none", color: "#71717a", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }} onMouseEnter={e => e.currentTarget.style.color = "#ef4444"} onMouseLeave={e => e.currentTarget.style.color = "#71717a"}><Trash2 size={13} /> Clear</button>
                </div>
              </div>
              {historyLoading ? <div style={{ textAlign: "center", padding: "40px", color: "#71717a" }}>Loading...</div>
               : roomHistory.length > 0 ? roomHistory.map((room, idx) => (
                <div key={room.id || idx} style={{ padding: "14px 18px", borderRadius: "12px", background: "#09090b", border: "1px solid #27272a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#141417", border: "1px solid #27272a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Video size={16} color={room.isHost ? "#ff5500" : "#a1a1aa"} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "700", color: "#fff", fontFamily: "monospace" }}>{room.roomId}</span>
                        <span style={{ fontSize: "10px", fontWeight: "600", background: room.isHost ? "rgba(255,85,0,0.15)" : "#141417", color: room.isHost ? "#ff5500" : "#71717a", padding: "2px 8px", borderRadius: "6px", border: room.isHost ? "1px solid rgba(255,85,0,0.3)" : "1px solid #27272a" }}>{room.isHost ? "HOST" : "Guest"}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#71717a", marginTop: "2px" }}>Joined {fmtDate(room.joinedAt || room.createdAt)}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => copyCode(room.roomId)} style={{ background: "#141417", border: "1px solid #27272a", color: "#fff", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      {copiedCode === room.roomId ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                    </button>
                    <button onClick={() => onRejoinRoom?.(room.roomId)} style={{ background: "#ff5500", border: "none", color: "#fff", padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                      Rejoin <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
               )) : (
                <div style={{ textAlign: "center", padding: "48px", color: "#52525b" }}>
                  <Video size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#71717a" }}>No room history yet</div>
                  <div style={{ fontSize: "12px", marginTop: "4px" }}>Create or join a watch room to see your history here.</div>
                </div>
               )}
            </div>
          )}

          {activeTab === "shows" && (
            <div style={{ background: "#141417", border: "1px solid #27272a", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #27272a", paddingBottom: "14px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#fff" }}>Watched Shows History</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={fetchHistory} style={{ background: "#27272a", border: "none", color: "#a1a1aa", cursor: "pointer", borderRadius: "7px", padding: "6px 10px", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: "600" }}><RefreshCw size={12} /> Refresh</button>
                  <button onClick={clearHistory} style={{ background: "transparent", border: "none", color: "#71717a", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }} onMouseEnter={e => e.currentTarget.style.color = "#ef4444"} onMouseLeave={e => e.currentTarget.style.color = "#71717a"}><Trash2 size={13} /> Clear</button>
                </div>
              </div>
              {historyLoading ? <div style={{ textAlign: "center", padding: "40px", color: "#71717a" }}>Loading...</div>
               : showHistory.length > 0 ? showHistory.map((show, idx) => (
                <div key={show.id || idx} style={{ padding: "14px 18px", borderRadius: "12px", background: "#09090b", border: "1px solid #27272a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    {show.moviePoster || show.thumbnail
                      ? <img src={show.moviePoster || show.thumbnail} alt={show.movieTitle || show.title} style={{ width: "64px", height: "42px", borderRadius: "6px", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                      : <div style={{ width: "64px", height: "42px", borderRadius: "6px", background: "#27272a", display: "flex", alignItems: "center", justifyContent: "center" }}><Film size={16} color="#71717a" /></div>
                    }
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>{show.movieTitle || show.title}</div>
                      <div style={{ fontSize: "12px", color: "#71717a", marginTop: "2px" }}>{show.sourceType && <span style={{ textTransform: "capitalize" }}>{show.sourceType} - </span>}{fmtDate(show.watchedAt)}</div>
                    </div>
                  </div>
                  <button onClick={() => onPlayShow?.(show)} style={{ background: "#ff5500", border: "none", color: "#fff", padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    Play Again <ArrowRight size={13} />
                  </button>
                </div>
               )) : (
                <div style={{ textAlign: "center", padding: "48px", color: "#52525b" }}>
                  <Film size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#71717a" }}>No watch history yet</div>
                  <div style={{ fontSize: "12px", marginTop: "4px" }}>Watch a movie or show together to see history here.</div>
                </div>
               )}
            </div>
          )}

          {activeTab === "security" && (
            <div style={{ background: "#141417", border: "1px solid #27272a", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#fff", borderBottom: "1px solid #27272a", paddingBottom: "16px" }}>Security & Privacy</h3>
              {[
                { title: "End-to-End Encryption", icon: <ShieldCheck size={20} color="#22c55e" />, desc: "All video, audio, and chat data is encrypted using WebRTC DTLS-SRTP and AES-256.", status: "Active", c: "#22c55e" },
                { title: "Room Passcode Protection", icon: <Award size={20} color="#ff5500" />, desc: "Private rooms require a 4-6 digit PIN. Passcodes are hashed via bcrypt and never stored in plain text.", status: "Enabled", c: "#ff5500" },
                { title: "Knock-to-Join System", icon: <Users size={20} color="#a855f7" />, desc: "Guests must knock before joining. The host explicitly approves or denies every join request.", status: "Active", c: "#a855f7" },
                { title: "Rate Limiting", icon: <ShieldCheck size={20} color="#3b82f6" />, desc: "API endpoints are protected with rate limiting to prevent brute-force attacks.", status: "Active", c: "#3b82f6" },
                { title: "JWT Session Tokens", icon: <Star size={20} color="#eab308" />, desc: "Secure server-signed JSON Web Tokens with 7-day expiry.", status: "Active", c: "#eab308" },
              ].map((item, i) => (
                <div key={i} style={{ padding: "16px 18px", borderRadius: "12px", background: "#09090b", border: "1px solid #27272a", display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "10px", background: "#141417", border: "1px solid #27272a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "#fff" }}>{item.title}</span>
                      <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "6px", background: item.c + "20", color: item.c, border: "1px solid " + item.c + "40" }}>{item.status}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: "#71717a", lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
              <div style={{ padding: "14px 18px", borderRadius: "12px", background: "rgba(255,85,0,0.06)", border: "1px solid rgba(255,85,0,0.2)", fontSize: "12px", color: "#a1a1aa", lineHeight: 1.6 }}>
                <strong style={{ color: "#ff5500" }}>CYPR Privacy Promise:</strong> We do not sell, share, or monetize your data. History can be cleared at any time.
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
