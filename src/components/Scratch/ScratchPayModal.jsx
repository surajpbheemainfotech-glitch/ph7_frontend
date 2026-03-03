import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ScratchPayModal({
  coins = 0,
  cost = 0,
  title = "Pay to Scratch!",
  subtitle = "Skip the 24h timer and claim bonus now",
  onPay,       // ✅ parent should deduct from wallet (recommended)
  onAddMoney,  // ✅ optional: custom add money handler
  onClose,
}) {
  const navigate = useNavigate();

  const safeCoins = Number(coins) || 0;
  const safeCost = Number(cost) || 0;
  const canAfford = safeCoins >= safeCost;
  const deficit = Math.max(0, safeCost - safeCoins);

  // ✅ avoid SSR / hydration issues
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const handlePay = () => {
    if (!canAfford) return;
    onPay?.(safeCost); // ✅ pass cost so parent can deduct
  };

  const handleAddMoney = () => {
    // ✅ allow parent override
    if (typeof onAddMoney === "function") return onAddMoney();

    // ✅ default wallet behaviour
    onClose?.();
    navigate("/purchase");
  };

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center pb-8"
      style={{ background: "#00000075", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="rounded-3xl p-8 flex flex-col items-center gap-4 w-full max-w-sm mx-4"
        style={{
          background: "linear-gradient(160deg,#fff,#f3f8ff)",
          border: "2px solid #e3f2fd",
          boxShadow: "0 -4px 40px #0000003a",
          animation: "slideUp 0.35s cubic-bezier(.22,.68,0,1.2) both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl">🎟️</div>

        <h3
          className="text-2xl font-black text-center"
          style={{ fontFamily: "'Fredoka One',cursive", color: "#1a237e" }}
        >
          {title}
        </h3>

        <p className="text-sm font-bold text-center" style={{ color: "#5c6bc0" }}>
          {subtitle}
        </p>

        <div
          className="w-full rounded-2xl p-4 flex items-center justify-between"
          style={{ background: "#f8f9ff", border: "1.5px solid #e3f2fd" }}
        >
          <span
            className="text-sm font-bold"
            style={{ color: "#5c6bc0", fontFamily: "'Nunito',sans-serif" }}
          >
            Cost
          </span>

          <span
            className="text-xl font-black flex items-center gap-1"
            style={{ fontFamily: "'Fredoka One',cursive", color: "#e65100" }}
          >
            🪙 {safeCost}
          </span>
        </div>

        <div
          className="w-full rounded-2xl p-4 flex items-center justify-between"
          style={{
            background: canAfford ? "#e8f5e9" : "#fce4ec",
            border: `1.5px solid ${canAfford ? "#a5d6a7" : "#f48fb1"}`,
          }}
        >
          <span
            className="text-sm font-bold"
            style={{
              color: canAfford ? "#2e7d32" : "#c62828",
              fontFamily: "'Nunito',sans-serif",
            }}
          >
            Your balance
          </span>

          <span
            className="text-xl font-black"
            style={{
              fontFamily: "'Fredoka One',cursive",
              color: canAfford ? "#2e7d32" : "#c62828",
            }}
          >
            🪙 {safeCoins}
          </span>
        </div>

        {!canAfford && (
          <p className="text-sm text-center font-bold" style={{ color: "#e53935" }}>
            Not enough coins! You need {deficit} more 🪙
          </p>
        )}

        {/* ✅ Primary action */}
        <button
          type="button"
          disabled={!canAfford}
          onClick={handlePay}
          className="w-full py-4 rounded-2xl text-white text-xl font-black
            transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            fontFamily: "'Fredoka One',cursive",
            background: canAfford
              ? "linear-gradient(135deg,#ff7043,#f44336)"
              : "#bdbdbd",
            boxShadow: canAfford ? "0 6px 20px #f4433660" : "none",
            letterSpacing: 1,
          }}
        >
          {canAfford ? `🎯 Pay 🪙${safeCost}` : "Not Enough Coins"}
        </button>

        {/* ✅ If not enough, show Add Money (wallet top-up) */}
        {!canAfford && (
          <button
            type="button"
            onClick={handleAddMoney}
            className="w-full py-3 rounded-2xl text-white text-base font-black
              transition-all duration-150 active:scale-95"
            style={{
              fontFamily: "'Fredoka One',cursive",
              background: "linear-gradient(135deg,#10b981,#14b8a6)",
              boxShadow: "0 6px 18px #10b98155",
              letterSpacing: 0.6,
            }}
          >
            ➕ Add Money
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="text-sm font-bold py-2 px-6 rounded-full"
          style={{ color: "#9e9e9e", background: "#f5f5f5" }}
        >
          Cancel
        </button>

        <style>{`
          @keyframes slideUp {
            from { transform: translateY(60px); opacity: 0; }
            to   { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
