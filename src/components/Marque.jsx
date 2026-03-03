import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../utils/axiosInstance";

/* 🔹 Static fallback winners */
const STATIC_WINNERS = [
  { brand: "Rahul Sharma", amount: 5000, position: 1 },
  { brand: "Priya Verma", amount: 3000, position: 2 },
  { brand: "Amit Kumar", amount: 2000, position: 3 },
];

export default function Marque({
  title = "Recent Winners",
  speed = 28,
  poolTitle = "megaWinner",
}) {
  const [items, setItems] = useState(STATIC_WINNERS);

  useEffect(() => {
    if (!poolTitle) {
      setItems(STATIC_WINNERS);
      return;
    }

    const fetchWinners = async () => {
      try {
        const res = await axiosInstance.get(
          `/pool/result/${encodeURIComponent(poolTitle)}`
        );

        const winners = res?.data?.data?.winners || [];

        const mapped = winners.map((w) => ({
          brand: `${w.first_name} ${w.last_name}`,
          amount: w.prize_amount,
          position: w.position,
        }));

        if (mapped.length > 0) {
          setItems(mapped);
        } else {
          setItems(STATIC_WINNERS);
        }

      } catch (err) {
        console.error("MARQUEE API ERROR:", err?.response || err);
        setItems(STATIC_WINNERS);
      }
    };

    fetchWinners();
  }, [poolTitle]);

  const loop = useMemo(() => [...items, ...items], [items]);

  return (
    <div className="w-full border-y border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-50">
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee linear infinite;
          animation-duration: ${speed}s;
        }
        .marquee:hover .marquee-track {
          animation-play-state: paused;
        }
      `}</style>

      <div className="marquee flex items-center overflow-hidden">
        {/* Left Label */}
        <div className="shrink-0 px-5 py-3 font-extrabold text-emerald-700 bg-white/80 backdrop-blur-md border-r border-emerald-200 tracking-wide">
          🏆 {title}
        </div>

        {/* Scrolling Area */}
        <div className="relative flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-emerald-50 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-emerald-50 to-transparent z-10" />

          <div className="marquee-track flex w-[200%]">
            <div className="flex w-1/2">
              {loop.map((x, i) => (
                <Winner key={i} {...x} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 🔹 Winner Card */
function Winner({ brand, amount, position }) {
  const initials = (brand || "U")
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const badgeColor =
    position === 1
      ? "bg-yellow-500"
      : position === 2
      ? "bg-slate-400"
      : "bg-amber-600";

  return (
    <div className="px-3 py-3">
      <div className="flex items-center gap-4 rounded-full bg-white/80 backdrop-blur-md border border-emerald-200 shadow-md hover:shadow-lg transition-shadow px-5 py-3">
        
        {/* Avatar */}
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white grid place-items-center text-sm font-extrabold shadow">
          {initials}
        </div>

        {/* Text */}
        <div className="whitespace-nowrap leading-tight">
          <div className="font-semibold text-slate-800 text-sm">
            {brand}
          </div>
          <div className="text-sm font-extrabold text-emerald-600 tracking-wide">
            ₹ {amount}
          </div>
        </div>

        {/* Position Badge */}
        <span
          className={`ml-2 text-[10px] font-bold text-white px-2 py-1 rounded-full ${badgeColor}`}
        >
          #{position}
        </span>
      </div>
    </div>
  );
}
