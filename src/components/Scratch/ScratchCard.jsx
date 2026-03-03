import { useEffect, useMemo, useRef, useState } from "react";
import ScratchPayModal from "./ScratchPayModal";
import { API_URL } from "../Lucky-Wheel/Wheel-Helper/Constent";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance"; // ✅ ADD

/** ✅ 24 hours in ms */
const DAY_MS = 24 * 60 * 60 * 1000;
const LS_KEY = "scratch_last_played_at";

/** ✅ Cost to scratch early */
const SCRATCH_COST = 20;

/** ✅ Weighted probability rewards */
const REWARDS = [
  { amount: 10, weight: 40 },
  { amount: 20, weight: 25 },
  { amount: 30, weight: 15 },
  { amount: 50, weight: 10 },
  { amount: 100, weight: 7 },
  { amount: 200, weight: 2.5 },
  { amount: 500, weight: 0.5 }, // jackpot
];

function pickWeightedReward() {
  const total = REWARDS.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const r of REWARDS) {
    roll -= r.weight;
    if (roll <= 0) return r.amount;
  }
  return REWARDS[0].amount;
}

function msToHMS(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
}

export default function ScratchCard() {
  const { user,wallet, updateWallet } = useAuth();
  const isLoggedIn = !!localStorage.getItem("user_token");

  const walletCash = isLoggedIn ? Number(wallet?.cash ?? 0) : 0;
  const walletBonus = isLoggedIn ? Number(wallet?.bonus ?? 0) : 0;
  const coins = walletCash + walletBonus;

  // ✅ userId (fallbacks)
const storedUser = (() => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
})();

const userId = user?._id || user?.id || storedUser?._id || storedUser?.id || null;

  // ✅ BACKEND WALLET SYNC (POST /user-wallet-update { userId, amout })
async function syncWalletToBackend(nextWallet) {
  if (!userId) {
    console.log("❌ userId missing, wallet not synced");
    return false;
  }

  const totalAmount =
    Number(nextWallet?.cash ?? 0) + Number(nextWallet?.bonus ?? 0);

  try {
    await axiosInstance.post("/user/user-wallet-update", {
      userId,
      amount: totalAmount,
    });

    return true; // ✅ success
  } catch (err) {
    console.log(
      "❌ wallet sync failed:",
      err?.response?.data || err?.message
    );
    return false; // ❌ fail
  }
}
  const canvasRef = useRef(null);
  const scratching = useRef(false);

  const [revealed, setRevealed] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(null);
  const [showPay, setShowPay] = useState(false);

  // cooldown
  const [timeLeft, setTimeLeft] = useState(0);

  const WIDTH = 320;
  const HEIGHT = 190;

  const canPlayFree = timeLeft <= 0;

  /** ✅ paint scratch cover */
  const paintCover = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // reset
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // metallic gradient
    const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    grad.addColorStop(0, "#e6e6e6");
    grad.addColorStop(0.25, "#bdbdbd");
    grad.addColorStop(0.55, "#9e9e9e");
    grad.addColorStop(0.8, "#d8d8d8");
    grad.addColorStop(1, "#b0b0b0");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // foil texture lines
    ctx.globalAlpha = 0.22;
    for (let i = 0; i < 70; i++) {
      const y = Math.random() * HEIGHT;
      ctx.strokeStyle = i % 2 ? "#ffffff" : "#7a7a7a";
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y + (Math.random() * 10 - 5));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#5f5f5f";
    ctx.font = "900 22px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH HERE", WIDTH / 2, HEIGHT / 2 + 8);
  };

  /** ✅ init cooldown timer from localStorage */
  useEffect(() => {
    const last = Number(localStorage.getItem(LS_KEY) || 0);
    const left = last ? Math.max(0, DAY_MS - (Date.now() - last)) : 0;
    setTimeLeft(left);
  }, []);

  /** ✅ tick timer */
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => {
      const last = Number(localStorage.getItem(LS_KEY) || 0);
      const left = last ? Math.max(0, DAY_MS - (Date.now() - last)) : 0;
      setTimeLeft(left);
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  /** ✅ paint cover on mount */
  useEffect(() => {
    paintCover();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ✅ start new scratch session */
  const startScratch = () => {
    setShowPay(false);
    setRevealed(false);
    const amt = pickWeightedReward();
    setRewardAmount(amt);
    paintCover();
  };

  /** ✅ send to backend (scratch history) */
  async function sendScratchToBackend(amount) {
    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "scratch",
          amount,
          label: `Scratch Win ${amount}`,
          claimedAt: new Date().toISOString(),
        }),
      });
    } catch {
      // ignore
    }
  }

  /** ✅ deduct cost from wallet (cash first, then bonus) + sync backend */
