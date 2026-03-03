// src/components/Navbar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiMenu, FiX, FiUser, FiLogOut } from "react-icons/fi";
import WalletDropdown from "./WalletDropdown";
import logoImg from '../assets/images/logo.png'

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState(null);

  const profileRef = useRef(null);

  /* ✅ Put your backend base url here */

  const API_BASE = import.meta.env.VITE_API_BASE || "";

  const normalizeAvatar = (avatar) => {
    if (!avatar) return null;
    if (/^https?:\/\//i.test(avatar)) return avatar;
    if (!API_BASE) return avatar; // avoid crash if API_BASE not set
    if (avatar.startsWith("/")) return `${API_BASE}${avatar}`;
    return `${API_BASE}/${avatar}`;
  };

  /* 🔐 LOAD AUTH (single source of truth) */
  const loadAuth = () => {
    const token = localStorage.getItem("user_token");
    const data = localStorage.getItem("user");

    if (token && data) {
      setIsAuth(true);
      try {
        setUser(JSON.parse(data));
      } catch {
        setUser(null);
      }
    } else {
      setIsAuth(false);
      setUser(null);
    }
  };

  /* ✅ Run once on mount */
  useEffect(() => {
    loadAuth();
  }, []);

  /* ✅ Listen to authChanged event */
  useEffect(() => {
    const handler = () => loadAuth();
    window.addEventListener("authChanged", handler);
    return () => window.removeEventListener("authChanged", handler);
  }, []);

  /* ✅ UI cleanup */
  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  /* ✅ close profile dropdown when clicking outside */
  useEffect(() => {
    const onDown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const logout = () => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user");
    localStorage.removeItem("admin_user");
    window.dispatchEvent(new Event("authChanged"));
    navigate("/login", { replace: true });
  };

  const displayName = useMemo(
    () => `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "User",
    [user],
  );

  const firstName = useMemo(() => {
    const n = user?.first_name || displayName.split(" ")[0] || "User";
    return n.trim() || "User";
  }, [user, displayName]);

  const displayEmail = useMemo(() => user?.email || "", [user]);
  const avatarUrl = useMemo(() => normalizeAvatar(user?.avatar), [user]);

  // ✅ Balance
  const walletBalance = useMemo(() => {
    const raw = user?.wallet_balance ?? user?.balance ?? user?.wallet ?? 0;
    const num = Number(raw);
    return Number.isFinite(num) ? num : 0;
  }, [user]);

  // ✅ Bonus
  const walletBonus = useMemo(() => {
    const raw = user?.wallet_bonus ?? user?.bonus_balance ?? user?.bonus ?? 0;
    const num = Number(raw);
    return Number.isFinite(num) ? num : 0;
  }, [user]);

  const totalAmount = walletBalance + walletBonus;
  const formatINR = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-8">
        <div className="h-20 sm:h-[70px] flex items-center justify-between gap-3">
          {/* LOGO */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-2xl sm:text-2xl font-extrabold tracking-tight"
          >

            <img src={logoImg} alt="logo" className="h-12" />
          </button>

          {/* DESKTOP RIGHT */}
          <div className="hidden md:flex items-center gap-4 relative">
            {!isAuth ? (
              <>
                <button
                  onClick={() => navigate("/register")}
                  className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-b from-orange-300 to-orange-600 hover:opacity-95 active:scale-[0.99] transition"
                >
                  REGISTER
                </button>

                <button
                  onClick={() => navigate("/login")}
                  className="px-5 py-2 rounded-full text-sm font-semibold text-teal-500 border-2 border-teal-400 hover:bg-teal-400 hover:text-white transition"
                >
                  LOG IN
                </button>
              </>
            ) : (
              <div className="relative flex items-center gap-3">
                <p className="text-sm font-semibold text-slate-800 hidden lg:block">
                  Hey, <span className="text-teal-600">{firstName}</span>
                </p>

                {/* ✅ Wallet */}
                <WalletDropdown
                  totalAmount={totalAmount}
                  walletBalance={walletBalance}
                  walletBonus={walletBonus}
                  formatINR={formatINR}
                  onOpenChange={() => setProfileOpen(false)}
                />

                {/* Profile */}
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((p) => !p)}
                    className="flex items-center gap-3 rounded-2xl px-2.5 py-2 hover:bg-slate-100 transition max-w-[280px]"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="avatar"
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-teal-500 grid place-items-center text-white">
                        <FiUser />
                      </div>
                    )}

                    <div className="min-w-0 text-left">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {displayEmail}
                      </p>
                    </div>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-14 w-48 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 overflow-hidden">
                      <button
                        onClick={() => navigate("/profile")}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50"
                      >
                        Profile
                      </button>

                      <button
                        onClick={logout}
                        className="w-full px-4 py-3 text-left text-sm text-rose-600 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <FiLogOut /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* MOBILE RIGHT (✅ includes wallet) */}
          <div className="md:hidden flex items-center gap-2">
            {isAuth ? (
              <>
                {/* ✅ Wallet shown on mobile too */}
                <WalletDropdown
                  totalAmount={totalAmount}
                  walletBalance={walletBalance}
                  walletBonus={walletBonus}
                  formatINR={formatINR}
                  onOpenChange={() => setProfileOpen(false)}
                />

                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="h-10 w-10 rounded-2xl grid place-items-center bg-slate-100 ring-1 ring-slate-200"
                  aria-label="Open menu"
                >
                  {menuOpen ? (
                    <FiX className="text-xl" />
                  ) : (
                    <FiMenu className="text-xl" />
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="h-10 w-10 rounded-2xl grid place-items-center bg-slate-100 ring-1 ring-slate-200"
                aria-label="Open menu"
              >
                {menuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
              </button>
            )}
          </div>
        </div>

        {/* MOBILE MENU */}
        <div
          className={[
            "md:hidden overflow-hidden transition-all duration-200",
            menuOpen ? "max-h-[520px] pb-4" : "max-h-0",
          ].join(" ")}
        >
          <div className="pt-2">
            {!isAuth ? (
              <div className="grid gap-2">
                <button
                  onClick={() => navigate("/register")}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-b from-orange-300 to-orange-600"
                >
                  REGISTER
                </button>

                <button
                  onClick={() => navigate("/login")}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold text-teal-600 border border-teal-300 hover:bg-teal-50 transition"
                >
                  LOG IN
                </button>
              </div>
            ) : (
              <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-3">
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-teal-500 grid place-items-center text-white">
                      <FiUser />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {displayEmail}
                    </p>
                  </div>
                </div>

                {/* quick wallet preview (nice even if dropdown exists) */}
                {/* <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-3">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Total
                    </p>
                    <p className="text-sm font-extrabold text-slate-900">
                      {formatINR(totalAmount)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-3">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Cash
                    </p>
                    <p className="text-sm font-extrabold text-slate-900">
                      {formatINR(walletBalance)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-3">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Bonus
                    </p>
                    <p className="text-sm font-extrabold text-slate-900">
                      {formatINR(walletBonus)}
                    </p>
                  </div>
                </div> */}

                <div className="mt-3 grid gap-2">
                  <button
                    onClick={() => navigate("/profile")}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 transition"
                  >
                    Profile
                  </button>

                  <button
                    onClick={logout}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold text-rose-600 bg-rose-50 ring-1 ring-rose-200 hover:bg-rose-100 transition flex items-center justify-center gap-2"
                  >
                    <FiLogOut /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
