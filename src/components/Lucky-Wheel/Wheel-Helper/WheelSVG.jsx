const SLICES = [
  { label: "🪙 10", amount: 10, color: "#FF7B2C", isLuck: false },
  { label: "🪙 50", amount: 50, color: "#9B59B6", isLuck: false },
  { label: "Better\nLuck!", amount: 0, color: "#F1C40F", isLuck: true },
  { label: "🪙 30", amount: 30, color: "#1ABC9C", isLuck: false },
  { label: "Better\nLuck!", amount: 0, color: "#E91E6C", isLuck: true },
  { label: "🪙 50", amount: 50, color: "#E74C3C", isLuck: false },
  { label: "Better\nLuck!", amount: 0, color: "#E91E8C", isLuck: true },
];

function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function wedge(cx, cy, r, s, e) {
  const p1 = polar(cx, cy, r, s);
  const p2 = polar(cx, cy, r, e);
  return `M${cx},${cy} L${p1.x},${p1.y} A${r},${r} 0 0 1 ${p2.x},${p2.y} Z`;
}

const TOTAL = SLICES.length;
const SLICE_DEG = 360 / TOTAL;
const BULB_COUNT = 28;

export default function WheelSVG({ rotation, bulbOn, size = 360 }) {
  // ---- responsive geometry (based on size) ----
  // viewBox is square, wheel centered
  const VB = 440; // keep your original viewBox for consistent drawing
  const scale = size / VB;

  const CX = 220;
  const CY = 220;

  // shrink radii a bit vs original (original R=182)
  const R = 160; // ✅ smaller wheel
  const HUB = 50;

  const bulbs = Array.from({ length: BULB_COUNT }, (_, i) =>
    polar(CX, CY, R + 20, (i / BULB_COUNT) * 360)
  );

  // font sizes scaled down to match smaller wheel
  const fontMoney = 18;
  const fontLuck = 12;
  const emojiSize = 14;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 440 440"
      className="absolute inset-0"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        // makes sure it doesn't clip if your wrapper is tight
        overflow: "visible",
      }}
    >
      <defs>
        <radialGradient id="goldRim" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#FFF9C4" />
          <stop offset="40%" stopColor="#FFD600" />
          <stop offset="75%" stopColor="#FFA000" />
          <stop offset="100%" stopColor="#FF6F00" />
        </radialGradient>
        <radialGradient id="bulbLit" cx="40%" cy="30%">
          <stop offset="0%" stopColor="#FFFDE7" />
          <stop offset="55%" stopColor="#FFD600" />
          <stop offset="100%" stopColor="#FF8F00" />
        </radialGradient>
        <radialGradient id="bulbDim" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FFF8DC" />
          <stop offset="100%" stopColor="#C8A84B" />
        </radialGradient>
        <radialGradient id="hubGrad" cx="38%" cy="28%">
          <stop offset="0%" stopColor="#FFF9C4" />
          <stop offset="60%" stopColor="#FFD600" />
          <stop offset="100%" stopColor="#FF8F00" />
        </radialGradient>
      </defs>

      {/* Rim (smaller) */}
      <circle cx={CX} cy={CY} r={R + 30} fill="url(#goldRim)" />
      <circle cx={CX} cy={CY} r={R + 6} fill="#8B6914" />

      <g
        style={{
          transform: `rotate(${rotation}deg)`,
          transformOrigin: `${CX}px ${CY}px`,
        }}
      >
        {SLICES.map((sl, i) => {
          const s = i * SLICE_DEG;
          const e = s + SLICE_DEG;
          const mid = s + SLICE_DEG / 2;
          const tp = polar(CX, CY, R * 0.66, mid);
          const ang = mid - 90;

          return (
            <g key={i}>
              <path
                d={wedge(CX, CY, R, s, e)}
                fill={sl.color}
                stroke="#fff"
                strokeWidth="2.2"
              />
              <path
                d={wedge(CX, CY, R * 0.97, s + 1, e - 1)}
                fill="none"
                stroke="#ffffff28"
                strokeWidth="1.8"
              />

              {sl.isLuck ? (
                <>
                  <text
                    x={tp.x}
                    y={tp.y - 8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${ang},${tp.x},${tp.y - 8})`}
                    style={{
                      fontSize: fontLuck,
                      fontFamily: "'Fredoka One',cursive",
                      fill: "#fff",
                      stroke: "#0005",
                      strokeWidth: 3,
                      paintOrder: "stroke",
                    }}
                  >
                    Better
                  </text>
                  <text
                    x={tp.x}
                    y={tp.y + 8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${ang},${tp.x},${tp.y + 8})`}
                    style={{
                      fontSize: fontLuck,
                      fontFamily: "'Fredoka One',cursive",
                      fill: "#fff",
                      stroke: "#0005",
                      strokeWidth: 3,
                      paintOrder: "stroke",
                    }}
                  >
                    Luck!
                  </text>
                  <text
                    x={tp.x}
                    y={tp.y + 26}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${ang},${tp.x},${tp.y + 26})`}
                    style={{ fontSize: emojiSize }}
                  >
                
                  </text>
                </>
              ) : (
                <text
                  x={tp.x}
                  y={tp.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${ang},${tp.x},${tp.y})`}
                  style={{
                    fontSize: fontMoney,
                    fontFamily: "'Fredoka One',cursive",
                    fill: "#fff",
                    stroke: "#0006",
                    strokeWidth: 4,
                    paintOrder: "stroke",
                  }}
                >
                  {sl.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Slice lines */}
        {SLICES.map((_, i) => {
          const a = i * SLICE_DEG;
          const p1 = polar(CX, CY, HUB + 3, a);
          const p2 = polar(CX, CY, R, a);
          return (
            <line
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#fff"
              strokeWidth="2.2"
            />
          );
        })}
      </g>

      <circle
        cx={CX}
        cy={CY}
        r={R + 4}
        fill="none"
        stroke="url(#hubGrad)"
        strokeWidth="6"
      />

      {/* Bulbs */}
      {bulbs.map((b, i) => {
        const lit = i % 2 === (bulbOn ? 0 : 1);
        return (
          <circle
            key={i}
            cx={b.x}
            cy={b.y}
            r={6.8}
            fill={lit ? "url(#bulbLit)" : "url(#bulbDim)"}
            stroke="#9a7209"
            strokeWidth="1.1"
            style={{ filter: lit ? "drop-shadow(0 0 5px #FFD600)" : "none" }}
          />
        );
      })}

      {/* Hub */}
      <circle
        cx={CX}
        cy={CY}
        r={HUB + 12}
        fill="url(#hubGrad)"
        stroke="#8B6914"
        strokeWidth="3.2"
      />
      <circle cx={CX} cy={CY} r={HUB + 6} fill="#FFA000" />
    </svg>
  );
}
