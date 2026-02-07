import { useState, useEffect, useRef } from "react";

// ─── Sonia-Inspired Design Tokens ────────────────────────────────
const T = {
  bg: "#E6F2FA",
  bgDeep: "#D4E8F5",
  bgCard: "#FFFFFF",
  bgDark: "#0A1628",
  surface: "#EDF5FB",
  primary: "#0077B6",
  primaryLight: "#00A8E8",
  primarySoft: "#C8E2F2",
  accent: "#00B4D8",
  accentWarm: "#48CAE4",
  text: "#0A1628",
  textSecondary: "#4A6A82",
  textMuted: "#8BADC2",
  textOnDark: "#E6F2FA",
  success: "#7CAE7A",
  successSoft: "#E8F0E7",
  warning: "#D4A04A",
  warningSoft: "#FBF3E0",
  danger: "#C4736C",
  border: "#C8E2F2",
  shadow: "0 2px 20px rgba(0,119,182,0.06)",
  shadowHover: "0 4px 30px rgba(0,119,182,0.1)",
  radius: "20px",
  radiusSm: "14px",
  radiusXl: "28px",
  font: "'DM Sans', sans-serif",
  fontDisplay: "'Instrument Serif', Georgia, serif",
};

// ─── Icons (inline SVGs) ─────────────────────────────────────────
const Icons = {
  sun: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={T.accent} strokeWidth="1.8">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  moon: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={T.primary} strokeWidth="1.8">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  mic: (
    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.8">
      <rect x="9" y="1" width="6" height="12" rx="3" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" />
    </svg>
  ),
  play: (
    <svg width="22" height="22" fill="#fff" viewBox="0 0 24 24">
      <polygon points="6,3 20,12 6,21" />
    </svg>
  ),
  pause: (
    <svg width="22" height="22" fill="#fff" viewBox="0 0 24 24">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  ),
  check: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={T.success} strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  bell: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={T.primary} strokeWidth="1.8">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={T.textSecondary} strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  target: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={T.accent} strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  send: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  chevron: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={T.textMuted} strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  heart: (
    <svg width="18" height="18" fill={T.danger} viewBox="0 0 24 24">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  sparkle: (
    <svg width="16" height="16" fill={T.accent} viewBox="0 0 24 24">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
  ),
  user: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={T.textSecondary} strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  ),
  back: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={T.text} strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  clock: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={T.textMuted} strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

// ─── Utility ─────────────────────────────────────────────────────
const fonts = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&display=swap');
`;

// ─── Phone Frame ─────────────────────────────────────────────────
function PhoneFrame({ children, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <div
        style={{
          width: 375,
          height: 812,
          borderRadius: 44,
          background: T.bgDark,
          padding: 10,
          boxShadow: "0 25px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            width: 150,
            height: 30,
            background: T.bgDark,
            borderRadius: "0 0 20px 20px",
            zIndex: 100,
          }}
        />
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 36,
            overflow: "hidden",
            background: T.bg,
            position: "relative",
          }}
        >
          {/* Status Bar */}
          <div
            style={{
              height: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 28px",
              fontSize: 13,
              fontWeight: 600,
              color: T.text,
              fontFamily: T.font,
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 50,
            }}
          >
            <span>9:41</span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ width: 16, height: 10, border: `1.5px solid ${T.text}`, borderRadius: 2, position: "relative" }}>
                <div style={{ position: "absolute", right: 1.5, top: 1.5, bottom: 1.5, left: 1.5, background: T.text, borderRadius: 0.5 }} />
              </div>
            </div>
          </div>
          <div style={{ paddingTop: 50, height: "calc(100% - 50px)", overflowY: "auto", overflowX: "hidden" }}>
            {children}
          </div>
        </div>
      </div>
      {label && (
        <span
          style={{
            fontFamily: T.font,
            fontSize: 13,
            fontWeight: 600,
            color: T.textSecondary,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN 1: Welcome / Splash
// ═══════════════════════════════════════════════════════════════════
function WelcomeScreen() {
  return (
    <div
      style={{
        height: "100%",
        background: `linear-gradient(170deg, ${T.bg} 0%, #D4E8F5 40%, ${T.primarySoft} 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 32px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative circles */}
      <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: `${T.primaryLight}15`, }} />
      <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: `${T.accent}10`, }} />

      <div style={{ marginBottom: 48 }}>
        {/* Logo mark */}
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 28,
            background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 32px",
            boxShadow: `0 12px 40px ${T.primary}30`,
          }}
        >
          <span style={{ fontSize: 42, filter: "brightness(100)" }}>🌿</span>
        </div>

        <h1
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 42,
            fontWeight: 400,
            color: T.text,
            margin: "0 0 12px",
            lineHeight: 1.1,
          }}
        >
          Sage
        </h1>
        <p
          style={{
            fontFamily: T.font,
            fontSize: 16,
            color: T.textSecondary,
            margin: 0,
            lineHeight: 1.6,
            maxWidth: 260,
          }}
        >
          Your mindful companion for growth, reflection & accountability
        </p>
      </div>

      <button
        style={{
          width: "100%",
          maxWidth: 280,
          padding: "18px 32px",
          background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
          color: "#fff",
          border: "none",
          borderRadius: 60,
          fontFamily: T.font,
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: `0 8px 32px ${T.primary}30`,
          marginBottom: 16,
          letterSpacing: "0.02em",
        }}
      >
        Get Started
      </button>
      <button
        style={{
          padding: "14px 32px",
          background: "transparent",
          color: T.primary,
          border: `1.5px solid ${T.primarySoft}`,
          borderRadius: 60,
          fontFamily: T.font,
          fontSize: 15,
          fontWeight: 500,
          cursor: "pointer",
          width: "100%",
          maxWidth: 280,
        }}
      >
        I have an account
      </button>

      <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, marginTop: 32, lineHeight: 1.5 }}>
        By continuing, you agree to our Terms & Privacy Policy
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN 2: Onboarding Questions
// ═══════════════════════════════════════════════════════════════════
function OnboardingScreen() {
  const [selected, setSelected] = useState("balanced");

  return (
    <div style={{ height: "100%", background: T.bg, padding: "20px 24px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        {Icons.back}
      </div>

      {/* Progress */}
      <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 4,
              background: i <= 2 ? `linear-gradient(90deg, ${T.primary}, ${T.accent})` : T.primarySoft,
            }}
          />
        ))}
      </div>

      <h2 style={{ fontFamily: T.fontDisplay, fontSize: 30, color: T.text, margin: "0 0 8px", fontWeight: 400, lineHeight: 1.2 }}>
        How do you like to{" "}
        <span style={{ fontStyle: "italic", color: T.accent }}>be motivated?</span>
      </h2>
      <p style={{ fontFamily: T.font, fontSize: 15, color: T.textSecondary, margin: "0 0 32px", lineHeight: 1.5 }}>
        This helps Sage tailor its tone to what works best for you.
      </p>

      {[
        { id: "gentle", emoji: "🌸", title: "Gentle & nurturing", desc: "Soft encouragement, patient reminders" },
        { id: "balanced", emoji: "🌿", title: "Balanced & warm", desc: "Supportive with a nudge when needed" },
        { id: "direct", emoji: "🔥", title: "Direct & energizing", desc: "Clear accountability, action-focused" },
      ].map((opt) => (
        <div
          key={opt.id}
          onClick={() => setSelected(opt.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "18px 20px",
            borderRadius: T.radiusSm,
            border: `2px solid ${selected === opt.id ? T.primary : T.border}`,
            background: selected === opt.id ? `${T.primary}08` : T.bgCard,
            marginBottom: 12,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <span style={{ fontSize: 28 }}>{opt.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.font, fontSize: 16, fontWeight: 600, color: T.text }}>{opt.title}</div>
            <div style={{ fontFamily: T.font, fontSize: 13, color: T.textSecondary, marginTop: 2 }}>{opt.desc}</div>
          </div>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: `2px solid ${selected === opt.id ? T.primary : T.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: selected === opt.id ? T.primary : "transparent",
              transition: "all 0.2s",
            }}
          >
            {selected === opt.id && (
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </div>
      ))}

      <div style={{ flex: 1 }} />

      <button
        style={{
          width: "100%",
          padding: "18px",
          background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
          color: "#fff",
          border: "none",
          borderRadius: 60,
          fontFamily: T.font,
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: `0 8px 32px ${T.primary}25`,
          marginBottom: 12,
        }}
      >
        Continue
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN 3: AI Onboarding Chat
// ═══════════════════════════════════════════════════════════════════
function OnboardingChatScreen() {
  const messages = [
    { role: "ai", text: "Hey Alex! 🌿 I'm Sage, your personal growth companion. I'd love to get to know you better so I can support you the right way." },
    { role: "ai", text: "What are the top goals you're working toward right now? Could be career, health, learning — anything that matters to you." },
    { role: "user", text: "I want to land a software engineering internship at Google by May, finish an AI/ML course on Coursera, and run a half marathon in April!" },
    { role: "ai", text: "Love the ambition! 🔥 Three clear goals across career, learning, and health — that's a really well-rounded focus. Let me ask — for the Google internship, do you have any connections there or applications already in progress?" },
  ];

  return (
    <div style={{ height: "100%", background: T.bg, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderBottom: `1px solid ${T.border}`,
        background: T.bg,
      }}>
        {Icons.back}
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 14,
          background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{ fontSize: 20 }}>🌿</span>
        </div>
        <div>
          <div style={{ fontFamily: T.font, fontSize: 16, fontWeight: 600, color: T.text }}>Sage</div>
          <div style={{ fontFamily: T.font, fontSize: 12, color: T.success }}>Getting to know you...</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px" }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                maxWidth: "82%",
                padding: "14px 18px",
                borderRadius: msg.role === "user" ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                background: msg.role === "user"
                  ? `linear-gradient(135deg, ${T.primary}, ${T.accent})`
                  : T.bgCard,
                color: msg.role === "user" ? "#fff" : T.text,
                fontFamily: T.font,
                fontSize: 14.5,
                lineHeight: 1.55,
                boxShadow: msg.role === "user" ? "none" : T.shadow,
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        <div style={{ display: "flex", marginBottom: 14 }}>
          <div
            style={{
              padding: "14px 20px",
              borderRadius: "20px 20px 20px 6px",
              background: T.bgCard,
              boxShadow: T.shadow,
              display: "flex",
              gap: 5,
              alignItems: "center",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: T.textMuted,
                  animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Input */}
      <div style={{
        padding: "14px 20px 30px",
        display: "flex",
        gap: 10,
        alignItems: "center",
        borderTop: `1px solid ${T.border}`,
        background: T.bg,
      }}>
        <div
          style={{
            flex: 1,
            padding: "14px 18px",
            borderRadius: 50,
            background: T.bgCard,
            border: `1.5px solid ${T.border}`,
            fontFamily: T.font,
            fontSize: 14,
            color: T.textMuted,
          }}
        >
          Type your message...
        </div>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: `0 4px 16px ${T.primary}30`,
          }}
        >
          {Icons.send}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN 4: Morning Brief
// ═══════════════════════════════════════════════════════════════════
function MorningBriefScreen() {
  const [playing, setPlaying] = useState(false);

  return (
    <div style={{ height: "100%", background: T.bg, overflowY: "auto" }}>
      {/* Header gradient */}
      <div
        style={{
          background: `linear-gradient(180deg, #D4E8F5 0%, ${T.bg} 100%)`,
          padding: "20px 24px 24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <p style={{ fontFamily: T.font, fontSize: 14, color: T.textSecondary, margin: "0 0 2px" }}>
              Saturday, Feb 7
            </p>
            <h1 style={{ fontFamily: T.fontDisplay, fontSize: 28, color: T.text, margin: 0, fontWeight: 400 }}>
              Good morning, Alex
            </h1>
          </div>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 16,
            background: T.bgCard,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: T.shadow,
          }}>
            {Icons.bell}
          </div>
        </div>

        {/* Audio Player Card */}
        <div
          style={{
            background: `linear-gradient(135deg, ${T.primary}, #005A8C)`,
            borderRadius: T.radius,
            padding: "22px 24px",
            color: "#fff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", bottom: -30, right: 40, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            {Icons.sparkle}
            <span style={{ fontFamily: T.font, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.8 }}>
              YOUR MORNING BRIEF
            </span>
          </div>

          <p style={{ fontFamily: T.font, fontSize: 15, lineHeight: 1.6, margin: "0 0 20px", opacity: 0.95 }}>
            You've got 3 things today and a deadline coming up. Let's make it count — your AI/ML quiz is due tomorrow.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              onClick={() => setPlaying(!playing)}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                backdropFilter: "blur(10px)",
              }}
            >
              {playing ? Icons.pause : Icons.play}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
                <div style={{ width: playing ? "35%" : "0%", height: "100%", background: "#fff", borderRadius: 4, transition: "width 0.3s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontFamily: T.font, fontSize: 11, opacity: 0.6 }}>{playing ? "0:32" : "0:00"}</span>
                <span style={{ fontFamily: T.font, fontSize: 11, opacity: 0.6 }}>1:28</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "4px 24px 24px" }}>
        {/* Today's Schedule */}
        <h3 style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 14px" }}>
          Today's Schedule
        </h3>

        {[
          { time: "10:00 AM", title: "Team standup", dur: "30m", color: T.primary },
          { time: "2:00 PM", title: "AI/ML Coursera — Week 5", dur: "1h", color: T.accent },
          { time: "6:00 PM", title: "5K training run", dur: "45m", color: T.success },
          { time: "8:00 PM", title: "Study group — Algorithms", dur: "1.5h", color: T.warning },
        ].map((evt, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 16px",
              background: T.bgCard,
              borderRadius: T.radiusSm,
              marginBottom: 8,
              boxShadow: T.shadow,
            }}
          >
            <div style={{ width: 4, height: 38, borderRadius: 4, background: evt.color }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 500, color: T.text }}>{evt.title}</div>
              <div style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                {Icons.clock} {evt.time} · {evt.dur}
              </div>
            </div>
            {Icons.chevron}
          </div>
        ))}

        {/* Priority Tasks */}
        <h3 style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", margin: "24px 0 14px" }}>
          Priority Tasks
        </h3>

        {[
          { title: "Submit AI4All application", due: "Feb 10", priority: "high", icon: "🎯" },
          { title: "Complete Coursera Week 5 quiz", due: "Tomorrow", priority: "medium", icon: "📚" },
          { title: "Message James about Google referral", due: "Today", priority: "high", icon: "💬" },
        ].map((task, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 16px",
              background: T.bgCard,
              borderRadius: T.radiusSm,
              marginBottom: 8,
              boxShadow: T.shadow,
            }}
          >
            <span style={{ fontSize: 22 }}>{task.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 500, color: T.text }}>{task.title}</div>
              <div style={{ fontFamily: T.font, fontSize: 12, color: task.due === "Today" ? T.danger : T.textMuted, marginTop: 2 }}>
                Due {task.due}
              </div>
            </div>
            <div
              style={{
                padding: "4px 10px",
                borderRadius: 20,
                background: task.priority === "high" ? `${T.danger}15` : T.warningSoft,
                fontFamily: T.font,
                fontSize: 11,
                fontWeight: 600,
                color: task.priority === "high" ? T.danger : T.warning,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {task.priority}
            </div>
          </div>
        ))}

        <div style={{ height: 24 }} />
      </div>

      {/* Bottom Nav */}
      <BottomNav active="brief" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN 5: Nudge Feed
