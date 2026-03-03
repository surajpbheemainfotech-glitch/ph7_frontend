export default function SpinHistory({ history }) {
  if (!history.length) return null;
  return (
    <div className="w-full max-w-xs">
      <p className="text-xs font-bold text-center mb-2 tracking-widest"
        style={{ color: "#5c6bc0", fontFamily: "'Nunito',sans-serif" }}>
        RECENT SPINS
      </p>
      <div className="flex gap-2 flex-wrap justify-center">
        {history.map((h, i) => (
          <span key={i}
            className="px-3 py-1 rounded-full text-sm font-black"
            style={{ fontFamily: "'Fredoka One',cursive",
              background: h.isLuck ? "#fff3e0" : "#e8f5e9",
              color: h.isLuck ? "#e65100" : "#2e7d32",
              border: `1.5px solid ${h.isLuck ? "#ffcc02" : "#a5d6a7"}` }}>
            {h.isLuck ? "😅 Luck" : h.label}
          </span>
        ))}
      </div>
    </div>
  );
}