// src/pages/admin/AdminDashboard.jsx
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard"; // ✅ use correct spelling

const AdminDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
<div className="min-h-dvh md:min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main */}
      <main
        className={`
          min-h-screen transition-all duration-300
          md:${collapsed ? "ml-20" : "ml-64"}
          ml-0
        `}
      >
        {/* ✅ top padding so content doesn't sit under mobile hamburger */}
        <div className="pt-16 md:pt-6 px-4 sm:px-6 lg:px-8">
          <Dashboard />
          {/* if you use nested routes, replace Dashboard with <Outlet /> */}
          {/* <Outlet /> */}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;