import React, { useMemo } from "react";

/* ---------------- money formatter ---------------- */
const fmtMoney = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(n || 0));

/* ---------------- small ui helpers ---------------- */
const Badge = ({ status }) => {
  const s = String(status || "pending").toLowerCase();

  const cls =
    s === "approved" || s === "approved_by_admin"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : s === "rejected" || s === "rejected_by_admin"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : s === "paid" || s === "payout_done"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
      : "bg-amber-50 text-amber-800 ring-amber-200";

  const label =
    s === "approved" || s === "approved_by_admin"
      ? "Approved"
      : s === "rejected" || s === "rejected_by_admin"
      ? "Rejected"
      : s === "paid" || s === "payout_done"
      ? "Paid"
      : "Pending";

  return (
    <span className={`inline-flex px-2 py-1 text-[11px] font-bold rounded-full ring-1 ${cls}`}>
      {label}
    </span>
  );
};

const safe = (v) => (v == null || v === "" ? "—" : String(v));

export default function WithdrawlTable({
  loading,
  pageItems,
  actionLoadingId,

  approveNow,
  openPayoutConfirm,
  hideRow,

  // pagination props
  page,
  pageSize,
  totalItems,
  totalPages,
  setPage,
}) {
  const visiblePageNumbers = useMemo(() => {
    const windowSize = 5;
    let start = Math.max(1, page - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - windowSize + 1);
    }
    const nums = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [page, totalPages]);

  return (
    <>
      <div className="mt-3 overflow-x-auto rounded-3xl ring-1 ring-slate-200 bg-white">
        <table className="min-w-[980px] w-full">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <th className="px-4 py-3 text-xs font-extrabold text-slate-600">Date</th>
              <th className="px-4 py-3 text-xs font-extrabold text-slate-600">WithdrawId</th>
              <th className="px-4 py-3 text-xs font-extrabold text-slate-600">User</th>
              <th className="px-4 py-3 text-xs font-extrabold text-slate-600">Amount</th>
              <th className="px-4 py-3 text-xs font-extrabold text-slate-600">Method</th>
              <th className="px-4 py-3 text-xs font-extrabold text-slate-600">Details</th>
              <th className="px-4 py-3 text-xs font-extrabold text-slate-600">Status</th>
              <th className="px-4 py-3 text-xs font-extrabold text-slate-600">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-600" colSpan={8}>
                  Loading...
                </td>
              </tr>
            ) : pageItems.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-600" colSpan={8}>
                  No withdraw requests found.
                </td>
              </tr>
            ) : (
              pageItems.map((it) => {
                const rowBusy = actionLoadingId === it.withdrawId;

                const isPending = it.status === "pending";
                const isApproved = it.status === "approved";
                const isRejected = it.status === "rejected";
                const isPaid = it.status === "paid" || it.status === "payout_done";

                const details =
                  it.method === "upi"
                    ? `UPI: ${safe(it.upi)}`
                    : it.method === "bank"
                    ? `A/C: ${safe(it.bankAcc)} • IFSC: ${safe(it.ifsc)} • Name: ${safe(it.holder)}`
                    : "—";

                return (
                  <tr key={String(it.withdrawId)} className="border-t">
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {it.createdAt ? new Date(it.createdAt).toLocaleString() : "—"}
                    </td>

                    <td className="px-4 py-3 text-xs font-mono text-slate-700">
                      {safe(it.withdrawId)}
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-700">
                      <p className="font-semibold">{safe(it.userName)}</p>
                      <p className="text-xs text-slate-500">{safe(it.userId)}</p>
                    </td>

                    <td className="px-4 py-3 text-sm font-bold text-slate-900">
                      {fmtMoney(it.amount)}
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-700 uppercase">{safe(it.method)}</td>

                    <td className="px-4 py-3 text-sm text-slate-700">{details}</td>

                    <td className="px-4 py-3">
                      <Badge status={it.status} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!isPending || rowBusy}
                          onClick={() => approveNow(it.withdrawId)}
                          className={`px-3 py-2 rounded-2xl text-xs font-bold ring-1 ${
                            isPending && !rowBusy
                              ? "bg-emerald-600 text-white ring-emerald-600"
                              : "bg-slate-100 text-slate-400 ring-slate-200"
                          }`}
                        >
                          {rowBusy ? "Processing..." : "Approve"}
                        </button>

                        <button
                          type="button"
                          disabled={!isApproved || isPaid || isRejected || rowBusy}
                          onClick={() => openPayoutConfirm(it.withdrawId)}
                          className={`px-3 py-2 rounded-2xl text-xs font-bold ring-1 ${
                            isApproved && !isPaid && !rowBusy
                              ? "bg-indigo-600 text-white ring-indigo-600"
                              : "bg-slate-100 text-slate-400 ring-slate-200"
                          }`}
                          title={isPaid ? "Already paid" : !isApproved ? "Approve first" : "Pay out"}
                        >
                          Accept (Payout)
                        </button>

                        <button
                          type="button"
                          disabled={rowBusy}
                          onClick={() => hideRow(it.withdrawId)}
                          className="px-3 py-2 rounded-2xl text-xs font-black ring-1 bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                          title="Remove from list"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* pagination footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-600">
          Showing <b>{totalItems === 0 ? 0 : (page - 1) * pageSize + 1}</b>-<b>{Math.min(page * pageSize, totalItems)}</b>{" "}
          of <b>{totalItems}</b>
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-2 rounded-2xl text-xs font-bold ring-1 bg-white ring-slate-200 disabled:opacity-50"
          >
            Prev
          </button>

          <div className="flex items-center gap-1">
            {visiblePageNumbers.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`h-9 w-9 rounded-2xl text-xs font-extrabold ring-1 ${
                  p === page
                    ? "bg-slate-900 text-white ring-slate-900"
                    : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-2 rounded-2xl text-xs font-bold ring-1 bg-white ring-slate-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}