const deductFromWallet = async (cost) => {
  const c = Number(cost || 0);
  if (!c) return false;

  const cash = Number(wallet?.cash ?? 0);
  const bonus = Number(wallet?.bonus ?? 0);

  let remaining = c;

  const takeCash = Math.min(cash, remaining);
  remaining -= takeCash;

  const takeBonus = Math.min(bonus, remaining);
  remaining -= takeBonus;

  if (remaining > 0) return false; // not enough

  const nextWallet = {
    ...wallet,
    cash: cash - takeCash,
    bonus: bonus - takeBonus,
  };

  // ✅ backend-first
  const ok = await syncWalletToBackend(nextWallet);
  if (!ok) return false;

  // ✅ update UI only after backend success
  updateWallet(nextWallet);
  return true;
};
  /** ✅ add winnings to wallet cash + sync backend */
 const addWinToWallet = async (amount) => {
  const nextWallet = {
    ...wallet,
    cash: Number(wallet?.cash ?? 0) + Number(amount || 0),
  };

  // ✅ backend-first
  const ok = await syncWalletToBackend(nextWallet);
  if (!ok) return false;

  // ✅ update UI only after backend success
  updateWallet(nextWallet);
  return true;
};

  /** ✅ open scratch logic */
  const handleOpenScratch = () => {
    const isLoggedIn = !!localStorage.getItem("user_token");
    if (!isLoggedIn) {
      alert("Please login to scratch");
      return;
    }

    if (revealed) return;

    if (!canPlayFree) {
      setShowPay(true);
      return;
    }

    localStorage.setItem(LS_KEY, String(Date.now()));
    setTimeLeft(DAY_MS);
    startScratch();
  };

  /** ✅ pay early scratch */
  const handlePayScratch = async(cost) => {
    const need = Number(cost || SCRATCH_COST);
    if (coins < need) return;

  const ok = await deductFromWallet(need);
if (!ok) return;

    // treat as "played now" so cooldown starts again
    localStorage.setItem(LS_KEY, String(Date.now()));
    setTimeLeft(DAY_MS);

    setShowPay(false);
    startScratch();
  };

  const scratch = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();
  };

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const checkReveal = async () => {
  if (revealed) return;

  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");
  const pixels = ctx.getImageData(0, 0, WIDTH, HEIGHT);

  let cleared = 0;
  for (let i = 3; i < pixels.data.length; i += 4) {
    if (pixels.data[i] === 0) cleared++;
  }

  const percent = cleared / (pixels.data.length / 4);

  if (percent > 0.35) {
    setRevealed(true);

    const amt = Number(rewardAmount || 0);
    if (amt > 0) {
      const ok = await addWinToWallet(amt);
      if (ok) {
        sendScratchToBackend(amt);
      }
    }
  }
};

  const handleMove = (e) => {
    if (!scratching.current) return;
    if (rewardAmount == null) return;

    const { x, y } = getPos(e);
    scratch(x, y);
    checkReveal();
  };

  const statusText = useMemo(() => {
    if (canPlayFree) return "🎁 Free scratch available";
    return `⏳ Next free scratch in ${msToHMS(timeLeft)}`;
  }, [canPlayFree, timeLeft]);

  return (
    <div
      className="rounded-3xl p-5 flex flex-col items-center gap-4 select-none"
      style={{
        background: "linear-gradient(160deg,#0f002588,#1a003588)",
        border: "1.5px solid rgba(124,58,237,0.22)",
        backdropFilter: "blur(18px)",
        boxShadow: "0 10px 50px rgba(0,0,0,0.55)",
      }}
    >
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3">
          <span
            className="text-2xl"
            style={{ filter: "drop-shadow(0 0 10px rgba(255,215,0,0.55))" }}
          >
            🎰
          </span>

          <h2
            className="text-3xl font-black tracking-wider"
            style={{
              fontFamily: "'Fredoka One',cursive",
              color: "#FFD700",
              textShadow: "0 0 18px #FFD700, 0 0 34px #FFA000, 0 2px 0 #5a3e00",
            }}
          >
            SCRATCH &amp; WIN
          </h2>
        </div>

        <p
          className="text-xs font-bold tracking-[0.35em] mt-1"
          style={{
            fontFamily: "'Orbitron',sans-serif",
            color: "#a78bfa",
            textShadow: "0 0 10px rgba(124,58,237,0.8)",
          }}
        >
          INSTANT BONUS REWARDS
        </p>

        <p
          className="mt-2 text-[11px] font-extrabold tracking-[0.25em]"
          style={{
            fontFamily: "'Orbitron',sans-serif",
            color: canPlayFree ? "#4ade80" : "#f87171",
            textShadow: canPlayFree
              ? "0 0 10px rgba(74,222,128,0.35)"
              : "0 0 10px rgba(248,113,113,0.45)",
          }}
        >
          {statusText}
        </p>

        {/* Optional: show wallet coins */}
        <p className="mt-2 text-xs font-bold text-white/80">Wallet: 🪙 {coins}</p>
      </div>

      {/* Card */}
      <button
        type="button"
        onClick={handleOpenScratch}
        className="relative rounded-3xl overflow-hidden active:scale-[0.99] transition-transform"
        style={{
          width: WIDTH,
          height: HEIGHT,
          background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
          boxShadow:
            "0 20px 50px rgba(0,0,0,0.6), inset 0 0 20px rgba(255,255,255,0.10)",
        }}
      >
        {/* Shine sweep */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.22), transparent 70%)",
            transform: "translateX(-120%)",
            animation: "scratchShine 3.2s infinite",
          }}
        />

        {/* Reward behind scratch */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-yellow-200 tracking-widest">YOU WON</p>
          <div
            className="font-black text-3xl"
            style={{
              fontFamily: "'Fredoka One',cursive",
              background: "linear-gradient(#fff,#ffd700)",
              WebkitBackgroundClip: "text",
              color: "transparent",
              textShadow: "0 0 18px rgba(255,215,0,0.6)",
            }}
          >
            {rewardAmount == null ? "🪙 ???" : `🪙 ${rewardAmount}`}
          </div>

          <p className="mt-2 text-[11px] text-white/80 font-bold">
            {rewardAmount == null
              ? "Tap to start scratching ✨"
              : revealed
              ? "✅ Claimed!"
              : "Scratch to reveal your bonus"}
          </p>
        </div>

        {/* Scratch canvas layer */}
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="absolute inset-0"
          onMouseDown={() => (scratching.current = true)}
          onMouseUp={() => (scratching.current = false)}
          onMouseLeave={() => (scratching.current = false)}
          onMouseMove={handleMove}
          onTouchStart={() => (scratching.current = true)}
          onTouchEnd={() => (scratching.current = false)}
          onTouchMove={handleMove}
        />
      </button>

      {/* Button */}
{!canPlayFree && (
  <button
    type="button"
    onClick={() => setShowPay(true)}   // ✅ only open modal
    className="w-full rounded-2xl px-4 py-3 text-center transition-all hover:scale-[1.02] active:scale-[0.98]"
    style={{
      background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
      border: "1px solid rgba(255,255,255,0.15)",
      boxShadow: "0 0 12px rgba(124,58,237,0.4)",
    }}
  >
    <p className="text-xs font-bold text-white tracking-wide">
      💎 Pay 🪙{SCRATCH_COST} to Play Now
    </p>
  </button>
)}

      {/* Pay modal */}
      {showPay && (
        <ScratchPayModal
          coins={coins}
          cost={SCRATCH_COST}
          title="Pay to Scratch!"
          subtitle="Skip the 24h timer and claim bonus now"
          onPay={handlePayScratch}
          onClose={() => setShowPay(false)}
        />
      )}

      <style>{`
        @keyframes scratchShine {
          0%   { transform: translateX(-140%); opacity: 0.0; }
          10%  { opacity: 0.9; }
          100% { transform: translateX(140%); opacity: 0.0; }
        }
      `}</style>
    </div>
  );
}