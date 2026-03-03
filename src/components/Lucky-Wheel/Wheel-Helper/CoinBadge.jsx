export default function CoinBadge({ coins }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl"
      style={{ background: "linear-gradient(135deg,#fff8e1,#fffde7)", border: "2px solid #FFD600",
        boxShadow: "0 4px 14px #FFD60033", fontFamily: "'Fredoka One',cursive" }}>
      <span className="text-2xl">🪙</span>
      <div className="flex flex-col leading-none">
        <span className="text-xs font-bold" style={{ color: "#9e6b00" }}>YOUR COINS</span>
        <span className="text-2xl font-black" style={{ color: "#e65100" }}>{coins}</span>
      </div>
    </div>
  );
}