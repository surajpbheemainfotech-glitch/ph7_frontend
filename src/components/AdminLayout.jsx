import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../pages/admin/Sidebar";
import AdminNavbar from "./AdminPackages/AdminNavbar";


const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      
      {/* Sidebar (Fixed) */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Right Content Area */}
      <div
        className={`transition-all duration-300 ${
          collapsed ? "md:ml-20 ml-0" : "md:ml-64 ml-0"
        }`}
      >
        {/* Navbar */}
        <AdminNavbar />

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