// ═══════════════════════════════════════════════════════════════════
function NudgeFeedScreen() {
  return (
    <div style={{ height: "100%", background: T.bg, overflowY: "auto" }}>
      <div style={{ padding: "20px 24px" }}>
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: 28, color: T.text, margin: "0 0 4px", fontWeight: 400 }}>
          Your nudges
        </h1>
        <p style={{ fontFamily: T.font, fontSize: 14, color: T.textSecondary, margin: "0 0 24px" }}>
          Personalized check-ins throughout your day
        </p>

        {/* Nudge Timeline */}
        {[
          {
            time: "8:30 AM",
            type: "Morning",
            title: "AI4All deadline is in 3 days",
            body: "You mentioned this is important for your Google internship goal. Want to block an hour today to finalize your application?",
            emoji: "🎯",
            status: "responded",
            color: T.accent,
          },
          {
            time: "12:15 PM",
            type: "Goal Check-in",
            title: "How's the Coursera quiz prep going?",
            body: "Week 5 quiz is due tomorrow. You've completed 3 of 5 modules. A 45-minute session this afternoon would put you in great shape.",
            emoji: "📚",
            status: "opened",
            color: T.primary,
          },
          {
            time: "3:00 PM",
            type: "Connection",
            title: "Reach out to James at Google?",
            body: "Your task to message James is due today. Here's a warm opener you could use: 'Hey James! I'm applying for the SWE internship...'",
            emoji: "💬",
            status: "pending",
            color: T.success,
          },
        ].map((nudge, i) => (
          <div key={i} style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            {/* Timeline dot */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 2 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: nudge.status === "pending" ? T.border : nudge.color,
                  border: nudge.status === "pending" ? `2px solid ${T.textMuted}` : "none",
                  boxShadow: nudge.status !== "pending" ? `0 0 0 4px ${nudge.color}20` : "none",
                }}
              />
              {i < 2 && (
                <div style={{ width: 2, flex: 1, background: T.border, marginTop: 4 }} />
              )}
            </div>

            {/* Card */}
            <div
              style={{
                flex: 1,
                background: T.bgCard,
                borderRadius: T.radiusSm,
                padding: "18px 18px",
                boxShadow: T.shadow,
                border: nudge.status === "pending" ? `1.5px dashed ${T.border}` : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 18 }}>{nudge.emoji}</span>
                  <span style={{ fontFamily: T.font, fontSize: 11, fontWeight: 600, color: nudge.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {nudge.type}
                  </span>
                </div>
                <span style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted }}>{nudge.time}</span>
              </div>
              <h4 style={{ fontFamily: T.font, fontSize: 16, fontWeight: 600, color: T.text, margin: "0 0 6px" }}>
                {nudge.title}
              </h4>
              <p style={{ fontFamily: T.font, fontSize: 13.5, color: T.textSecondary, margin: "0 0 14px", lineHeight: 1.55 }}>
                {nudge.body}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {nudge.status === "responded" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 50, background: T.successSoft }}>
                    {Icons.check}
                    <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 500, color: T.success }}>Done</span>
                  </div>
                ) : (
                  <>
                    <button style={{
                      padding: "8px 16px",
                      borderRadius: 50,
                      background: `${nudge.color}12`,
                      border: "none",
                      fontFamily: T.font,
                      fontSize: 13,
                      fontWeight: 600,
                      color: nudge.color,
                      cursor: "pointer",
                    }}>
                      Take action
                    </button>
                    <button style={{
                      padding: "8px 16px",
                      borderRadius: 50,
                      background: T.surface,
                      border: "none",
                      fontFamily: T.font,
                      fontSize: 13,
                      fontWeight: 500,
                      color: T.textMuted,
                      cursor: "pointer",
                    }}>
                      Snooze
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        <div style={{ height: 80 }} />
      </div>

      <BottomNav active="nudges" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN 6: Evening Check-in (Voice)
// ═══════════════════════════════════════════════════════════════════
function EveningCheckinScreen() {
  const [recording, setRecording] = useState(false);

  const msgs = [
    { role: "ai", text: "Hey Alex 🌙 How are you feeling right now? Take a moment — there's no rush." },
    { role: "user", text: "Honestly a bit stressed. I didn't get to the AI4All app today and the deadline is getting close." },
    { role: "ai", text: "I hear you — that weight of an approaching deadline when you haven't started can feel heavy. Let's unpack this a bit. What specifically feels overwhelming about the application? Sometimes naming it takes away its power." },
  ];

  return (
    <div style={{ height: "100%", background: T.bg, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderBottom: `1px solid ${T.border}`,
      }}>
        {Icons.back}
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 14,
          background: `linear-gradient(135deg, #003F66, #0077B6)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {Icons.moon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.font, fontSize: 16, fontWeight: 600, color: T.text }}>Evening Reflection</div>
          <div style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted }}>Session · 4 min</div>
        </div>
        <button style={{
          padding: "6px 14px",
          borderRadius: 20,
          background: T.primarySoft,
          border: "none",
          fontFamily: T.font,
          fontSize: 12,
          fontWeight: 600,
          color: T.primary,
          cursor: "pointer",
        }}>
          End
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px" }}>
        {msgs.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                maxWidth: "82%",
                padding: "14px 18px",
                borderRadius: msg.role === "user" ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                background: msg.role === "user"
                  ? `linear-gradient(135deg, ${T.primary}, ${T.accent})`
                  : T.bgCard,
                color: msg.role === "user" ? "#fff" : T.text,
                fontFamily: T.font,
                fontSize: 14.5,
                lineHeight: 1.55,
                boxShadow: msg.role === "user" ? "none" : T.shadow,
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Voice Input */}
      <div style={{
        padding: "16px 20px 32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        borderTop: `1px solid ${T.border}`,
        background: T.bg,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
          <div
            style={{
              flex: 1,
              padding: "14px 18px",
              borderRadius: 50,
              background: T.bgCard,
              border: `1.5px solid ${T.border}`,
              fontFamily: T.font,
              fontSize: 14,
              color: T.textMuted,
            }}
          >
            {recording ? "Listening..." : "Type or hold to speak"}
          </div>

          <div
            onMouseDown={() => setRecording(true)}
            onMouseUp={() => setRecording(false)}
            onMouseLeave={() => setRecording(false)}
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: recording
                ? `linear-gradient(135deg, ${T.danger}, ${T.accent})`
                : `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: recording
                ? `0 0 0 8px ${T.danger}20, 0 4px 16px ${T.danger}30`
                : `0 4px 16px ${T.primary}30`,
              transition: "all 0.2s",
              transform: recording ? "scale(1.1)" : "scale(1)",
            }}
          >
            {Icons.mic}
          </div>
        </div>
        {recording && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: T.danger,
              animation: "pulse 1s ease-in-out infinite",
            }} />
            <span style={{ fontFamily: T.font, fontSize: 13, color: T.danger, fontWeight: 500 }}>
              Recording... release to send
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN 7: Voice Chat (Gemini-style full screen)
// ═══════════════════════════════════════════════════════════════════
function VoiceChatScreen() {
  const [state, setState] = useState("idle"); // idle | listening | thinking | speaking
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const cycle = ["idle", "listening", "thinking", "speaking"];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % cycle.length;
      setState(cycle[idx]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (state !== "listening") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { clearInterval(t); setElapsed(0); };
  }, [state]);

  const stateConfig = {
    idle: { label: "Tap to speak", sublabel: "Sage is ready", color: T.primary, glowAlpha: 0 },
    listening: { label: "Listening...", sublabel: `${elapsed}s`, color: "#00B4D8", glowAlpha: 0.35 },
    thinking: { label: "Thinking...", sublabel: "Processing", color: "#0096C7", glowAlpha: 0.2 },
    speaking: { label: "Sage is speaking", sublabel: "Tap to interrupt", color: T.primary, glowAlpha: 0.25 },
  };

  const cfg = stateConfig[state];

  return (
    <div
      style={{
        height: "100%",
        background: `radial-gradient(ellipse at 50% 40%, #0D2137 0%, #070F1A 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 24px 36px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow behind orb */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${cfg.color}${Math.round(cfg.glowAlpha * 255).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
          transition: "all 0.8s ease",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", zIndex: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
          }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.7)" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: state === "idle" ? "rgba(255,255,255,0.3)" : "#00B4D8",
            boxShadow: state !== "idle" ? "0 0 8px #00B4D8" : "none",
            animation: state === "listening" ? "pulse 1.5s ease-in-out infinite" : "none",
          }} />
          <span style={{ fontFamily: T.font, fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
            Voice Session
          </span>
        </div>

        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
          }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.7)" strokeWidth="2">
            <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
          </svg>
        </div>
      </div>

      {/* Center Orb Area */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, zIndex: 10 }}>
        {/* Sage identity */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 18,
              background: `linear-gradient(135deg, ${T.primary}, #00B4D8)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              boxShadow: `0 8px 32px rgba(0,119,182,0.3)`,
            }}
          >
            <span style={{ fontSize: 26 }}>🌿</span>
          </div>
          <h2 style={{ fontFamily: T.fontDisplay, fontSize: 22, color: "#fff", margin: "0 0 4px", fontWeight: 400 }}>
            Sage
          </h2>
          <p style={{ fontFamily: T.font, fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
            Evening reflection
          </p>
        </div>

        {/* The Orb */}
        <div style={{ position: "relative", width: 180, height: 180 }}>
          {/* Outer ring pulse */}
          {(state === "listening" || state === "speaking") && (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: -20,
                  borderRadius: "50%",
                  border: `1.5px solid ${cfg.color}30`,
                  animation: "orbPulse1 2.5s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: -40,
                  borderRadius: "50%",
                  border: `1px solid ${cfg.color}18`,
                  animation: "orbPulse2 2.5s ease-in-out 0.5s infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: -60,
                  borderRadius: "50%",
                  border: `0.5px solid ${cfg.color}0C`,
                  animation: "orbPulse2 3s ease-in-out 1s infinite",
                }}
              />
            </>
          )}

          {/* Main orb */}
          <div
            style={{
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: state === "listening"
                ? `radial-gradient(circle at 40% 35%, #48CAE4, #0077B6 50%, #005A8C 100%)`
                : state === "speaking"
                ? `radial-gradient(circle at 55% 40%, #00B4D8, #0077B6 45%, #003F66 100%)`
                : state === "thinking"
                ? `radial-gradient(circle at 50% 50%, #0096C7, #005A8C 60%, #003052 100%)`
                : `radial-gradient(circle at 45% 40%, #0096C7, #0077B6 50%, #004970 100%)`,
              boxShadow: `
                0 0 60px ${cfg.color}30,
                0 0 120px ${cfg.color}15,
                inset 0 -20px 40px rgba(0,0,0,0.2),
                inset 0 20px 40px rgba(255,255,255,0.08)
              `,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.6s ease",
              animation: state === "speaking"
                ? "orbBreathe 2s ease-in-out infinite"
                : state === "thinking"
                ? "orbSpin 3s linear infinite"
                : "none",
            }}
          >
            {/* Inner shine */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.15) 0%, transparent 70%)`,
              }}
            />
          </div>

          {/* Waveform bars for listening */}
          {state === "listening" && (
            <div style={{
              position: "absolute",
              bottom: -10,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 3,
              alignItems: "flex-end",
              height: 24,
            }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 3,
                    borderRadius: 3,
                    background: "#48CAE4",
                    animation: `waveBar 0.8s ease-in-out ${i * 0.08}s infinite alternate`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Thinking dots */}
          {state === "thinking" && (
            <div style={{
              position: "absolute",
              bottom: -8,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 8,
            }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#0096C7",
                    animation: `pulse 1.2s ease-in-out ${i * 0.25}s infinite`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* State label */}
        <div style={{ textAlign: "center" }}>
          <p style={{
            fontFamily: T.font,
            fontSize: 17,
            fontWeight: 500,
            color: "#fff",
            margin: "0 0 4px",
            transition: "all 0.3s",
          }}>
            {cfg.label}
          </p>
          <p style={{
            fontFamily: T.font,
            fontSize: 13,
            color: "rgba(255,255,255,0.35)",
            margin: 0,
          }}>
            {cfg.sublabel}
          </p>
        </div>

        {/* Transcript preview */}
        {state === "speaking" && (
          <div style={{
            maxWidth: 280,
            padding: "14px 20px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <p style={{
              fontFamily: T.font,
              fontSize: 14,
              color: "rgba(255,255,255,0.7)",
              margin: 0,
              lineHeight: 1.55,
              textAlign: "center",
            }}>
              "That deadline stress is completely valid. Let's break down what you need to finish..."
            </p>
          </div>
        )}
        {state === "listening" && (
          <div style={{
            maxWidth: 280,
            padding: "14px 20px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(72,202,228,0.15)",
          }}>
            <p style={{
              fontFamily: T.font,
              fontSize: 14,
              color: "rgba(72,202,228,0.8)",
              margin: 0,
              lineHeight: 1.55,
              textAlign: "center",
            }}>
              "I didn't get to work on my AI4All application today and..."
            </p>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 28, zIndex: 10 }}>
        {/* Mute */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8">
            <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
          </svg>
        </div>

        {/* Main mic button */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: state === "listening"
              ? `linear-gradient(135deg, #00B4D8, #48CAE4)`
              : state === "speaking"
              ? "rgba(255,255,255,0.1)"
              : `linear-gradient(135deg, ${T.primary}, #00B4D8)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: state === "listening"
              ? "0 0 0 6px rgba(0,180,216,0.2), 0 8px 32px rgba(0,180,216,0.3)"
              : `0 8px 32px rgba(0,119,182,0.25)`,
            transition: "all 0.3s",
            transform: state === "listening" ? "scale(1.08)" : "scale(1)",
          }}
        >
          {state === "speaking" ? (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5">
              <rect x="7" y="7" width="10" height="10" rx="2" />
            </svg>
          ) : (
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.8">
              <rect x="9" y="1" width="6" height="12" rx="3" />
              <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" />
            </svg>
          )}
        </div>

        {/* End call */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "rgba(196,115,108,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            border: "1px solid rgba(196,115,108,0.2)",
          }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#C4736C" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN 8: Insights / Knowledge Graph Summary
// ═══════════════════════════════════════════════════════════════════
function InsightsScreen() {
  return (
    <div style={{ height: "100%", background: T.bg, overflowY: "auto" }}>
      <div style={{ padding: "20px 24px" }}>
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: 28, color: T.text, margin: "0 0 4px", fontWeight: 400 }}>
          Your journey
        </h1>
        <p style={{ fontFamily: T.font, fontSize: 14, color: T.textSecondary, margin: "0 0 24px" }}>
          How Sage understands your world
        </p>

        {/* Mood Trend */}
        <div style={{
          background: T.bgCard,
          borderRadius: T.radius,
          padding: "20px",
          boxShadow: T.shadow,
          marginBottom: 16,
        }}>
          <div style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
            This Week's Mood
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 80, paddingBottom: 8 }}>
            {[
              { day: "M", val: 7, emoji: "😊" },
              { day: "T", val: 5, emoji: "😐" },
              { day: "W", val: 8, emoji: "😄" },
              { day: "T", val: 6, emoji: "🙂" },
              { day: "F", val: 4, emoji: "😔" },
              { day: "S", val: 7, emoji: "😊" },
              { day: "S", val: 0, emoji: "" },
            ].map((d, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
                {d.val > 0 && <span style={{ fontSize: 16 }}>{d.emoji}</span>}
                <div style={{
                  width: 24,
                  height: d.val > 0 ? d.val * 5 : 2,
                  borderRadius: 12,
                  background: d.val > 0
                    ? `linear-gradient(180deg, ${T.accent}, ${T.primaryLight})`
                    : T.border,
                }} />
                <span style={{
                  fontFamily: T.font,
                  fontSize: 11,
                  color: i === 6 ? T.accent : T.textMuted,
                  fontWeight: i === 6 ? 700 : 400,
                }}>
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Goals Progress */}
        <div style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "24px 0 14px" }}>
          Goal Progress
        </div>

        {[
          { title: "Google SWE Internship", progress: 35, emoji: "💼", color: T.primary },
          { title: "AI/ML Coursera Course", progress: 60, emoji: "🧠", color: T.accent },
          { title: "Half Marathon", progress: 45, emoji: "🏃", color: T.success },
        ].map((goal, i) => (
          <div
            key={i}
            style={{
              background: T.bgCard,
              borderRadius: T.radiusSm,
              padding: "16px 18px",
              boxShadow: T.shadow,
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>{goal.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.text }}>{goal.title}</div>
              </div>
              <span style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, color: goal.color }}>{goal.progress}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 6, background: T.primarySoft, overflow: "hidden" }}>
              <div
                style={{
                  width: `${goal.progress}%`,
                  height: "100%",
                  borderRadius: 6,
                  background: `linear-gradient(90deg, ${goal.color}, ${T.accentWarm})`,
                }}
              />
            </div>
          </div>
        ))}

        {/* Knowledge Graph Preview */}
        <div style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "24px 0 14px" }}>
          Your Network
        </div>

        <div style={{
          background: T.bgCard,
          borderRadius: T.radius,
          padding: "20px",
          boxShadow: T.shadow,
        }}>
          {[
            { name: "James Park", role: "SWE @ Google", relation: "Can help with internship", emoji: "👨‍💻" },
            { name: "Prof. Sarah Chen", role: "AI/ML Professor", relation: "Course instructor", emoji: "👩‍🏫" },
          ].map((contact, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 0",
                borderBottom: i === 0 ? `1px solid ${T.border}` : "none",
              }}
            >
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: `${T.primarySoft}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}>
                {contact.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.text }}>{contact.name}</div>
                <div style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary }}>{contact.role}</div>
                <div style={{
                  fontFamily: T.font,
                  fontSize: 11,
                  color: T.accent,
                  fontWeight: 500,
                  marginTop: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}>
                  {Icons.sparkle} {contact.relation}
                </div>
              </div>
              {Icons.chevron}
            </div>
          ))}
        </div>

        <div style={{ height: 100 }} />
      </div>

      <BottomNav active="insights" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Bottom Navigation
