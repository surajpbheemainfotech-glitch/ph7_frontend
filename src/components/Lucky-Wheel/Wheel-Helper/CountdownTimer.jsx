export default function CountdownTimer({ secondsLeft }) {
  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  const fmt = v => String(v).padStart(2, "0");
  const urgent = secondsLeft < 3600;

  return (
    <div className="flex flex-col items-center gap-1 px-5 py-3 rounded-2xl"
      style={{ background: "linear-gradient(135deg,#1a237e,#283593)",
        boxShadow: "0 4px 18px #00000044", border: "2px solid #3f51b5" }}>
      <span className="text-xs font-bold tracking-widest"
        style={{ color: "#7986cb", fontFamily: "'Nunito',sans-serif" }}>
        ⏱ NEXT FREE SPIN
      </span>
      <div className="flex items-center gap-1">
        {[fmt(h), fmt(m), fmt(s)].map((val, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-2xl font-black rounded-lg px-2 py-0.5"
              style={{ fontFamily: "'Fredoka One',cursive",
                color: urgent ? "#ff5252" : "#fff",
                background: urgent ? "#ff1744" : "#1565c0",
                minWidth: 42, textAlign: "center",
                transition: "all 0.3s" }}>
              {val}
            </span>
            {i < 2 && <span className="text-xl font-black" style={{ color: "#7986cb" }}>:</span>}
          </span>
        ))}
      </div>
    </div>
  );
}