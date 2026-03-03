import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PayToPlayModal({
  open,
  cost,
  coins,
  title = "Pay to Play!",
  subtitle = "Skip the 24h timer and play now",
  onPay,
  onAddMoney, // optional override
  onClose,
  loading = false,
  error = "",
}) {
  const navigate = useNavigate();

  const safeCoins = Number(coins) || 0;
  const safeCost = Number(cost) || 0;
  const canAfford = safeCoins >= safeCost;
  const deficit = Math.max(0, safeCost - safeCoins);

  // avoid SSR/hydration + portal safety
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !open) return null;

  const handlePay = () => {
    if (!canAfford || loading) return;
    onPay?.(safeCost);
  };

  const handleAddMoney = () => {
    if (typeof onAddMoney === "function") return onAddMoney();
    onClose?.();
    navigate("/purchase");
  };

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center pb-8 px-4"
      style={{ background: "#00000075", backdropFilter: "blur(10px)" }}
      onClick={loading ? undefined : onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-7"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(160deg,#fff,#f3f8ff)",
          border: "2px solid #e3f2fd",
          boxShadow: "0 -4px 40px #0000003a",
          animation: "slideUp 0.35s cubic-bezier(.22,.68,0,1.2) both",
        }}
      >
        <div className="text-center">
          <div className="text-3xl">🎰</div>

          <h3
            className="mt-2 text-2xl font-black"
            style={{ fontFamily: "'Fredoka One',cursive" }}
          >
            {title}
          </h3>

          <p className="mt-1 text-sm font-semibold text-black/70">{subtitle}</p>

          <div className="mt-4 rounded-2xl p-4 text-left bg-white/70 border border-black/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-black/70">Cost</span>
              <span className="text-lg font-black">🪙 {safeCost}</span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-bold text-black/70">Your coins</span>
              <span className="text-lg font-black">🪙 {safeCoins}</span>
            </div>
          </div>

          {!canAfford && (
            <p className="mt-3 text-xs font-bold text-red-600">
              Not enough coins. You need {deficit} more 🪙
            </p>
          )}

          {!!error && (
            <p className="mt-3 text-xs font-bold text-red-600">{error}</p>
          )}

          <button
            className="mt-5 w-full rounded-2xl py-3 font-black text-white disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
            onClick={handlePay}
            disabled={!canAfford || loading}
          >
            {loading ? "PROCESSING..." : `PAY & PLAY (🪙 ${safeCost})`}
          </button>

          {!canAfford && (
            <button
              className="mt-3 w-full rounded-2xl py-3 font-black text-white"
              style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)" }}
              onClick={handleAddMoney}
              disabled={loading}
            >
              ➕ Add Money
            </button>
          )}

          <button
            className="mt-3 w-full rounded-2xl py-3 font-black text-black/70 bg-black/5"
            onClick={onClose}
            disabled={loading}
          >
            CANCEL
          </button>
        </div>

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