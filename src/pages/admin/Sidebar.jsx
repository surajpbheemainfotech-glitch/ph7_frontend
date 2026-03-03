// src/pages/admin/Sidebar.jsx
import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { TbPackages } from "react-icons/tb";
import { GiReceiveMoney } from "react-icons/gi";
import {
  MdOutlinePostAdd,
  MdDashboard,
  MdChevronLeft,
  MdChevronRight,
} from "react-icons/md";

const menuItems = [
  { name: "Dashboard", path: "/admin/dashboard", icon: <MdDashboard className="h-6 w-6" /> },
  { name: "Pools", path: "/admin/pools", icon: <MdOutlinePostAdd className="h-6 w-6" /> },
  { name: "Packages", path: "/admin/packages", icon: <TbPackages className="h-6 w-6" /> },
  // { name: "Withdrawl", path: "/admin/withdrawl", icon: <GiReceiveMoney className="h-6 w-6" /> },
];

const Sidebar = ({ collapsed, setCollapsed }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-black text-[#F0B100] px-3 py-2 rounded-lg"
        onClick={() => setIsMobileOpen((v) => !v)}
        aria-label="Toggle sidebar"
      >
        ☰
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40
          h-dvh md:h-screen   /* ✅ KEY FIX */
          bg-[#50c2b4] text-black
          transition-transform duration-300
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          ${collapsed ? "md:w-20" : "md:w-64"}
          w-64
          flex flex-col       /* ✅ make it full-height layout */
        `}
      >
        {/* Mobile Close */}
        <div className="md:hidden flex justify-end p-3">
          <button
            className="bg-black/20 px-3 py-1 rounded"
            onClick={() => setIsMobileOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          className="hidden md:flex absolute -right-3 top-6 bg-[#ff9800] text-black rounded-full p-1 shadow-lg hover:scale-105 transition"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <MdChevronRight size={30} /> : <MdChevronLeft size={30} />}
        </button>

        {/* Logo */}
        <div className="h-[60px] flex items-center px-4 border-b border-black/20 shrink-0">
          <Link to="/admin/dashboard" className="flex items-center">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-wide">
              <span className="text-indigo-600">PH7</span>{" "}
              <span className="text-black">Loot</span>
            </h1>
          </Link>
        </div>

        {/* Menu (scrollable if needed) */}
        <nav className="mt-4 px-2 space-y-2 overflow-y-auto pb-6">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 font-semibold transition
                 ${isActive ? "bg-[#ff9800] text-black" : "text-black/80 hover:bg-[#ff9800] hover:text-black"}`
              }
            >
              {item.icon}
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;