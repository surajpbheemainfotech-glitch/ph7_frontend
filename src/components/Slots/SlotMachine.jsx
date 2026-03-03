import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";
import PayToPlayModal from "./PayToPlayModal";
import { createPortal } from "react-dom";

/** ✅ 24 hours in ms */
const DAY_MS = 24 * 60 * 60 * 1000;
/** ✅ FIX: remove spaces */
const LS_KEY = "slot_last_played_at";

const SYMBOLS = ["7", "BAR", "🍒", "🔔", "💎", "🍋"];
const PAYTABLE = {
  "7": 10,
  BAR: 6,
  "💎": 5,
  "🔔": 4,
  "🍒": 3,
  "🍋": 2,
};

function randSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function calcWin([a, b, c], bet) {
  if (a === b && b === c) return (PAYTABLE[a] || 1) * bet;
  if (a === b || b === c || a === c) return Math.max(1, Math.floor(bet * 0.5));
  return 0;
}

function msToHMS(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
}

export default function SlotMachine({ bet = 20 }) {
  const { user, wallet, updateWallet } = useAuth();

  const [reels, setReels] = useState([randSymbol(), randSymbol(), randSymbol()]);
  const [spinning, setSpinning] = useState(false);

  const [winOpen, setWinOpen] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [winStatus, setWinStatus] = useState("idle"); // syncing | success | failed

  // ✅ pay modal state
  const [payOpen, setPayOpen] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");

  // ✅ cooldown
  const [timeLeft, setTimeLeft] = useState(0);
  const canPlayFree = timeLeft <= 0;

  const isLoggedIn = !!localStorage.getItem("user_token");
  const walletCash = isLoggedIn ? Number(wallet?.cash ?? 0) : 0;
  const walletBonus = isLoggedIn ? Number(wallet?.bonus ?? 0) : 0;
  const coins = walletCash + walletBonus;

  const title = useMemo(() => "SLOT MACHINE", []);

  // ✅ resolve userId
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

  const WALLET_AMOUNT_KEY = "amount"; // change to "amout" if backend expects that

  async function syncWalletToBackend(nextWallet) {
    if (!userId) return false;

    const totalAmount =
      Number(nextWallet?.cash ?? 0) + Number(nextWallet?.bonus ?? 0);

    try {
      await axiosInstance.post("/user/user-wallet-update", {
        userId,
        [WALLET_AMOUNT_KEY]: totalAmount,
      });
      return true;
    } catch (err) {
      console.log("❌ wallet sync failed:", err?.response?.data || err?.message);
      return false;
    }
  }

  /** ✅ init cooldown from localStorage */
  useEffect(() => {
    const last = Number(localStorage.getItem(LS_KEY) || 0);
    const left = last ? Math.max(0, DAY_MS - (Date.now() - last)) : 0;
    setTimeLeft(left);
  }, []);

  /** ✅ tick cooldown */
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => {
      const last = Number(localStorage.getItem(LS_KEY) || 0);
      const left = last ? Math.max(0, DAY_MS - (Date.now() - last)) : 0;
      setTimeLeft(left);
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  /** ✅ start cooldown now */
  const markPlayedNow = () => {
    localStorage.setItem(LS_KEY, String(Date.now()));
    setTimeLeft(DAY_MS);
  };

  /** ✅ deduct bet (cash first then bonus) backend-first */
  async function deductBet(cost) {
    const cash = Number(wallet?.cash ?? 0);
    const bonus = Number(wallet?.bonus ?? 0);

    let remaining = Number(cost || 0);

    const takeCash = Math.min(cash, remaining);
    remaining -= takeCash;

    const takeBonus = Math.min(bonus, remaining);
    remaining -= takeBonus;

    if (remaining > 0) return { ok: false, reason: "INSUFFICIENT" };

    const nextWallet = {
      ...wallet,
      cash: cash - takeCash,
      bonus: bonus - takeBonus,
    };

    const ok = await syncWalletToBackend(nextWallet);
    if (!ok) return { ok: false, reason: "BACKEND_FAIL" };

    updateWallet(nextWallet);
    return { ok: true };
  }

  /** ✅ add win to cash backend-first */
  async function addWin(win) {
    const nextWallet = {
      ...wallet,
      cash: Number(wallet?.cash ?? 0) + Number(win || 0),
    };

    const ok = await syncWalletToBackend(nextWallet);
    if (!ok) return { ok: false };

    updateWallet(nextWallet);
    return { ok: true };
  }

  /** ✅ core spin runner */
  function runSpin() {
    setSpinning(true);

    let ticks = 0;
    const timer = setInterval(() => {
      ticks++;
      setReels([randSymbol(), randSymbol(), randSymbol()]);
      if (ticks >= 16) {
        clearInterval(timer);
        finishSpin();
      }
    }, 80);

    async function finishSpin() {
      const final = [randSymbol(), randSymbol(), randSymbol()];
      setReels(final);

      const win = calcWin(final, bet);

      if (win > 0) {
        setWinAmount(win);
        setWinStatus("syncing");
        setWinOpen(true);

        const credited = await addWin(win);
        setWinStatus(credited.ok ? "success" : "failed");
      }

      setSpinning(false);
    }
  }

  /** ✅ click spin */
  const handleSpinClick = () => {
    if (spinning) return;

    if (!isLoggedIn) {
      alert("Please login to play");
      return;
    }

    if (!userId) {
      alert("User ID missing. Please login again.");
      return;
    }

    setPayError("");

    if (canPlayFree) {
      markPlayedNow();
      runSpin();
      return;
    }

    setPayOpen(true);
  };

  /** ✅ pay-to-play now */
  const handlePayToPlay = async (cost) => {
    setPayError("");
    setPayLoading(true);

    const paid = await deductBet(cost);
    if (!paid.ok) {
      setPayLoading(false);
      setPayError(
        paid.reason === "INSUFFICIENT" ? "Not enough coins." : "Wallet update failed."
      );
      return;
    }

    markPlayedNow();

    setPayLoading(false);
    setPayOpen(false);
    runSpin();
  };

  const statusText = useMemo(() => {
    if (!isLoggedIn) return "🔒 Login to play";
    if (canPlayFree) return "🎁 Free spin available";
    return `⏳ Next free spin in ${msToHMS(timeLeft)}`;
  }, [isLoggedIn, canPlayFree, timeLeft]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* outer glow */}
      <div
        className="absolute -inset-1 rounded-[28px] blur-xl opacity-60 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(255,215,0,0.35), transparent 45%), radial-gradient(circle at bottom right, rgba(124,58,237,0.45), transparent 45%)",
        }}
      />

      <div
        className="relative rounded-[28px] p-5 flex flex-col items-center gap-4 select-none overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, rgba(15,0,37,0.72), rgba(26,0,53,0.72))",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(18px)",
          boxShadow: "0 16px 70px rgba(0,0,0,0.55)",
        }}
      >
        {/* Shine sweep */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.10), transparent 70%)",
            transform: "translateX(-120%)",
            animation: "slotShine 3.2s infinite",
          }}
        />

        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
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
              {title}
            </h2>
          </div>

          <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
            <span
              className="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-[0.22em]"
              style={{
                fontFamily: "'Orbitron',sans-serif",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#c4b5fd",
              }}
            >
              BET • 🪙 {bet}
            </span>

            <span
              className="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-[0.22em]"
              style={{
                fontFamily: "'Orbitron',sans-serif",
                background: canPlayFree ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
                border: `1px solid ${canPlayFree ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`,
                color: canPlayFree ? "#4ade80" : "#f87171",
              }}
            >
              {statusText}
            </span>

            <span
              className="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-[0.22em]"
              style={{
                fontFamily: "'Orbitron',sans-serif",
                background: "rgba(255,215,0,0.12)",
                border: "1px solid rgba(255,215,0,0.20)",
                color: "#FFD700",
              }}
            >
              WALLET • 🪙 {coins}
            </span>
          </div>
        </div>

        {/* Reels Panel */}
        <div
          className="w-full rounded-3xl p-4"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
          }}
        >
          <div className="flex items-center justify-center gap-3">
            {reels.map((s, i) => (
              <div
                key={i}
                className={`relative w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black ${
                  spinning ? "slot-bounce" : ""
                }`}
                style={{
                  background: "linear-gradient(180deg,#ffffff,#eaeaea)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow:
                    "0 14px 30px rgba(0,0,0,0.35), inset 0 0 14px rgba(255,255,255,0.50)",
                }}
              >
                {/* inner shine */}
                <div
                  className="absolute inset-1 rounded-xl pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.65), rgba(255,255,255,0.0) 55%)",
                    opacity: 0.55,
                  }}
                />
                <span className="relative">{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <button
          type="button"
          disabled={spinning}
          onClick={handleSpinClick}
          className="w-full rounded-2xl py-3.5 font-black text-white transition active:scale-[0.99] disabled:opacity-60"
          style={{
            fontFamily: "'Fredoka One',cursive",
            background: canPlayFree
              ? "linear-gradient(135deg,#10b981,#14b8a6)"
              : "linear-gradient(135deg,#7c3aed,#4f46e5)",
            boxShadow: canPlayFree
              ? "0 0 18px rgba(20,184,166,0.35)"
              : "0 0 18px rgba(124,58,237,0.35)",
            letterSpacing: 1,
          }}
        >
          {spinning
            ? "SPINNING..."
            : canPlayFree
            ? "🎁 FREE SPIN"
            : `💎 Pay 🪙 ${bet} to Play Now`}
        </button>

        {/* Pay modal */}
        <PayToPlayModal
          open={payOpen}
          cost={bet}
          coins={coins}
          title="Pay to Play!"
          subtitle="Skip the 24h timer and play now"
          loading={payLoading}
          error={payError}
          onPay={handlePayToPlay}
          onClose={() => (payLoading ? null : setPayOpen(false))}
        />

        {/* Win overlay */}
{winOpen &&
  createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center px-4"
      style={{
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      onClick={() => setWinOpen(false)}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-7 text-center"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(160deg,#12002d,#070014)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 30px 90px rgba(0,0,0,0.75)",
          animation: "winPop 0.25s ease-out both",
        }}
      >
        <div className="text-5xl">🎉</div>

        <h3
          className="mt-2 text-2xl font-black"
          style={{
            fontFamily: "'Fredoka One',cursive",
            color: "#FFD700",
            textShadow: "0 0 18px rgba(255,215,0,0.8)",
          }}
        >
          YOU WON!
        </h3>

        <div
          className="mt-3 text-5xl font-black"
          style={{
            fontFamily: "'Fredoka One',cursive",
            background: "linear-gradient(#fff,#ffd700)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          🪙 {winAmount}
        </div>

        <p className="mt-3 text-xs font-bold text-white/80">
          {winStatus === "syncing" && "Adding to wallet..."}
          {winStatus === "success" && "✅ Added to wallet"}
          {winStatus === "failed" && "❌ Wallet update failed"}
        </p>

        <button
          className="mt-6 w-full rounded-2xl py-3 font-black text-white disabled:opacity-60"
          style={{
            fontFamily: "'Fredoka One',cursive",
            background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
            boxShadow: "0 0 18px rgba(124,58,237,0.35)",
          }}
          onClick={() => setWinOpen(false)}
          disabled={winStatus === "syncing"}
        >
          Close
        </button>

        <style>{`
          @keyframes winPop {
            from { transform: scale(0.92) translateY(20px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    </div>,
    document.body
  )}
        <style>{`
          @keyframes slotShine {
            0%   { transform: translateX(-140%); opacity: 0.0; }
            10%  { opacity: 0.9; }
            100% { transform: translateX(140%); opacity: 0.0; }
          }
          @keyframes slotBounce {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-2px); }
            100% { transform: translateY(0px); }
          }
          .slot-bounce { animation: slotBounce 0.18s infinite linear; }
        `}</style>
      </div>
    </div>
  );
}