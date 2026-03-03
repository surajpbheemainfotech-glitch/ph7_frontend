export default function SpinButton({ spinning, onClick, size = 92 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={spinning}
      className="spin-btn absolute z-30 grid place-items-center rounded-full active:scale-95 transition-transform duration-100"
      style={{
        width: size,
        height: size,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "radial-gradient(circle at 30% 25%, #ff8a80 0%, #d32f2f 45%, #8b0000 100%)",
        border: "6px solid #FFD600",
      }}
    >
      <span
        style={{
          fontFamily: "'Fredoka One',cursive",
          color: "white",
          fontSize: Math.max(14, Math.round(size * 0.24)),
          letterSpacing: "0.12em",
          textShadow: "0 3px 0 rgba(0,0,0,0.35)",
        }}
      >
        {spinning ? "..." : "SPIN"}
      </span>
    </button>
  );
}
