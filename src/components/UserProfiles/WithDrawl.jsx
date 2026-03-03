// src/components/user/WithDrawl.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import axiosInstance from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const fmtMoney = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(n || 0));

export default function WithDrawl({ open, onClose }) {
  const { user, wallet } = useAuth();

  const total = useMemo(
    () => Number(wallet?.cash ?? 0) + Number(wallet?.bonus ?? 0),
    [wallet?.cash, wallet?.bonus]
  );

  const maxCoins = Math.max(0, total);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("upi"); // upi | bank

  // Field validation UI state
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // UPI
  const [upiId, setUpiId] = useState("");

  // Bank
  const [bankAccount, setBankAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;

    setAmount("");
    setErr("");
    setSubmitting(false);

    setMethod("upi");
    setUpiId("");

    setBankAccount("");
    setIfsc("");
    setAccountHolder("");

    setFieldErrors({});
    setTouched({});
  }, [open]);

  /* ESC close */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* lock scroll */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [open]);

  const nAmount = Number(amount);

  const isValidAmount =
    amount !== "" &&
    Number.isFinite(nAmount) &&
    nAmount > 0 &&
    nAmount <= maxCoins;

  const isValidUpi = method === "upi" && upiId.trim().length > 0;

  const isValidBank =
    method === "bank" &&
    bankAccount.trim().length >= 8 &&
    ifsc.trim().length >= 8 &&
    accountHolder.trim().length > 0;

  const canSubmit =
    !submitting && user && isValidAmount && (isValidUpi || isValidBank);

  // ✅ mark bank fields touched (so red border shows on submit too)
  const markBankTouched = () => {
    setTouched((t) => ({
      ...t,
      bankAccount: true,
      ifsc: true,
      accountHolder: true,
    }));
  };

  const validateBankFields = () => {
    const errors = {};

    if (!bankAccount.trim()) {
      errors.bankAccount = "Bank account number is required";
    } else if (!/^[0-9]{8,18}$/.test(bankAccount.trim())) {
      errors.bankAccount = "Enter valid bank account number";
    }

    if (!ifsc.trim()) {
      errors.ifsc = "IFSC code is required";
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase())) {
      errors.ifsc = "Invalid IFSC format (e.g. SBIN0001234)";
    }

    if (!accountHolder.trim()) {
      errors.accountHolder = "Account holder name is required";
    } else if (accountHolder.trim().length < 3) {
      errors.accountHolder = "Name must be at least 3 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleWithdrawClick = () => {
    if (submitting) return;

    if (method === "bank") {
      markBankTouched();
      const okFields = validateBankFields();
      if (!okFields) return;
    }

    if (!canSubmit) return;

    const ok = window.confirm("Are you sure you want to withdraw this money?");
    if (ok) submitWithdraw();
  };

  const submitWithdraw = async () => {
    if (method === "bank") {
      markBankTouched();
      const okFields = validateBankFields();
      if (!okFields) return;
    }

    if (!canSubmit) return;

    setSubmitting(true);
    setErr("");

    // optional: show loading toast
    const tId = toast.loading("Submitting withdraw request...");

    try {
      const payload = {
        userId: user?._id || user?.id,
        amount: nAmount,
        method,
        upi_id: method === "upi" ? upiId.trim() : null,
        bank_account: method === "bank" ? bankAccount.trim() : null,
        ifsc: method === "bank" ? ifsc.trim().toUpperCase() : null,
        account_holder: method === "bank" ? accountHolder.trim() : null,
      };

      // ✅ Create request only. NO wallet deduction here.
      await axiosInstance.post("/payment/withdraw-request", payload);

      toast.dismiss(tId);
      toast.success(
        "Withdraw request submitted successfully. Your amount will be credited within 24 hours."
      );

      setTimeout(() => onClose?.(), 800);
    } catch (e) {
      toast.dismiss(tId);
      const msg =
        e?.response?.data?.message || e?.message || "Withdraw request failed";
      setErr(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-lg h-[85vh] sm:h-[80vh] bg-white rounded-[28px] shadow-2xl ring-1 ring-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b shrink-0">
            <p className="text-lg font-extrabold">Withdraw Coins</p>
            <p className="text-xs text-slate-500 mt-1">
              Available: <b>{fmtMoney(maxCoins)}</b>
            </p>
          </div>

          {/* Body (scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {err && (
              <div className="bg-rose-50 ring-1 ring-rose-200 p-3 rounded-xl">
                <p className="text-sm font-semibold text-rose-700">Something went wrong !! Please try later</p>
              </div>
            )}

            {/* Amount */}
            <div className="bg-slate-50 ring-1 ring-slate-200 p-4 rounded-3xl">
              <p className="text-xs font-semibold">Enter amount</p>
              <div className="mt-3 flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={maxCoins}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 rounded-2xl px-4 py-3 ring-1 ring-slate-200"
                  placeholder="e.g. 500"
                />
                <button
                  onClick={() => setAmount(String(maxCoins))}
                  className="px-4 py-3 rounded-2xl ring-1 ring-slate-200"
                  type="button"
                >
                  Max
                </button>
              </div>
              {!isValidAmount && amount !== "" ? (
                <p className="mt-2 text-[11px] font-semibold text-rose-600">
                  Amount must be between 1 and {maxCoins}
                </p>
              ) : null}
            </div>

            {/* Method switch */}
            <div className="bg-slate-50 ring-1 ring-slate-200 p-4 rounded-3xl">
              <p className="text-xs font-semibold mb-2">Withdraw Method</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMethod("upi");
                    setFieldErrors({});
                    setTouched({});
                  }}
                  className={`flex-1 px-4 py-2 rounded-2xl ring-1 ${
                    method === "upi"
                      ? "bg-black text-white ring-black"
                      : "bg-white ring-slate-200"
                  }`}
                >
                  UPI
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMethod("bank");
                    setFieldErrors({});
                    setTouched({});
                  }}
                  className={`flex-1 px-4 py-2 rounded-2xl ring-1 ${
                    method === "bank"
                      ? "bg-black text-white ring-black"
                      : "bg-white ring-slate-200"
                  }`}
                >
                  Bank
                </button>
              </div>
            </div>

            {/* UPI */}
            {method === "upi" && (
              <div className="bg-slate-50 ring-1 ring-slate-200 p-4 rounded-3xl">
                <p className="text-xs font-semibold mb-2">UPI ID</p>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="example@upi"
                  className="w-full rounded-2xl px-4 py-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                {method === "upi" && upiId.trim() === "" ? (
                  <p className="mt-2 text-[11px] font-semibold text-rose-600">
                    UPI ID is required
                  </p>
                ) : null}
              </div>
            )}

            {/* Bank */}
            {method === "bank" && (
              <div className="bg-slate-50 ring-1 ring-slate-200 p-3 rounded-2xl">
                <p className="text-xs font-semibold mb-2">Bank Details</p>

                <div className="max-h-[150px] overflow-y-auto pr-1 space-y-3">
                  {/* Account Number */}
                  <div>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      onBlur={() => {
                        setTouched((t) => ({ ...t, bankAccount: true }));
                        validateBankFields();
                      }}
                      placeholder="Bank Account Number"
                      className={`w-full rounded-xl px-3 py-2 text-sm border ${
                        fieldErrors.bankAccount && touched.bankAccount
                          ? "border-red-500"
                          : "border-slate-200"
                      } focus:outline-none focus:ring-2 ${
                        fieldErrors.bankAccount && touched.bankAccount
                          ? "focus:ring-red-300"
                          : "focus:ring-slate-300"
                      }`}
                    />
                    {fieldErrors.bankAccount && touched.bankAccount && (
                      <p className="text-[11px] text-red-500 mt-1">
                        {fieldErrors.bankAccount}
                      </p>
                    )}
                  </div>

                  {/* IFSC */}
                  <div>
                    <input
                      type="text"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      onBlur={() => {
                        setTouched((t) => ({ ...t, ifsc: true }));
                        validateBankFields();
                      }}
                      placeholder="IFSC Code"
                      className={`w-full rounded-xl px-3 py-2 text-sm border ${
                        fieldErrors.ifsc && touched.ifsc
                          ? "border-red-500"
                          : "border-slate-200"
                      } focus:outline-none focus:ring-2 ${
                        fieldErrors.ifsc && touched.ifsc
                          ? "focus:ring-red-300"
                          : "focus:ring-slate-300"
                      }`}
                    />
                    {fieldErrors.ifsc && touched.ifsc && (
                      <p className="text-[11px] text-red-500 mt-1">
                        {fieldErrors.ifsc}
                      </p>
                    )}
                  </div>

                  {/* Account Holder */}
                  <div>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      onBlur={() => {
                        setTouched((t) => ({ ...t, accountHolder: true }));
                        validateBankFields();
                      }}
                      placeholder="Account Holder Name"
                      className={`w-full rounded-xl px-3 py-2 text-sm border ${
                        fieldErrors.accountHolder && touched.accountHolder
                          ? "border-red-500"
                          : "border-slate-200"
                      } focus:outline-none focus:ring-2 ${
                        fieldErrors.accountHolder && touched.accountHolder
                          ? "focus:ring-red-300"
                          : "focus:ring-slate-300"
                      }`}
                    />
                    {fieldErrors.accountHolder && touched.accountHolder && (
                      <p className="text-[11px] text-red-500 mt-1">
                        {fieldErrors.accountHolder}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t shrink-0 flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Press <b>Esc</b> to close
            </p>
            <button
              type="button"
              onClick={handleWithdrawClick}
              disabled={!canSubmit}
              className={`px-5 py-2.5 rounded-2xl text-sm font-semibold ${
                canSubmit ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {submitting ? "Processing..." : "Withdraw"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}