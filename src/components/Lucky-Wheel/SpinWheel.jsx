// src/pages/SpinWheel/SpinWheel.jsx
import { useState, useRef, useEffect, useMemo } from "react";
import WheelSVG from "./Wheel-Helper/WheelSVG";
import SpinButton from "./Wheel-Helper/SpinButton";
import CountdownTimer from "./Wheel-Helper/CountdownTimer";
import PayModal from "./Wheel-Helper/PayModel";
import WinPopup from "./Wheel-Helper/WinPopup";
import Confetti from "./Wheel-Helper/Confetti";
import ScratchCard from "../Scratch/ScratchCard.jsx";
import SlotMachine from "../Slots/Slotmachine.jsx";
import {
  SLICES,
  TOTAL,
  SLICE_DEG,
  SPIN_COST,
  COOLDOWN_SECONDS,
} from "./Wheel-Helper/Constent.js";
import BG_IMAGE from "../../assets/images/powerplay02/BG_IMG.png";
import { useAuth } from "../../context/AuthContext.jsx";
import axiosInstance from "../../utils/axiosInstance";

export default function SpinWheel() {
  const isLoggedIn = !!localStorage.getItem("user_token");
  const { user, wallet, updateWallet } = useAuth();
  const COOLDOWN_LS_KEY = "wheel_cooldown_ends_at";

  const walletCash = Number(wallet?.cash ?? 0);
  const walletBonus = Number(wallet?.bonus ?? 0);
  const coins = useMemo(() => walletCash + walletBonus, [walletCash, walletBonus]);

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [popVisible, setPopVisible] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [bulbOn, setBulbOn] = useState(true);
  const [confetti, setConfetti] = useState([]);
  const [cooldown, setCooldown] = useState(0);
  const [showPay, setShowPay] = useState(false);
  const [history, setHistory] = useState([]);
  const [totalWon, setTotalWon] = useState(0);
  const [spinCount, setSpinCount] = useState(0);

  const rotRef = useRef(0);

  // ✅ Responsive wheel size without breaking UI
  const WHEEL_BOX = 360; // good balance for 3-column layout
  const BTN_SIZE = Math.round(WHEEL_BOX * 0.24);

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const userId =
    user?._id ||
    user?.id ||
    storedUser?._id ||
    storedUser?.id ||
    localStorage.getItem("user_id") ||
    null;

  // (optional) debug logs
  useEffect(() => {
    // console.log("✅ SpinWheel mounted:", { isLoggedIn, userId, user, wallet });
  }, [isLoggedIn, userId, user, wallet]);

  useEffect(() => {
    const t = setInterval(() => setBulbOn((b) => !b), spinning ? 110 : 550);
    return () => clearInterval(t);
  }, [spinning]);

// ✅ restore cooldown after refresh
useEffect(() => {
  const endsAt = Number(localStorage.getItem(COOLDOWN_LS_KEY) || 0);
  const left = endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : 0;
  setCooldown(left);

  // if expired, cleanup
  if (left <= 0) localStorage.removeItem(COOLDOWN_LS_KEY);
}, []);

// ✅ tick cooldown each second (and keep LS in sync)
useEffect(() => {
  if (cooldown <= 0) return;

  const t = setInterval(() => {
    const endsAt = Number(localStorage.getItem(COOLDOWN_LS_KEY) || 0);
    const left = endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : 0;
    setCooldown(left);

    if (left <= 0) {
      localStorage.removeItem(COOLDOWN_LS_KEY);
    }
  }, 1000);

  return () => clearInterval(t);
}, [cooldown]);

  async function syncWalletToBackend(nextWallet) {
    const uid =
      user?._id ||
      user?.id ||
      storedUser?._id ||
      storedUser?.id ||
      localStorage.getItem("user_id");

    if (!uid) {
      console.log("❌ userId missing");
      return false;
    }

    const totalAmount =
      Number(nextWallet?.cash ?? 0) + Number(nextWallet?.bonus ?? 0);

    try {
      await axiosInstance.post("/user/user-wallet-update", {
        userId: uid,
        amount: totalAmount, // change to "amout" if backend expects that
      });
      return true;
    } catch (err) {
      console.log("❌ wallet sync failed:", err?.response?.data || err?.message);
      return false;
    }
  }

  

  function spawnConfetti() {
    const colors = [
      "#FF4081",
      "#FFEB3B",
      "#4CAF50",
      "#2196F3",
      "#FF9800",
      "#E91E63",
      "#9C27B0",
      "#00BCD4",
      "#FFD700",
    ];
    setConfetti(
      Array.from({ length: 55 }, (_, i) => ({
        id: i,
        x: 5 + Math.random() * 90,
        color: colors[i % colors.length],
        w: 7 + Math.random() * 9,
        h: 4 + Math.random() * 6,
        delay: Math.random() * 0.8,
        duration: 2 + Math.random() * 1.5,
        rotate: Math.random() * 360,
      }))
    );
    setTimeout(() => setConfetti([]), 4000);
  }

  // ✅ backend-first deduct
  async function deductSpinCostFromWallet() {
    const cash = Number(wallet?.cash ?? 0);
    const bonus = Number(wallet?.bonus ?? 0);

    let remaining = SPIN_COST;

    const takeCash = Math.min(cash, remaining);
    remaining -= takeCash;

    const takeBonus = Math.min(bonus, remaining);
    remaining -= takeBonus;

    if (remaining > 0) {
      alert("Not enough balance");
      return false;
    }

    const nextWallet = {
      ...wallet,
      cash: cash - takeCash,
      bonus: bonus - takeBonus,
    };

    const success = await syncWalletToBackend(nextWallet);

    if (success) {
      updateWallet(nextWallet);
      return true;
    } else {
      alert("Wallet update failed. Try again.");
      return false;
    }
  }

  // ✅ backend-first add winnings
  async function addWinningsToWallet(amount) {
    const nextWallet = {
      ...wallet,
      cash: Number(wallet?.cash ?? 0) + Number(amount || 0),
    };

    const success = await syncWalletToBackend(nextWallet);

    if (success) {
      updateWallet(nextWallet);
      return true;
    } else {
      alert("Wallet update failed. Try again.");
      return false;
    }
  }

  function doSpin(deductCoins = false) {
    setShowPay(false);
    setSpinning(true);
    setWinner(null);
    setPopVisible(false);
    setApiStatus(null);

    if (deductCoins) {
      deductSpinCostFromWallet().then((ok) => {
        if (!ok) {
          setSpinning(false);
          return;
        }
      });
    }

    setSpinCount((n) => n + 1);

    const extra = 7 + Math.floor(Math.random() * 4);
    const targetIdx = Math.floor(Math.random() * TOTAL);
    const offset = SLICE_DEG / 2 - Math.random() * SLICE_DEG * 0.7;
    const totalRot = extra * 360 + targetIdx * SLICE_DEG + offset;

    const startRot = rotRef.current;
    const dur = 4200 + Math.random() * 1400;
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 4.2);

    async function frame(now) {
      const t = Math.min((now - t0) / dur, 1);
      const cur = startRot + totalRot * ease(t);
      rotRef.current = cur;
      setRotation(cur);

      if (t < 1) {
        requestAnimationFrame(frame);
        return;
      }

      rotRef.current = startRot + totalRot;
      setRotation(startRot + totalRot);

      const norm = (360 - ((startRot + totalRot) % 360) + 360) % 360;
      const idx = Math.floor(norm / SLICE_DEG) % TOTAL;
      const won = SLICES[idx];

      setWinner(won);
      setSpinning(false);
      setPopVisible(true);

      if (!won.isLuck) {
        spawnConfetti();
        await addWinningsToWallet(won.amount);
        setTotalWon((w) => w + Number(won.amount || 0));
      }

      setHistory((h) => [won, ...h].slice(0, 6));
      const endsAt = Date.now() + COOLDOWN_SECONDS * 1000;
localStorage.setItem(COOLDOWN_LS_KEY, String(endsAt));
setCooldown(COOLDOWN_SECONDS);

    }

    requestAnimationFrame(frame);
  }

  async function handleSpinClick() {
    if (!isLoggedIn) return alert("Please login to play");
    if (!userId) return alert("User ID missing. Please login again.");
    if (spinning) return;

    if (cooldown > 0) {
      setShowPay(true);
      return;
    }

    doSpin(false);
  }

  return (
    <div
      className="min-h-screen w-full overflow-hidden relative flex items-center justify-center"
      style={{
        backgroundImage: `url(${BG_IMAGE})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: "'Nunito',sans-serif",
      }}
    >
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg,#000000dd 0%,#0a001aee 40%,#00000099 50%)",
        }}
      />

      {/* Neon grid */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.06 }}>
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#7c3aed" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700;900&family=Orbitron:wght@700;900&display=swap');
        @keyframes wheelShimmer { 0%,100%{ filter: drop-shadow(0 0 18px #FFD60066) drop-shadow(0 10px 30px #9c27b033); } 50%{ filter: drop-shadow(0 0 30px #FFD600aa) drop-shadow(0 10px 48px #9c27b066);} }
        @keyframes btnPulse { 0%,100%{ box-shadow: 0 0 0 4px #FFD600, 0 6px 22px #b7000055, 0 0 34px #7c3aed33; } 50%{ box-shadow: 0 0 0 7px #FFE082, 0 6px 28px #b70000aa, 0 0 52px #7c3aed55; } }
        @keyframes neonPulse { 0%,100%{ opacity: 0.7; } 50%{ opacity: 1; } }
        .wheel-wrap { animation: wheelShimmer 2.2s ease-in-out infinite; }
        .neon-pulse { animation: neonPulse 2s ease-in-out infinite; }
      `}</style>

      <Confetti pieces={confetti} />

      {/* MAIN */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8">
        {/* ✅ 3-in-1 layout: Wheel + Scratch + Slots (same line on desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ===================== COLUMN 1: WHEEL ===================== */}
          <div className="flex flex-col items-center gap-3">
            <div className="text-center">
              <h1
                className="font-black tracking-wider neon-pulse mt-2 ml-[-15px]"
                style={{
                  fontFamily: "'Fredoka One',cursive",
                  color: "#FFD700",
                  textShadow: "0 0 20px #FFD700, 0 0 40px #FFA000, 0 2px 0 #5a3e00",
                  fontSize: "clamp(28px, 4vw, 40px)",
                }}
              >
                🎰 SPIN & WIN
              </h1>

              <p
                className="text-xs tracking-[0.3em] font-bold mt-1 mb-2"
                style={{
                  color: "#7c3aed",
                  fontFamily: "'Orbitron',sans-serif",
                  textShadow: "0 0 8px #7c3aed",
                }}
              >
                FORTUNE WHEEL CASINO
              </p>
            </div>

            <div
              className="relative flex items-center justify-center wheel-wrap"
              style={{ width: WHEEL_BOX, height: WHEEL_BOX }}
            >
              {/* Pointer */}
              <div
                className="absolute  ml-[-30px] z-20 pointer-events-none"
                style={{
                  top: -10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  filter: "drop-shadow(0 4px 10px #ff000088)",
                }}
              >
                <svg width="40" height="50" viewBox="0 0 44 56">
                  <defs>
                    <radialGradient id="pGrad" cx="40%" cy="20%">
                      <stop offset="0%" stopColor="#ff8a80" />
                      <stop offset="100%" stopColor="#c62828" />
                    </radialGradient>
                  </defs>
                  <path
                    d="M22 54 L2 6 Q22 -4 42 6 Z"
                    fill="url(#pGrad)"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  <ellipse cx="22" cy="9" rx="10" ry="6" fill="#ff5252" opacity="0.45" />
                </svg>
              </div>

              <WheelSVG rotation={rotation} bulbOn={bulbOn} size={WHEEL_BOX} />

              <div
                className="absolute z-30 ml-[-32px] mt-[-32px]"
                style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
              >
                <SpinButton spinning={spinning} onClick={handleSpinClick} size={BTN_SIZE} />
              </div>
            </div>

           {cooldown > 0 && (



    <div
      className="mt-[-60px] ml-[-25px] flex justify-center"
      style={{ width: WHEEL_BOX }}
    >

      
      <div
        className="flex items-center justify-center py-3 px-6 rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(124,58,237,0.25)",
          backdropFilter: "blur(8px)",
        }}
      >
        <CountdownTimer secondsLeft={cooldown} />
      </div>
    </div>
  )}

         
          </div>

          {/* ===================== COLUMN 2: SCRATCH ===================== */}
          <div className="flex justify-center lg:justify-center">
            <div className="w-full max-w-md">
              <ScratchCard />
            </div>
          </div>

          {/* ===================== COLUMN 3: SLOT ===================== */}
          <div className="flex justify-center lg:justify-center">
            <div className="w-full max-w-md">
              <SlotMachine bet={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPay && (
        <PayModal
          coins={coins}
          cost={SPIN_COST}
          title="Pay to Spin!"
          subtitle="Spin early by paying coins"
          onPay={async () => {
            const ok = await deductSpinCostFromWallet();
            if (!ok) return;
            doSpin(false); // already paid
          }}
          onClose={() => setShowPay(false)}
        />
      )}

      {popVisible && winner && (
        <WinPopup winner={winner} apiStatus={apiStatus} onClose={() => setPopVisible(false)} />
      )}
    </div>
  );
}