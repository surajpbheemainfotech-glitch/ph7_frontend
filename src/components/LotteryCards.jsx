import React, { useEffect, useState } from "react";
import { AiOutlineClockCircle } from "react-icons/ai";
import { MdCurrencyRupee } from "react-icons/md";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
// import ResultModel from "../components/UserProfiles/ResultModel"; 


/* ---------- helper: countdown ---------- */
const getTimeLeft = (date) => {
  if (!date) return "-";

  const diff = new Date(date) - new Date();
  if (diff <= 0) return "Expired";

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);

  return `${d}d : ${h}h : ${m}m : ${s}s`;
};

const isExpired = (date) => {
  if (!date) return false;
  return new Date(date) <= new Date();
};

const baseURL = import.meta.env.VITE_API_BASE_URL;

/* ---------- SKELETON ---------- */
const TicketSkeleton = () => (
  <div className="rounded bg-white shadow p-1.5 animate-pulse">
    <div className="h-12 bg-gray-200 rounded mb-1.5" />
    <div className="space-y-1">
      <div className="h-4 w-24 bg-gray-200 rounded" />
      <div className="h-3 w-32 bg-gray-200 rounded" />
    </div>
  </div>
);

/* ---------- MAIN ---------- */
const LotteryCards = () => {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch { }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/pool");
      if (!res.data?.success) throw new Error();

      const apiTickets = res.data.data.map((t) => ({
        id: t.id,
        title: t.title,
        price: t.price,
        jackpot: t.jackpot,
        expiredAt: t.expire_at,
        imageUrl: t.Imageurl ? `${baseURL}${t.Imageurl}` : "",
      }));

      console.log(apiTickets.imageUrl)
      setTickets(apiTickets);
    } catch {
      console.error("Fetch error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handlePlayNow = (id) => {
    if (!user) return navigate("/login");
    navigate("/playnow", { state: { ticketId: id } });
  };

  const activeTickets = tickets.filter(
    (item) => !isExpired(item.expiredAt)
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <TicketSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeTickets.map((item) => (
          <div
            key={item.id}
            className="group rounded bg-white shadow
                       hover:shadow-md transition overflow-hidden"
          >
            {/* STRIP */}
            <div className="h-[2px] bg-gradient-to-r from-fuchsia-500 via-orange-400 to-yellow-400" />

            <div className="p-1.5">
              {/* IMAGE */}
              <div className="h-12 w-full rounded overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-100 text-xs text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* TITLE */}
              <div className="mt-1.5 flex justify-between items-center">
                <h3 className="text-base font-bold text-gray-900 truncate">
                  {item.title}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full
                                 bg-emerald-100 text-emerald-700 font-bold">
                  LIVE
                </span>
              </div>

              {/* INFO */}
              <div className="mt-1.5 rounded bg-gray-50 p-2 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Jackpot</span>
                  <span className="text-lg font-extrabold text-green-600">
                    ₹{Number(item.jackpot).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <AiOutlineClockCircle size={14} />
                    Time
                  </span>
                  <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 rounded">
                    {getTimeLeft(item.expiredAt)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <MdCurrencyRupee size={14} />
                    Entry
                  </span>
                  <span className="text-sm font-bold text-gray-800">
                    ₹{Number(item.price).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex justify-between items-center mt-1.5">
                <Link
                  to="/"
                  className="text-sm font-bold text-indigo-600"
                >
                  About →
                </Link>
                <button
                  onClick={() => handlePlayNow(item.id)}
                  className="w-24 px-3 py-1 text-sm font-bold text-white rounded-full
             bg-gradient-to-r from-orange-500 to-pink-500
             hover:scale-105 transition"
                >
                  {user ? "Play" : "Login"}
                </button>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LotteryCards;