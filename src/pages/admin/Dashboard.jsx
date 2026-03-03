import React, { useEffect, useState } from "react";
import { Layers, Package } from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";

const Dashboard = () => {
  const [totalPools, setTotalPools] = useState(0);
  const [totalPackages, setTotalPackages] = useState(0);

  const [loadingPools, setLoadingPools] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(true);

  /* ------------------ Fetch Pools ------------------ */
  const fetchPoolsCount = async () => {
    try {
      const adminToken = localStorage.getItem("admin_token");

      const res = await axiosInstance.get("/admin/pools", {
        headers: { Authorization: `Bearer ${adminToken}` },
        withCredentials: true,
      });

      if (res.data?.success) {
        const pools = res.data.data || [];
        setTotalPools(pools.length);
      }
    } catch (error) {
      console.error("Error fetching pools:", error);
    } finally {
      setLoadingPools(false);
    }
  };

  /* ------------------ Fetch Packages ------------------ */
  const fetchPackagesCount = async () => {
    try {
      const token = localStorage.getItem("admin_token");

      const res = await axiosInstance.get("/package", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const list = res.data?.data || [];
      setTotalPackages(list.length);
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setLoadingPackages(false);
    }
  };

  useEffect(() => {
    fetchPoolsCount();
    fetchPackagesCount();
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-6 lg:p-8">
      
      {/* Welcome Section */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Welcome to Admin Dashboard
        </h1>
      </div>

      {/* Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Pools Card */}
        <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl shadow-md hover:shadow-xl transition duration-300 text-center">
          <div className="flex justify-center mb-4 md:mb-6">
            <Layers size={40} className="text-blue-600 md:size-[50px]" />
          </div>
          <h2 className="text-base md:text-lg font-semibold text-gray-700">
            Total Pools
          </h2>
          <p className="text-3xl md:text-4xl font-bold mt-2 md:mt-3 text-gray-900">
            {loadingPools ? "Loading..." : totalPools}
          </p>
        </div>

        {/* Packages Card */}
        <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl shadow-md hover:shadow-xl transition duration-300 text-center">
          <div className="flex justify-center mb-4 md:mb-6">
            <Package size={40} className="text-green-600 md:size-[50px]" />
          </div>
          <h2 className="text-base md:text-lg font-semibold text-gray-700">
            Total Packages
          </h2>
          <p className="text-3xl md:text-4xl font-bold mt-2 md:mt-3 text-gray-900">
            {loadingPackages ? "Loading..." : totalPackages}
          </p>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
