import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminNavbar = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [adminUser, setAdminUser] = useState(null);

  // Get admin data from localStorage
  useEffect(() => {
    const storedAdmin = localStorage.getItem("adminUser");
    if (storedAdmin) {
      setAdminUser(JSON.parse(storedAdmin));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("adminUser");
    navigate("/admin");
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!adminUser) return null;

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 px-6 py-4 flex items-center justify-end">
      
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 focus:outline-none"
        >
          {/* Dynamic Avatar */}
          <img
            src={`https://ui-avatars.com/api/?name=${adminUser.email}&background=000000&color=ffffff`}
            alt="Admin Avatar"
            className="w-9 h-9 rounded-full border"
          />

          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-gray-800">
              {adminUser.email}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {adminUser.role}
            </p>
          </div>
        </button>

        {open && (
          <div className="absolute right-0 mt-3 w-44 bg-white border rounded-lg shadow-lg overflow-hidden z-50">
            <button
              onClick={logout}
              className="w-full text-left px-4 py-3 text-red-600 font-medium hover:bg-red-50 transition"
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AdminNavbar;
