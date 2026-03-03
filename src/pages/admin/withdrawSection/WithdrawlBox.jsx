import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import axiosInstance from "../../../utils/axiosInstance";
import WithdrawlTable from "./WithdrawlTable";

/* ---------------- toast (with cross button) ---------------- */
function Toast({ open, message, tone = "success", onClose }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), 8000);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  const toneCls =
    tone === "error" ? "bg-rose-600" : tone === "info" ? "bg-slate-900" : "bg-emerald-600";

  return createPortal(
    <div className="fixed z-[100000] top-4 left-1/2 -translate-x-1/2 px-4 w-full max-w-xl">
      <div
        className={`w-full rounded-2xl text-white shadow-2xl px-4 py-3 ring-1 ring-white/10 flex items-start justify-between gap-3 ${toneCls}`}
      >
        <p className="text-sm font-semibold leading-snug">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full bg-white/15 hover:bg-white/25 px-2 py-1 text-xs font-black"
          aria-label="Close"
          title="Close"
        >
          ✕
        </button>
      </div>
    </div>,
    document.body
  );
}

/* ---------------- confirm modal (for payout only) ---------------- */
function ConfirmModal({
  open,
  title = "Are you sure?",
  desc = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999]">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
          <div className="p-5 border-b">
            <p className="text-lg font-extrabold">{title}</p>
            {desc ? <p className="text-sm text-slate-600 mt-1">{desc}</p> : null}
          </div>

          <div className="p-5 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 rounded-2xl ring-1 ring-slate-200 text-sm font-semibold bg-white"
            >
              {cancelText}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => onConfirm?.()}
              className={`px-4 py-2 rounded-2xl text-sm font-semibold text-white bg-indigo-600 ${
                loading ? "opacity-70" : ""
              }`}
            >
              {loading ? "Please wait..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------------- local hide persistence (frontend-only) ---------------- */
const HIDDEN_KEY = "admin_hidden_withdraw_ids_v1";

const getHiddenIds = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

const saveHiddenIds = (set) => {
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(Array.from(set)));
};

