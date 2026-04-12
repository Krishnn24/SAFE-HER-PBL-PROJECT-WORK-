import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, PhoneCall, Mic, MicOff, Volume2, Grid3x3 } from "lucide-react";

interface Contact {
  name: string;
  number: string;
  initial: string;
  color: string;
}

type CallState = "idle" | "countdown" | "ringing" | "active";

const PRESET_CONTACTS: Contact[] = [
  { name: "Mom", number: "+91 98765 43210", initial: "M", color: "#7C3AED" },
  { name: "Priya", number: "+91 91234 56789", initial: "P", color: "#0891B2" },
  { name: "Office", number: "+91 11234 56789", initial: "O", color: "#059669" },
];

const DELAY_OPTIONS = [
  { label: "Now", value: 0 },
  { label: "5s", value: 5 },
  { label: "10s", value: 10 },
  { label: "30s", value: 30 },
];

export default function FakeCallSection() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [selectedContact, setSelectedContact] = useState<Contact>(PRESET_CONTACTS[0]);
  const [customName, setCustomName] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [selectedDelay, setSelectedDelay] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isKeypad, setIsKeypad] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeContact: Contact = useCustom
    ? { name: customName || "Unknown", number: customNumber || "+91 00000 00000", initial: (customName || "U")[0].toUpperCase(), color: "#7C3AED" }
    : selectedContact;

  function clearTimers() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }

  function triggerCall() {
    clearTimers();
    if (selectedDelay === 0) {
      setCallState("ringing");
    } else {
      setCountdown(selectedDelay);
      setCallState("countdown");
      let c = selectedDelay;
      countdownRef.current = setInterval(() => {
        c--;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(countdownRef.current!);
          setCallState("ringing");
        }
      }, 1000);
    }
  }

  function acceptCall() {
    clearTimers();
    setCallSeconds(0);
    setCallState("active");
    timerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
  }

  function endCall() {
    clearTimers();
    setCallState("idle");
    setCallSeconds(0);
    setIsMuted(false);
    setIsSpeaker(false);
    setIsKeypad(false);
  }

  useEffect(() => () => clearTimers(), []);

  function formatTime(secs: number) {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isFullscreen = callState === "ringing" || callState === "active" || callState === "countdown";

  return (
    <>
      {/* ── FULLSCREEN CALL OVERLAY ── */}
      {isFullscreen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: callState === "active"
            ? "linear-gradient(180deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)"
            : "linear-gradient(180deg,#0d0d0d 0%,#1a0533 50%,#2d1b4e 100%)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "space-between",
          fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
          userSelect: "none",
        }}>
          {/* Status bar */}
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", padding: "14px 24px 0", color: "rgba(255,255,255,0.8)", fontSize: "13px", fontWeight: 500 }}>
            <span>{timeStr}</span>
            <span>●●●● WiFi 🔋</span>
          </div>

          {/* Caller info */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", paddingTop: "32px" }}>
            {callState === "countdown" && (
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "20px", padding: "8px 20px", color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>
                Incoming in {countdown}s — pocket your phone
              </div>
            )}
            {callState === "ringing" && (
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                incoming call
              </div>
            )}
            {callState === "active" && (
              <div style={{ color: "#4ade80", fontSize: "15px", letterSpacing: "0.03em" }}>
                {formatTime(callSeconds)}
              </div>
            )}
            <div style={{ fontSize: "34px", fontWeight: 300, color: "#fff", letterSpacing: "-0.5px" }}>
              {activeContact.name}
            </div>
            <div style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)" }}>
              {activeContact.number}
            </div>
            {callState === "ringing" && (
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>Mobile · India</div>
            )}
          </div>

          {/* Avatar with pulse rings */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {callState === "ringing" && (
              <>
                <div style={{ position: "absolute", width: "170px", height: "170px", borderRadius: "50%", border: `2px solid ${activeContact.color}`, opacity: 0.25, animation: "fkPulse1 2s ease-in-out infinite" }} />
                <div style={{ position: "absolute", width: "210px", height: "210px", borderRadius: "50%", border: `2px solid ${activeContact.color}`, opacity: 0.12, animation: "fkPulse2 2s ease-in-out infinite" }} />
              </>
            )}
            <div style={{
              width: "120px", height: "120px", borderRadius: "50%",
              background: `linear-gradient(135deg,${activeContact.color},${activeContact.color}88)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "48px", fontWeight: 300, color: "#fff",
              boxShadow: `0 0 50px ${activeContact.color}55`,
            }}>
              {activeContact.initial}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ width: "100%", padding: "0 32px 52px", display: "flex", flexDirection: "column", alignItems: "center", gap: "28px" }}>

            {/* RINGING — decline / message / accept */}
            {callState === "ringing" && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", maxWidth: "320px" }}>
                <BtnCircle bg="#ef4444" onClick={endCall} shadow="rgba(239,68,68,0.4)" label="Decline">
                  <PhoneOff size={26} color="#fff" />
                </BtnCircle>
                <BtnCircle bg="rgba(255,255,255,0.15)" onClick={endCall} label="Message">
                  <span style={{ fontSize: "22px" }}>💬</span>
                </BtnCircle>
                <BtnCircle bg="#22c55e" onClick={acceptCall} shadow="rgba(34,197,94,0.4)" label="Accept" pulse>
                  <Phone size={26} color="#fff" />
                </BtnCircle>
              </div>
            )}

            {/* ACTIVE — grid buttons + end */}
            {callState === "active" && !isKeypad && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px", width: "100%", maxWidth: "300px" }}>
                  <SmallBtn label={isMuted ? "Unmute" : "Mute"} active={isMuted} onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <MicOff size={22} color={isMuted ? "#000" : "#fff"} /> : <Mic size={22} color="#fff" />}
                  </SmallBtn>
                  <SmallBtn label="Keypad" onClick={() => setIsKeypad(true)}>
                    <Grid3x3 size={22} color="#fff" />
                  </SmallBtn>
                  <SmallBtn label="Speaker" active={isSpeaker} onClick={() => setIsSpeaker(!isSpeaker)}>
                    <Volume2 size={22} color={isSpeaker ? "#000" : "#fff"} />
                  </SmallBtn>
                  <SmallBtn label="Add call"><span style={{ fontSize: "20px" }}>➕</span></SmallBtn>
                  <SmallBtn label="Video"><span style={{ fontSize: "20px" }}>📹</span></SmallBtn>
                  <SmallBtn label="Contacts"><span style={{ fontSize: "20px" }}>👤</span></SmallBtn>
                </div>
                <BtnCircle bg="#ef4444" onClick={endCall} shadow="rgba(239,68,68,0.4)" label="">
                  <PhoneOff size={28} color="#fff" />
                </BtnCircle>
              </>
            )}

            {/* KEYPAD */}
            {callState === "active" && isKeypad && (
              <div style={{ width: "100%", maxWidth: "280px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
                  {["1","2","3","4","5","6","7","8","9","*","0","#"].map((k) => (
                    <button key={k} style={{ height: "62px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: "22px", cursor: "pointer" }}>{k}</button>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
                  <div style={{ width: "62px" }} />
                  <BtnCircle bg="#ef4444" onClick={endCall} shadow="rgba(239,68,68,0.4)" label="">
                    <PhoneOff size={26} color="#fff" />
                  </BtnCircle>
                  <button onClick={() => setIsKeypad(false)} style={{ width: "62px", height: "62px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "rgba(255,255,255,0.7)", fontSize: "13px", cursor: "pointer" }}>Hide</button>
                </div>
              </div>
            )}

            {/* COUNTDOWN — just cancel */}
            {callState === "countdown" && (
              <button onClick={endCall} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "20px", padding: "12px 32px", color: "rgba(255,255,255,0.7)", fontSize: "14px", cursor: "pointer" }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes fkPulse1 { 0%,100%{transform:scale(1);opacity:0.25} 50%{transform:scale(1.08);opacity:0.1} }
        @keyframes fkPulse2 { 0%,100%{transform:scale(1);opacity:0.12} 50%{transform:scale(1.12);opacity:0.04} }
        @keyframes fkRing   { 0%,100%{box-shadow:0 4px 20px rgba(34,197,94,0.4)} 50%{box-shadow:0 4px 40px rgba(34,197,94,0.8)} }
      `}</style>

      {/* ── DASHBOARD CARD (always visible) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <PhoneCall className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Fake Call</h2>
            <p className="text-sm text-gray-500">Trigger a fake incoming call to exit uncomfortable situations</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Preset contacts */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Choose caller</p>
            <div className="flex gap-2 flex-wrap">
              {PRESET_CONTACTS.map((c) => (
                <button key={c.name} onClick={() => { setSelectedContact(c); setUseCustom(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${!useCustom && selectedContact.name === c.name ? "border-purple-500 bg-purple-50 text-purple-700 font-medium" : "border-gray-200 text-gray-600 hover:border-purple-300"}`}>
                  <span className="w-6 h-6 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center text-xs font-semibold">{c.initial}</span>
                  {c.name}
                </button>
              ))}
              <button onClick={() => setUseCustom(true)}
                className={`px-3 py-2 rounded-xl border text-sm transition-all ${useCustom ? "border-purple-500 bg-purple-50 text-purple-700 font-medium" : "border-gray-200 text-gray-600 hover:border-purple-300"}`}>
                + Custom
              </button>
            </div>
          </div>

          {useCustom && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Caller name</label>
                <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Anjali"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Phone number</label>
                <input type="tel" value={customNumber} onChange={(e) => setCustomNumber(e.target.value)} placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>
          )}

          {/* Delay */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Call delay</p>
            <div className="flex gap-2">
              {DELAY_OPTIONS.map((d) => (
                <button key={d.value} onClick={() => setSelectedDelay(d.value)}
                  className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${selectedDelay === d.value ? "bg-purple-600 border-purple-600 text-white" : "border-gray-200 text-gray-600 hover:border-purple-300"}`}>
                  {d.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {selectedDelay > 0 ? `Pocket your phone — call rings in ${selectedDelay}s` : "Call rings immediately"}
            </p>
          </div>

          <button onClick={triggerCall}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all">
            <Phone className="w-4 h-4" />
            Trigger Fake Call
          </button>
        </div>
      </div>
    </>
  );
}

/* ── tiny helper components ── */
function BtnCircle({ bg, onClick, shadow, label, pulse, children }: {
  bg: string; onClick: () => void; shadow?: string; label: string; pulse?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <button onClick={onClick} style={{
        width: "72px", height: "72px", borderRadius: "50%",
        background: bg, border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: shadow ? `0 4px 20px ${shadow}` : "none",
        animation: pulse ? "fkRing 1.2s ease-in-out infinite" : "none",
      }}>
        {children}
      </button>
      {label && <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px" }}>{label}</span>}
    </div>
  );
}

function SmallBtn({ label, active, onClick, children }: {
  label: string; active?: boolean; onClick?: () => void; children?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <button onClick={onClick} style={{
        width: "64px", height: "64px", borderRadius: "50%",
        background: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)",
        border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {children}
      </button>
      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px" }}>{label}</span>
    </div>
  );
}