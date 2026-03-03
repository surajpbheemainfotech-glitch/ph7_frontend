export default function WinPopup({ winner, apiStatus, onClose, coinsEarned }) {
  if (!winner) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "#00000065", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div
        className="rounded-3xl px-10 py-8 flex flex-col items-center gap-3 shadow-2xl"
        style={{ minWidth: 280, maxWidth: 340,
          background: winner.isLuck
            ? "linear-gradient(135deg,#fffde7,#ffffff)"
            : "linear-gradient(135deg,#e8f5e9,#ffffff)",
          border: `3px solid ${winner.isLuck ? "#FFC107" : "#4CAF50"}`,
          animation: "popIn 0.4s cubic-bezier(.22,.68,0,1.2) both" }}
        onClick={e => e.stopPropagation()}>

        <div className="text-5xl">{winner.isLuck ? "😅🍀" : "🎉🏆🎉"}</div>

        <h2 className="text-3xl font-black"
          style={{ fontFamily: "'Fredoka One',cursive", color: "#1a1a1a" }}>
          {winner.isLuck ? "Oops!" : "You Won!"}
        </h2>

        {winner.isLuck ? (
          <p className="text-base font-bold text-center" style={{ color: "#9e9e9e" }}>
            Better Luck Next Time!
          </p>
        ) : (
          <>
            <p className="text-5xl font-black"
              style={{ fontFamily: "'Fredoka One',cursive", color: "#2e7d32" }}>
              {winner.label}
            </p>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: "#fff8e1", border: "1.5px solid #FFD600" }}>
              <span className="text-sm font-bold" style={{ color: "#f57f17" }}>
                🪙 +{winner.amount} coins added!
              </span>
            </div>
          </>
        )}

        {apiStatus && (
          <span className={`px-4 py-1 rounded-full text-sm font-bold
            ${apiStatus === "success" ? "bg-green-100 text-green-800"
              : apiStatus === "error" ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600"}`}>
            {apiStatus === "sending" && "⏳ Recording result…"}
            {apiStatus === "success" && "✅ Saved to backend!"}
            {apiStatus === "error"   && "❌ Backend error"}
          </span>
        )}

        <button onClick={onClose}
          className="mt-2 px-10 py-3 rounded-full text-white text-lg font-black
            active:scale-95 transition-transform duration-100"
          style={{ fontFamily: "'Fredoka One',cursive", letterSpacing: 1,
            background: "linear-gradient(135deg,#ff7043,#f44336)",
            boxShadow: "0 4px 18px #f4433666" }}>
          SPIN AGAIN
        </button>
      </div>
    </div>
  );
}