export default function WithdrawlBox() {
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const savedAdmin = localStorage.getItem("adminUser");
    if (savedAdmin) {
      try {
        setAdmin(JSON.parse(savedAdmin));
      } catch (e) {
        console.error("Error parsing adminUser", e);
        setAdmin(null);
      }
    }
  }, []);

  const adminRole = String(admin?.role || "").toLowerCase();
  const adminId = adminRole === "admin" ? admin?._id || admin?.id : null;

  const LIST_ENDPOINT = "/admin/get-withdraw-requests";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [hiddenIds, setHiddenIds] = useState(() => getHiddenIds());

  const [toast, setToast] = useState({ open: false, msg: "", tone: "info" });
  const showToast = (msg, tone = "info") => setToast({ open: true, msg, tone });
  const closeToast = () => setToast((t) => ({ ...t, open: false }));

  const [confirm, setConfirm] = useState({ open: false, withdrawId: "" });

  const [actionLoadingId, setActionLoadingId] = useState(null);

  // ✅ pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const pickList = (res) => {
    const d = res?.data;
    const list =
      d?.data?.withdrawRequests ||
      d?.data?.withdraws ||
      d?.data?.rows ||
      d?.withdrawRequests ||
      d?.withdraws ||
      d?.rows ||
      d?.data ||
      d;

    return Array.isArray(list) ? list : [];
  };

  const refresh = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await axiosInstance.get(LIST_ENDPOINT);

      const list = pickList(res);
      const hidden = getHiddenIds();
      setHiddenIds(hidden);

      const filtered = (list || []).filter((r) => {
        const id = r?._id || r?.id || r?.withdrawId;
        return !hidden.has(String(id));
      });

      setRows(filtered);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load withdraw requests");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalized = useMemo(() => {
    return (rows || []).map((r) => {
      const withdrawId = r?._id || r?.id || r?.withdrawId;
      const amount = Number(r?.amount ?? r?.coin ?? 0);
      const method = String(r?.method || r?.withdraw_method || "—").toLowerCase();
      const status = String(r?.status || "pending").toLowerCase();

      const createdAt = r?.createdAt || r?.created_at || r?.date || r?.requestedAt || r?.requested_at;

      const upi = r?.upi_id || r?.upiId;
      const bankAcc = r?.bank_account || r?.bankAccount;
      const ifsc = r?.ifsc;
      const holder = r?.account_holder || r?.accountHolder;

      const userId = r?.userId || r?.user_id || r?.user?._id || r?.user?.id;
      const userName = r?.user?.name || r?.name || r?.user_name;

      return {
        raw: r,
        withdrawId,
        amount,
        method,
        status,
        createdAt,
        upi,
        bankAcc,
        ifsc,
        holder,
        userId,
        userName,
      };
    });
  }, [rows]);

  const patchLocalStatus = (withdrawId, patch) => {
    setRows((prev) =>
      (prev || []).map((r) => {
        const id = r?._id || r?.id || r?.withdrawId;
        if (String(id) !== String(withdrawId)) return r;
        return { ...r, ...patch };
      })
    );
  };

  const hideRow = (withdrawId) => {
    if (!withdrawId) return;

    const ok = window.confirm("Hide this request from the list?");
    if (!ok) return;

    setRows((prev) =>
      (prev || []).filter((r) => {
        const id = r?._id || r?.id || r?.withdrawId;
        return String(id) !== String(withdrawId);
      })
    );

    const hidden = getHiddenIds();
    hidden.add(String(withdrawId));
    saveHiddenIds(hidden);
    setHiddenIds(hidden);

    showToast("✅ Removed from frontend list.", "success");
  };

  const approveNow = async (withdrawId) => {
    if (!withdrawId) return;

    const ok = window.confirm("Are you sure you want to APPROVE this withdrawal?");
    if (!ok) return;

    setActionLoadingId(withdrawId);
    setErr("");

    const prevStatus =
      rows.find((r) => String(r?._id || r?.id || r?.withdrawId) === String(withdrawId))?.status ||
      "pending";

    try {
      if (!adminId) throw new Error("AdminId missing. Please login as admin again.");

      const status = "APPROVED";
      const adminNote = "Withdrawal approved by admin.";

      const res = await axiosInstance.post("/payment/withdraw-approve", {
        withdrawId,
        adminId,
        status,
        adminNote,
      });

      const data = res?.data;
      if (!data?.success) throw new Error(data?.message || "Approve failed");

      showToast(data?.message || "✅ Approved successfully.", "success");
      await refresh();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Approve failed";
      setErr(msg);
      showToast(`❌ Approve failed: ${msg}`, "error");
      patchLocalStatus(withdrawId, { status: prevStatus });
    } finally {
      setActionLoadingId(null);
    }
  };

  const openPayoutConfirm = (withdrawId) => setConfirm({ open: true, withdrawId });
  const closePayoutConfirm = () => setConfirm({ open: false, withdrawId: "" });

  const runPayout = async () => {
    const withdrawId = confirm.withdrawId;
    if (!withdrawId) return;

    setActionLoadingId(withdrawId);
    setErr("");

    const prevStatus =
      rows.find((r) => String(r?._id || r?.id || r?.withdrawId) === String(withdrawId))?.status ||
      "approved";

    try {
      const res = await axiosInstance.post("/payment/withdraw-payout", { withdrawId });

      const data = res?.data;
      if (data && data.success === false) throw new Error(data?.message || "Payout failed");

      showToast(data?.message || "✅ Payout successful.", "success");
      await refresh();
      closePayoutConfirm();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Payout failed";
      setErr(msg);
      showToast(`❌ Payout failed: ${msg}`, "error");
      patchLocalStatus(withdrawId, { status: prevStatus });
      closePayoutConfirm();
    } finally {
      setActionLoadingId(null);
    }
  };

  // pagination derived
  const totalItems = normalized.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return normalized.slice(start, end);
  }, [normalized, page, pageSize]);

  return (
    <div className="w-full">
      <Toast open={toast.open} message={toast.msg} tone={toast.tone} onClose={closeToast} />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-lg font-extrabold">Withdraw Requests</p>

          {hiddenIds.size > 0 ? (
            <button
              type="button"
              className="mt-2 text-xs font-bold text-slate-600 underline underline-offset-4 hover:text-slate-900"
              onClick={() => {
                const ok = window.confirm("Show all hidden requests again?");
                if (!ok) return;
                localStorage.removeItem(HIDDEN_KEY);
                setHiddenIds(new Set());
                showToast("✅ Hidden list cleared.", "success");
                refresh();
              }}
              disabled={loading}
            >
              Show hidden ({hiddenIds.size})
            </button>
          ) : null}
        </div>

        <button
          onClick={refresh}
          className="px-4 py-2 rounded-2xl ring-1 ring-slate-200 text-sm font-semibold bg-white"
          disabled={loading}
          type="button"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {err ? <p className="mt-3 text-sm font-semibold text-rose-600">{err}</p> : null}

      <WithdrawlTable
        loading={loading}
        pageItems={pageItems}
        actionLoadingId={actionLoadingId}
        approveNow={approveNow}
        openPayoutConfirm={openPayoutConfirm}
        hideRow={hideRow}
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        totalPages={totalPages}
        setPage={setPage}
      />

      <ConfirmModal
        open={confirm.open}
        title="Trigger payout?"
        desc="This will trigger payout for this withdraw request."
        confirmText="Pay out"
        cancelText="Cancel"
        loading={!!actionLoadingId}
        onClose={closePayoutConfirm}
        onConfirm={runPayout}
      />
    </div>
  );
}