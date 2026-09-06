import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Users, Video, ShieldCheck, Copy, Check, ArrowRight,
  UserX, LogOut, Clock, Calendar, RefreshCw, Key, AlertTriangle,
  Plus, MessageSquare, Crown, Trash2, Search, Radio, Sparkles
} from "lucide-react";
import HeaderProfileMenu from "../components/HeaderProfileMenu";
import VoiceAssistant from "../components/VoiceAssistant";
import { getT } from "../utils/themeTokens";

export default function RoomsPage({
  currentUser,
  roomId,
  socket,
  roomUsers = [],
  onBack,
  onRejoinRoom,
  onOpenCreateRoom,
  onOpenProfile,
  onLogout,
  onGlobalVoiceAction,
  theme = "dark",
  onToggleTheme
}) {
  const T = getT(theme);

  const [activeTab, setActiveTab] = useState("current"); // "current" | "active" | "history"
  const [activityLogs, setActivityLogs] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [pastHistory, setPastHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [kickTarget, setKickTarget] = useState(null); // confirmation modal state
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const copyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Copied room code: ${code}`);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  const copyInviteLink = (code) => {
    if (!code) return;
    const url = `${window.location.origin}/?room=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    showToast(`Invite link copied to clipboard! 🔗`);
  };

  const fmtTime = (ts) => {
    if (!ts) return "Just now";
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const fmtDate = (ts) => {
    if (!ts) return "Recently";
    return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  // Check if current user is Host of the active room
  const isHost = Boolean(
    currentUser &&
    (roomUsers.some(u => u.socketId === socket?.id && (u.isHost || u.role === 'host')) ||
    (roomUsers.length > 0 && roomUsers[0]?.socketId === socket?.id))
  );

  // Request room details and user rooms list on mount & whenever room changes
  const fetchRoomData = () => {
    if (!socket) return;
    setLoading(true);

    if (roomId) {
      socket.emit("get-room-details", { roomId });
    }
    socket.emit("get-my-rooms", { userEmail: currentUser?.email });

    setTimeout(() => setLoading(false), 500);
  };

  useEffect(() => {
    fetchRoomData();

    if (!socket) return;

    const handleRoomDetails = (details) => {
      if (details?.activityLogs) {
        setActivityLogs(details.activityLogs);
      }
    };

    const handleMyRooms = ({ activeRooms, pastHistory: history }) => {
      if (Array.isArray(activeRooms)) setAllRooms(activeRooms);
      if (Array.isArray(history)) setPastHistory(history);
      setLoading(false);
    };

    const handleActivityUpdate = ({ activities }) => {
      if (Array.isArray(activities)) {
        setActivityLogs(activities);
      }
    };

    socket.on("room-details-response", handleRoomDetails);
    socket.on("my-rooms-response", handleMyRooms);
    socket.on("room-activity-update", handleActivityUpdate);

    return () => {
      socket.off("room-details-response", handleRoomDetails);
      socket.off("my-rooms-response", handleMyRooms);
      socket.off("room-activity-update", handleActivityUpdate);
    };
  }, [socket, roomId, currentUser?.email]);

  // Host Kicks Member
  const handleKickUser = (targetUser) => {
    if (!socket || !targetUser || !roomId) return;
    socket.emit("kick-user", {
      roomId,
      targetSocketId: targetUser.socketId,
      targetUserName: targetUser.name
    });
    setKickTarget(null);
    showToast(`⛔ Threw ${targetUser.name} out of the lounge.`);
  };

  // Filtered rooms
  const filteredRooms = allRooms.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      r.roomId.toLowerCase().includes(q) ||
      (r.hostName && r.hostName.toLowerCase().includes(q))
    );
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: T.pageBg,
        color: T.textPrimary,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, Plus Jakarta Sans, sans-serif",
        transition: "background 0.4s ease, color 0.35s ease"
      }}
    >
      {/* Sticky Header */}
      <header
        style={{
          height: "64px",
          background: T.headerBg,
          borderBottom: `1px solid ${T.border2}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(16px)",
          transition: "background 0.4s ease, border-color 0.35s ease"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            onClick={onBack}
            style={{
              background: T.pillBg,
              border: `1px solid ${T.pillBorder}`,
              color: T.textPrimary,
              borderRadius: "8px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = T.pillBg}
          >
            <ArrowLeft size={14} />
            <span>Back to Lounge</span>
          </button>
          <img src="/viam_logo.png" alt="CYPR ViAM" style={{ height: "48px", objectFit: "contain" }} />
          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              background: "linear-gradient(135deg, #ff5500 0%, #ff8844 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            Lounges & Member Manager
          </span>
        </div>

        {toastMsg && (
          <div
            style={{
              fontSize: "12px",
              fontWeight: "600",
              padding: "6px 16px",
              borderRadius: "8px",
              background: "rgba(34,197,94,0.15)",
              color: "#22c55e",
              border: "1px solid rgba(34,197,94,0.3)",
              animation: "fadeIn 0.2s ease"
            }}
          >
            {toastMsg}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={fetchRoomData}
            title="Refresh Rooms & Activity"
            style={{
              background: T.pillBg,
              border: `1px solid ${T.pillBorder}`,
              color: T.textMuted1,
              cursor: "pointer",
              borderRadius: "8px",
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: "600"
            }}
          >
            <RefreshCw size={13} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
          <VoiceAssistant onGlobalVoiceAction={onGlobalVoiceAction} theme={theme} showLabel={false} />
          <HeaderProfileMenu
            userAccount={currentUser}
            onOpenProfile={onOpenProfile}
            onOpenHistory={onOpenProfile}
            onLogout={onLogout}
            theme={theme}
          />
        </div>
      </header>

      {/* Main Container */}
      <main
        style={{
          flex: 1,
          maxWidth: "1280px",
          width: "100%",
          margin: "0 auto",
          padding: "32px 32px 60px",
          display: "flex",
          flexDirection: "column",
          gap: "28px"
        }}
      >
        {/* Top Metric Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
          {[
            { label: "Current Lounge", value: roomId || "None", icon: <Radio size={16} color="#ff5500" />, sub: roomId ? `${roomUsers.length} online` : "Not joined" },
            { label: "Active Lounges", value: allRooms.filter(r => r.status === 'active').length, icon: <Users size={16} color="#22c55e" />, sub: "Real-time active" },
            { label: "Hosted by Me", value: allRooms.filter(r => r.isHost).length, icon: <Crown size={16} color="#eab308" />, sub: "Host permissions" },
            { label: "Inactivity Rule", value: "2 Hours", icon: <Clock size={16} color="#a855f7" />, sub: "Auto-purge when empty" }
          ].map((m, i) => (
            <div
              key={i}
              style={{
                background: T.profileCardBg,
                border: `1px solid ${T.profileBorder}`,
                borderRadius: "14px",
                padding: "16px 20px",
                boxShadow: T.isLight ? "0 2px 10px rgba(0,0,0,0.03)" : "none"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: T.textMuted2, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {m.label}
                </span>
                {m.icon}
              </div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: T.textPrimary, fontFamily: m.label.includes("Lounge") ? "monospace" : "inherit" }}>
                {m.value}
              </div>
              <div style={{ fontSize: "11px", color: T.textMuted1, marginTop: "4px" }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Inactivity & Data Lifetime Notice Banner */}
        <div
          style={{
            background: T.isLight ? "rgba(255,85,0,0.06)" : "rgba(255,85,0,0.08)",
            border: "1px solid rgba(255,85,0,0.25)",
            borderRadius: "12px",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            color: T.textPrimary
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Sparkles size={16} color="#ff5500" />
            <span>
              <strong>Chat & Room Lifetime Policy:</strong> Room chatting and co-watch state stay permanently preserved. If an empty room remains inactive for <strong>2 continuous hours</strong> with 0 online members, the room and its messages are automatically purged for privacy.
            </span>
          </div>
          {onOpenCreateRoom && (
            <button
              onClick={onOpenCreateRoom}
              style={{
                background: "#ff5500",
                border: "none",
                color: "#fff",
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Plus size={13} /> Create Lounge
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "8px", borderBottom: `1px solid ${T.borderDivider}`, paddingBottom: "12px" }}>
          {[
            { id: "current", label: `Active Lounge (${roomId || "None"})`, icon: <Video size={14} /> },
            { id: "active", label: `All Active Lounges (${allRooms.length})`, icon: <Users size={14} /> },
            { id: "history", label: `Past Joined History (${pastHistory.length})`, icon: <Clock size={14} /> }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                background: activeTab === t.id ? (T.isLight ? "rgba(0,0,0,0.07)" : "#27272a") : "transparent",
                border: activeTab === t.id ? `1px solid ${T.border1}` : "1px solid transparent",
                color: activeTab === t.id ? T.textPrimary : T.textMuted2,
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.15s"
              }}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: CURRENT ACTIVE LOUNGE (MEMBERS MANAGEMENT & REAL-TIME ACTIVITY LOG) */}
        {activeTab === "current" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "24px" }}>
            {/* Left: Live Members List & Host Kick Tools */}
            <div
              style={{
                background: T.profileCardBg,
                border: `1px solid ${T.profileBorder}`,
                borderRadius: "16px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                boxShadow: T.isLight ? "0 4px 20px rgba(0,0,0,0.04)" : "none"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.borderDivider}`, paddingBottom: "14px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: T.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>Active Room Members</span>
                    <span style={{ fontSize: "12px", background: "rgba(34,197,94,0.15)", color: "#22c55e", padding: "2px 8px", borderRadius: "10px", fontWeight: "700" }}>
                      {roomUsers.length} Online
                    </span>
                  </h3>
                  <div style={{ fontSize: "12px", color: T.textMuted1, marginTop: "4px" }}>
                    Room: <strong style={{ color: "#ff5500", fontFamily: "monospace" }}>{roomId || "Not inside a room"}</strong>
                  </div>
                </div>

                {roomId && (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => copyCode(roomId)}
                      title="Copy Room Code"
                      style={{
                        background: T.pillBg,
                        border: `1px solid ${T.pillBorder}`,
                        color: T.textPrimary,
                        padding: "6px 10px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px"
                      }}
                    >
                      {copiedCode === roomId ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                      <span>Code</span>
                    </button>
                    <button
                      onClick={() => copyInviteLink(roomId)}
                      title="Copy Invite Link"
                      style={{
                        background: "rgba(255,85,0,0.12)",
                        border: "1px solid rgba(255,85,0,0.3)",
                        color: "#ff5500",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}
                    >
                      <span>Share Link</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Members List */}
              {roomUsers.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {roomUsers.map((user, idx) => {
                    const isSelf = user.socketId === socket?.id;
                    const isUserHost = idx === 0 || user.isHost || user.role === 'host';

                    return (
                      <div
                        key={user.socketId || idx}
                        style={{
                          padding: "12px 16px",
                          borderRadius: "12px",
                          background: T.profileSubcardBg,
                          border: `1px solid ${T.border1}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ position: "relative" }}>
                            <img
                              src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
                              alt=""
                              style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${isUserHost ? "#ff5500" : T.border1}` }}
                            />
                            {/* Pulsing Online Badge */}
                            <span
                              style={{
                                position: "absolute",
                                bottom: 0,
                                right: 0,
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                background: "#22c55e",
                                border: `2px solid ${T.pageBg}`,
                                boxShadow: "0 0 8px #22c55e"
                              }}
                            />
                          </div>

                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "14px", fontWeight: "700", color: T.textPrimary }}>
                                {user.name}
                              </span>
                              {isSelf && (
                                <span style={{ fontSize: "10px", color: T.textMuted2, background: T.pillBg, padding: "1px 6px", borderRadius: "4px" }}>
                                  You
                                </span>
                              )}
                              {isUserHost && (
                                <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px", fontWeight: "700", background: "rgba(255,85,0,0.15)", color: "#ff5500", padding: "2px 7px", borderRadius: "6px", border: "1px solid rgba(255,85,0,0.3)" }}>
                                  <Crown size={10} /> HOST
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "11px", color: T.textMuted1, marginTop: "2px" }}>
                              🟢 Online right now • Socket: {user.socketId ? user.socketId.slice(0, 7) + "..." : "connected"}
                            </div>
                          </div>
                        </div>

                        {/* Host Kick Action */}
                        <div>
                          {isHost && !isSelf && !isUserHost ? (
                            <button
                              onClick={() => setKickTarget(user)}
                              title="Throw / Kick this user out of the lounge"
                              style={{
                                background: "rgba(239,68,68,0.1)",
                                border: "1px solid rgba(239,68,68,0.25)",
                                color: "#ef4444",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "all 0.15s"
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.2)"}
                              onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                            >
                              <UserX size={13} />
                              <span>Throw User</span>
                            </button>
                          ) : isUserHost ? (
                            <span style={{ fontSize: "11px", color: T.textMuted2, fontWeight: "500" }}>Lounge Host</span>
                          ) : (
                            <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: "600" }}>Active Member</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px", color: T.textMuted2 }}>
                  <Video size={36} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
                  <div style={{ fontSize: "14px", fontWeight: "600", color: T.textPrimary }}>Not Currently in a Lounge</div>
                  <div style={{ fontSize: "12px", marginTop: "4px" }}>Join or create a lounge to view live members here.</div>
                </div>
              )}
            </div>

            {/* Right: Real-time Member Activity Log with Timestamps */}
            <div
              style={{
                background: T.profileCardBg,
                border: `1px solid ${T.profileBorder}`,
                borderRadius: "16px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                boxShadow: T.isLight ? "0 4px 20px rgba(0,0,0,0.04)" : "none"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.borderDivider}`, paddingBottom: "14px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: T.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock size={16} color="#ff5500" />
                  <span>Member Activity Timeline</span>
                </h3>
                <span style={{ fontSize: "11px", color: T.textMuted2 }}>Real-time audit log</span>
              </div>

              {activityLogs.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "480px", overflowY: "auto", paddingRight: "4px" }}>
                  {activityLogs.map((act, idx) => {
                    let badgeColor = "#22c55e";
                    let badgeBg = "rgba(34,197,94,0.12)";
                    let badgeBorder = "rgba(34,197,94,0.25)";
                    let icon = <Check size={12} />;
                    let actionText = "joined the room";

                    if (act.type === "leave") {
                      badgeColor = "#eab308";
                      badgeBg = "rgba(234,179,8,0.12)";
                      badgeBorder = "rgba(234,179,8,0.25)";
                      icon = <LogOut size={12} />;
                      actionText = "left the room";
                    } else if (act.type === "kicked") {
                      badgeColor = "#ef4444";
                      badgeBg = "rgba(239,68,68,0.12)";
                      badgeBorder = "rgba(239,68,68,0.25)";
                      icon = <UserX size={12} />;
                      actionText = `was thrown out by Host ${act.by || "Host"}`;
                    } else if (act.type === "create") {
                      badgeColor = "#a855f7";
                      badgeBg = "rgba(168,85,247,0.12)";
                      badgeBorder = "rgba(168,85,247,0.25)";
                      icon = <Crown size={12} />;
                      actionText = "created this lounge";
                    }

                    return (
                      <div
                        key={act.id || idx}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "10px",
                          background: T.profileSubcardBg,
                          border: `1px solid ${T.border1}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "24px",
                              height: "24px",
                              borderRadius: "6px",
                              background: badgeBg,
                              color: badgeColor,
                              border: `1px solid ${badgeBorder}`
                            }}
                          >
                            {icon}
                          </span>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: "600", color: T.textPrimary }}>
                              <strong>{act.userName || "Member"}</strong>{" "}
                              <span style={{ fontWeight: "400", color: T.textMuted1 }}>{actionText}</span>
                            </div>
                            <div style={{ fontSize: "11px", color: T.textMuted2, marginTop: "2px" }}>
                              {fmtDate(act.timestamp)} at {fmtTime(act.timestamp)}
                            </div>
                          </div>
                        </div>

                        <span style={{ fontSize: "11px", fontWeight: "700", color: badgeColor, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {act.type}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px", color: T.textMuted2 }}>
                  <Clock size={32} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
                  <div style={{ fontSize: "13px", color: T.textPrimary, fontWeight: "600" }}>No Activity Recorded Yet</div>
                  <div style={{ fontSize: "11px", marginTop: "4px" }}>Member entries, exits, and kicks will be logged here with timestamps.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ALL ACTIVE LOUNGES */}
        {activeTab === "active" && (
          <div
            style={{
              background: T.profileCardBg,
              border: `1px solid ${T.profileBorder}`,
              borderRadius: "16px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              boxShadow: T.isLight ? "0 4px 20px rgba(0,0,0,0.04)" : "none"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: T.textPrimary }}>All Live & Active Lounges</h3>
                <div style={{ fontSize: "12px", color: T.textMuted1, marginTop: "4px" }}>
                  Join active rooms or manage rooms you created
                </div>
              </div>

              {/* Search Bar */}
              <div style={{ position: "relative", width: "260px" }}>
                <Search size={14} color={T.textMuted2} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Search by room code or host..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 34px",
                    background: T.profileInputBg,
                    border: `1px solid ${T.profileBorder}`,
                    borderRadius: "8px",
                    color: T.textPrimary,
                    fontSize: "12px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            {filteredRooms.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
                {filteredRooms.map((r, idx) => (
                  <div
                    key={r.roomId || idx}
                    style={{
                      padding: "18px",
                      borderRadius: "14px",
                      background: T.profileSubcardBg,
                      border: `1px solid ${r.roomId === roomId ? "#ff5500" : T.border1}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                      boxShadow: r.roomId === roomId ? "0 0 16px rgba(255,85,0,0.15)" : "none"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "15px", fontWeight: "800", color: T.textPrimary, fontFamily: "monospace" }}>
                          {r.roomId}
                        </span>
                        {r.roomId === roomId && (
                          <span style={{ fontSize: "10px", fontWeight: "700", background: "rgba(34,197,94,0.15)", color: "#22c55e", padding: "2px 7px", borderRadius: "6px" }}>
                            CURRENT
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: r.status === "active" ? "rgba(34,197,94,0.12)" : T.pillBg,
                          color: r.status === "active" ? "#22c55e" : T.textMuted2,
                          border: `1px solid ${r.status === "active" ? "rgba(34,197,94,0.3)" : T.pillBorder}`
                        }}
                      >
                        {r.status === "active" ? `🟢 ${r.onlineCount} Online` : "⚪ Idle"}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: T.textMuted1 }}>
                      <div>Host: <strong style={{ color: T.textPrimary }}>{r.hostName}</strong> {r.isHost && "(You)"}</div>
                      <div>Capacity: {r.onlineCount} / {r.maxCapacity} members max</div>
                      <div>Security: {r.hasPasscode ? "🔒 Passcode Protected" : "🔓 Open / Knock to enter"}</div>
                      <div>Chat Messages: {r.messageCount} stored in DB</div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <button
                        onClick={() => copyInviteLink(r.roomId)}
                        style={{
                          flex: 1,
                          background: T.pillBg,
                          border: `1px solid ${T.pillBorder}`,
                          color: T.textPrimary,
                          padding: "8px 12px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px"
                        }}
                      >
                        <Copy size={12} />
                        <span>Copy Link</span>
                      </button>

                      <button
                        onClick={() => onRejoinRoom?.(r.roomId)}
                        style={{
                          flex: 1,
                          background: "#ff5500",
                          border: "none",
                          color: "#fff",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px"
                        }}
                      >
                        <span>{r.roomId === roomId ? "Enter Lounge" : "Rejoin"}</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "48px 20px", color: T.textMuted2 }}>
                <Users size={36} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
                <div style={{ fontSize: "14px", fontWeight: "600", color: T.textPrimary }}>No Active Lounges Found</div>
                <div style={{ fontSize: "12px", marginTop: "4px" }}>Create a lounge to get started or wait for other peers to host.</div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PAST JOINED ROOM HISTORY */}
        {activeTab === "history" && (
          <div
            style={{
              background: T.profileCardBg,
              border: `1px solid ${T.profileBorder}`,
              borderRadius: "16px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              boxShadow: T.isLight ? "0 4px 20px rgba(0,0,0,0.04)" : "none"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.borderDivider}`, paddingBottom: "14px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: T.textPrimary }}>Past Room History</h3>
                <div style={{ fontSize: "12px", color: T.textMuted1, marginTop: "4px" }}>
                  All lounges you joined or hosted on this account
                </div>
              </div>
            </div>

            {pastHistory.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {pastHistory.map((h, idx) => (
                  <div
                    key={h.id || idx}
                    style={{
                      padding: "14px 18px",
                      borderRadius: "12px",
                      background: T.profileSubcardBg,
                      border: `1px solid ${T.border1}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: T.pillBg,
                          border: `1px solid ${T.pillBorder}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Video size={16} color={h.isHost ? "#ff5500" : T.textMuted2} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "14px", fontWeight: "700", color: T.textPrimary, fontFamily: "monospace" }}>
                            {h.roomId}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: "700",
                              background: h.isHost ? "rgba(255,85,0,0.15)" : T.pillBg,
                              color: h.isHost ? "#ff5500" : T.textMuted2,
                              padding: "2px 8px",
                              borderRadius: "6px"
                            }}
                          >
                            {h.isHost ? "HOST" : "MEMBER"}
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: T.textMuted1, marginTop: "2px" }}>
                          Joined on {fmtDate(h.joinedAt)} at {fmtTime(h.joinedAt)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => copyCode(h.roomId)}
                        style={{
                          background: T.pillBg,
                          border: `1px solid ${T.pillBorder}`,
                          color: T.textPrimary,
                          padding: "6px 10px",
                          borderRadius: "8px",
                          cursor: "pointer"
                        }}
                      >
                        {copiedCode === h.roomId ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                      </button>
                      <button
                        onClick={() => onRejoinRoom?.(h.roomId)}
                        style={{
                          background: "#ff5500",
                          border: "none",
                          color: "#fff",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        Rejoin <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "48px 20px", color: T.textMuted2 }}>
                <Clock size={36} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
                <div style={{ fontSize: "14px", fontWeight: "600", color: T.textPrimary }}>No Room History Found</div>
                <div style={{ fontSize: "12px", marginTop: "4px" }}>Your joined lounges will be preserved here.</div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirmation Modal for Throwing / Kicking a Member */}
      {kickTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: T.isLight ? "#ffffff" : "#18181b",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "18px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(239,68,68,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <UserX size={22} color="#ef4444" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: T.textPrimary }}>
                  Throw Member Out?
                </h4>
                <div style={{ fontSize: "12px", color: T.textMuted1, marginTop: "2px" }}>
                  Lounge Host Administrative Action
                </div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: "13px", color: T.textMuted1, lineHeight: 1.5 }}>
              Are you sure you want to kick <strong style={{ color: T.textPrimary }}>{kickTarget.name}</strong> out of room <strong style={{ color: "#ff5500" }}>{roomId}</strong>? They will be immediately removed and blocked from re-entering without approval.
            </p>

            <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
              <button
                onClick={() => setKickTarget(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  background: T.pillBg,
                  border: `1px solid ${T.pillBorder}`,
                  color: T.textPrimary,
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => handleKickUser(kickTarget)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  background: "#ef4444",
                  border: "none",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <UserX size={14} />
                <span>Confirm & Throw</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
