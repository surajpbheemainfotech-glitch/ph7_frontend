import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import EditPoolsModal from "../pages/admin/EditPoolModal";
import { GiTwoCoins } from "react-icons/gi";



/* ---------- HELPERS ---------- */
const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleString();
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return `🪙 ${num.toLocaleString("en-IN")}`;
};

/* ---------- COMPONENT ---------- */
function PoolsTable({ onAddClick }) {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ modal states (ONLY ONCE)
  const [openEdit, setOpenEdit] = useState(false);
  const [editPoolId, setEditPoolId] = useState(null);

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  /* ---------- GET API ---------- */
  const fetchpools = async () => {
    try {
      const adminToken = localStorage.getItem("admin_token");

      const res = await axiosInstance.get("/admin/pools", {
        headers: { Authorization: `Bearer ${adminToken}` },
        withCredentials: true,
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Failed to fetch pools");
      }

      const apipools = (res.data.data || []).map((t) => ({
        id: t.id || t._id, // ✅ fallback
        title: t.title,
        slug: t.slug,
        price: t.price,
        jackpot: t.jackpot,
        startedAt: t.start_at,
        expiredAt: t.expire_at,

        // ✅ safe image build
        imageUrl: t.Imageurl
          ? `${String(baseURL || "").replace(/\/$/, "")}/${String(t.Imageurl).replace(/^\//, "")}`
          : "",
      }));

      setPools(apipools);
    } catch (err) {
      console.error("GET pools error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchpools();
  }, []);

  /* ---------- DELETE ---------- */
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this pools?"
    );
    if (!confirmDelete) return;

    try {
      const adminToken = localStorage.getItem("admin_token");
      const res = await axiosInstance.delete(`/admin/pool/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (!res.data?.success) {
        alert(res.data?.message || "Delete failed");
        return;
      }

      setPools((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
      alert("Something went wrong while deleting");
    }
  };

  /* ---------- EDIT ---------- */
  const handleEdit = (pool) => {
    // ✅ set the id of clicked pool
    setEditPoolId(pool.id || pool._id || pool.slug);
    setOpenEdit(true);
  };

  /* ---------- UI ---------- */
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Pools</h3>
          <p className="text-sm text-gray-500">View and manage your pools.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-700">
            Total: {pools.length}
          </span>

          <button
            onClick={onAddClick}
            className="bg-black text-[#F0B100] px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition"
          >
            + Add Pools
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold">Image</th>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Jackpot</th>
              <th className="px-4 py-3 font-semibold">Started At</th>
              <th className="px-4 py-3 font-semibold">Expired At</th>
              <th className="px-4 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center">
                  Loading pools...
                </td>
              </tr>
            ) : pools.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  No pools found. Click <b>+ Add Pool</b> to create one.
                </td>
              </tr>
            ) : (
              pools.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border bg-gray-50 flex items-center justify-center">
                      {t.imageUrl ? (
                        <img
                          src={t.imageUrl}
                          alt={t.title || "ticket"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-gray-400">No Img</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {t.title || "-"}
                  </td>

                  <td className="px-5 py-4 text-gray-700">
                    <div className="flex items-center gap-2">
                      <GiTwoCoins className="text-yellow-500 text-4xl" />
                      <span>{t.price}</span>
                    </div>
                  </td>



                  <td className="px-4 py-3 text-gray-700">
                    {formatMoney(t.jackpot)}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {formatDateTime(t.startedAt)}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {formatDateTime(t.expiredAt)}
                  </td>

                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(t)}
                      className="px-3 py-2 rounded-lg text-xs mb-2 font-semibold border border-blue-200 text-blue-600 hover:bg-blue-50 transition"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(t.id)}
                      className="px-3 py-2 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Render modal ONCE (not inside map), UI stays same */}
      {openEdit && (
        <EditPoolsModal
          pools={pools}
          open={openEdit}
          editPoolId={editPoolId}
          onClose={() => setOpenEdit(false)}
          onUpdated={fetchpools}
        />
      )}
    </div>
  );
}

export default PoolsTable;