// ═══════════════════════════════════════════════════════════════════
function BottomNav({ active }) {
  const items = [
    {
      id: "brief",
      label: "Brief",
      icon: (c) => (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth="1.8">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ),
    },
    {
      id: "nudges",
      label: "Nudges",
      icon: (c) => (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth="1.8">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
    {
      id: "checkin",
      label: "Check-in",
      icon: (c) => (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth="1.8">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ),
    },
    {
      id: "insights",
      label: "Journey",
      icon: (c) => (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth="1.8">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(230,242,250,0.92)",
        backdropFilter: "blur(20px)",
        borderTop: `1px solid ${T.border}`,
        padding: "10px 8px 22px",
        display: "flex",
        justifyContent: "space-around",
      }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            cursor: "pointer",
            opacity: active === item.id ? 1 : 0.5,
            transition: "opacity 0.2s",
          }}
        >
          {item.icon(active === item.id ? T.primary : T.textMuted)}
          <span
            style={{
              fontFamily: T.font,
              fontSize: 10,
              fontWeight: active === item.id ? 700 : 500,
              color: active === item.id ? T.primary : T.textMuted,
            }}
          >
            {item.label}
          </span>
          {active === item.id && (
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.primary, marginTop: -2 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP — Screen Showcase
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [activeScreen, setActiveScreen] = useState("all");
  const screens = [
    { id: "welcome", label: "Welcome", component: <WelcomeScreen /> },
    { id: "onboarding", label: "Onboarding", component: <OnboardingScreen /> },
    { id: "onboard-chat", label: "AI Chat Setup", component: <OnboardingChatScreen /> },
    { id: "brief", label: "Morning Brief", component: <MorningBriefScreen /> },
    { id: "nudges", label: "Nudge Feed", component: <NudgeFeedScreen /> },
    { id: "checkin", label: "Evening Check-in", component: <EveningCheckinScreen /> },
    { id: "voice", label: "Voice Chat", component: <VoiceChatScreen /> },
    { id: "insights", label: "Journey", component: <InsightsScreen /> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#070F1A", fontFamily: T.font }}>
      <style>{fonts}</style>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes orbBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes orbSpin {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(20deg); }
        }
        @keyframes orbPulse1 {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 0.2; }
        }
        @keyframes orbPulse2 {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.12); opacity: 0.1; }
        }
        @keyframes waveBar {
          0% { height: 4px; }
          100% { height: 20px; }
        }
        * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "40px 48px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: 20,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ fontSize: 18 }}>🌿</span>
            </div>
            <h1 style={{
              fontFamily: T.fontDisplay,
              fontSize: 32,
              color: T.textOnDark,
              margin: 0,
              fontWeight: 400,
            }}>
              Sage
            </h1>
          </div>
          <p style={{
            fontFamily: T.font,
            fontSize: 14,
            color: T.textMuted,
            margin: 0,
          }}>
            AI Accountability & Wellness Companion — UI/UX Screens
          </p>
        </div>

        {/* Screen Selector */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveScreen("all")}
            style={{
              padding: "8px 16px",
              borderRadius: 50,
              background: activeScreen === "all" ? T.primary : "rgba(255,255,255,0.08)",
              color: activeScreen === "all" ? "#fff" : T.textMuted,
              border: "none",
              fontFamily: T.font,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            All Screens
          </button>
          {screens.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveScreen(s.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 50,
                background: activeScreen === s.id ? T.primary : "rgba(255,255,255,0.08)",
                color: activeScreen === s.id ? "#fff" : T.textMuted,
                border: "none",
                fontFamily: T.font,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Screens Display */}
      <div style={{
        padding: "32px 48px 60px",
        display: "flex",
        gap: 40,
        overflowX: "auto",
        alignItems: "flex-start",
        justifyContent: activeScreen !== "all" ? "center" : "flex-start",
      }}>
        {screens
          .filter((s) => activeScreen === "all" || s.id === activeScreen)
          .map((s) => (
            <PhoneFrame key={s.id} label={s.label}>
              {s.component}
            </PhoneFrame>
          ))}
      </div>
    </div>
  );
}
