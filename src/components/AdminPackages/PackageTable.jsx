import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";


import { GiTwoCoins } from "react-icons/gi";

function PackageTable() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // update modal state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", price: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // add modal state
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", price: "" });
  const [addErrors, setAddErrors] = useState({});
  const [addSaving, setAddSaving] = useState(false);
  const [addServerError, setAddServerError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  /* ------------------ Fetch packages ------------------ */
  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("admin_token");
  
      const res = await axiosInstance.get("/package", {
        headers: { Authorization: `Bearer ${token}` },
   
      });

      const list = res.data?.data ?? [];
      setPackages(list);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to fetch packages."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  /* ------------------ Helpers ------------------ */
  const formatMoney = (value) => {
    const n = Number(value ?? 0);
    if (Number.isNaN(n)) return value;
    return `🪙${n.toLocaleString("en-IN")}`;
  };

  /* ------------------ Delete ------------------ */
  const handleDelete = async (pkg) => {
    const ok = window.confirm(`Delete package "${pkg?.package_name}"?`);
    if (!ok) return;

    try {
      const token = localStorage.getItem("admin_token");
      // ✅ adjust endpoint if your backend is different
      await axiosInstance.delete(`admin/package/delete-package/${pkg.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPackages((prev) => prev.filter((p) => p.id !== pkg.id));
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || "Failed to delete package."
      );
    }
  };

  /* ------------------ Update Modal ------------------ */
  const openEdit = (pkg) => {
    setEditing(pkg);
    setForm({
      name: pkg?.package_name ?? "",
      price: String(pkg?.package_price ?? ""),
    });
    setErrors({});
    setOpen(true);
  };

  const closeEdit = () => {
    setOpen(false);
    setEditing(null);
    setForm({ name: "", price: "" });
    setErrors({});
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "This field is required";
    if (!form.price) newErrors.price = "This field is required";
    else if (Number(form.price) <= 0) newErrors.price = "Price must be > 0";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);

      const token = localStorage.getItem("admin_token");
      // ✅ adjust endpoint if your backend is different
      const res = await axiosInstance.patch(
        `admin/package/update-package/${editing.id}`,
        {
          package_name: form.name.trim(),
          package_price: Number(form.price),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = res.data?.data;

      setPackages((prev) =>
        prev.map((p) =>
          p.id === editing.id
            ? {
              ...p,
              package_name: updated?.package_name ?? form.name.trim(),
              package_price: updated?.package_price ?? Number(form.price),
            }
            : p
        )
      );

      closeEdit();
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || "Failed to update package."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ------------------ Add Modal ------------------ */
  const openAdd = () => {
    setAddForm({ name: "", price: "" });
    setAddErrors({});
    setAddServerError("");
    setAddSuccess("");
    setAddOpen(true);
  };

  const closeAdd = () => {
    setAddOpen(false);
    setAddForm({ name: "", price: "" });
    setAddErrors({});
    setAddServerError("");
    setAddSuccess("");
  };

  const addValidate = () => {
    const newErrors = {};
    if (!addForm.name.trim()) newErrors.name = "This field is required";
    if (!addForm.price) newErrors.price = "This field is required";
    else if (Number(addForm.price) <= 0)
      newErrors.price = "Price must be greater than 0";

    setAddErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
    setAddErrors((prev) => ({ ...prev, [name]: "" }));
    setAddServerError("");
    setAddSuccess("");
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddServerError("");
    setAddSuccess("");

    if (!addValidate()) return;

    try {
      setAddSaving(true);

     
      const token = localStorage.getItem("admin_token");
      const res = await axiosInstance.post(
        "admin/package/add",
        {
          package_name: addForm.name.trim(),
          package_price: Number(addForm.price),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success === false) {
        throw new Error(res.data?.message || "Failed to add package.");
      }

      setAddSuccess(res.data?.message || "✅ Package added successfully!");
      await fetchPackages();
      closeAdd();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong while adding package.";
      setAddServerError(msg);
    } finally {
      setAddSaving(false);
    }
  };

  /* ------------------ UI ------------------ */
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Packages</h2>
        <p className="text-sm text-gray-500">
          View, update, delete, or add packages.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          <p className="text-sm text-gray-600">Loading packages...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* ✅ TOP BAR (button on top-right of table) */}
          <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
            <p className="text-sm font-semibold text-gray-800">All Packages</p>

            <div className="flex items-center gap-2">
              <button
                onClick={openAdd}
                className="rounded-xl px-4 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition"
                type="button"
              >
                + Add Package
              </button>

              {/* <button
                onClick={fetchPackages}
                className="rounded-xl px-4 py-2 text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition"
                type="button"
              >
                Refresh
              </button> */}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-700">
                    Package Name
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-700">
                    Price
                  </th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {packages.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-8 text-center text-gray-500"
                    >
                      No packages found.
                    </td>
                  </tr>
                ) : (
                  packages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-gray-900 font-medium">
                        {pkg.package_name}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        <div className="flex items-center gap-2">
                          <GiTwoCoins className="text-yellow-500 text-4xl" />
                          <span>{formatMoney(pkg.package_price)}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(pkg)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                            type="button"
                          >
                            Update
                          </button>

                          <button
                            onClick={() => handleDelete(pkg)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition"
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------ Update Modal ------------------ */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Update Package</p>
                <h3 className="text-base font-semibold text-gray-900">
                  {editing?.package_name}
                </h3>
              </div>
              <button
                onClick={closeEdit}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                type="button"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Package Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={[
                    "w-full rounded-lg px-3 py-2 text-sm border focus:outline-none transition",
                    errors.name
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-teal-500",
                  ].join(" ")}
                  placeholder="Enter package name"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ()
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  className={[
                    "w-full rounded-lg px-3 py-2 text-sm border focus:outline-none transition",
                    errors.price
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-teal-500",
                  ].join(" ")}
                  placeholder="Enter price"
                />
                {errors.price && (
                  <p className="mt-1 text-xs text-red-600">{errors.price}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={closeEdit}
                  className="rounded-xl px-4 py-2 text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition"
                  type="button"
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className={[
                    "rounded-xl px-4 py-2 text-sm font-semibold text-white transition",
                    saving
                      ? "bg-emerald-300 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]",
                  ].join(" ")}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------ Add Package Modal ------------------ */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Add Package</p>
                <h3 className="text-base font-semibold text-gray-900">
                  Create a new package
                </h3>
              </div>
              <button
                onClick={closeAdd}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                type="button"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              {addServerError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {addServerError}
                </div>
              )}

              {addSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {addSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Package Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={addForm.name}
                  onChange={handleAddChange}
                  placeholder="Enter package name"
                  className={[
                    "w-full rounded-lg px-3 py-2 text-sm border focus:outline-none transition",
                    addErrors.name
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-teal-500",
                  ].join(" ")}
                />
                {addErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{addErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (🪙)
                </label>
                <input
                  type="number"
                  name="price"
                  value={addForm.price}
                  onChange={handleAddChange}
                  placeholder="Enter price"
                  className={[
                    "w-full rounded-lg px-3 py-2 text-sm border focus:outline-none transition",
                    addErrors.price
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-teal-500",
                  ].join(" ")}
                />
                {addErrors.price && (
                  <p className="mt-1 text-xs text-red-600">
                    {addErrors.price}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={addSaving}
                className={[
                  "w-full mt-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition",
                  addSaving
                    ? "bg-teal-300 cursor-not-allowed"
                    : "bg-teal-600 hover:bg-teal-700 active:scale-[0.98]",
                ].join(" ")}
              >
                {addSaving ? "Saving..." : "Save Package"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PackageTable;
