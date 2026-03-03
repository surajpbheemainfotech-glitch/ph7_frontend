// src/components/WalletDropdown.jsx
import React, { useMemo, useState } from "react";
import { HiOutlineWallet, HiXMark } from "react-icons/hi2";
import { GiTwoCoins } from "react-icons/gi";
import { useNavigate } from "react-router-dom";

import Payment from "./Payment";
import WithDrawl from "./UserProfiles/WithDrawl";
import { useAuth } from "../context/AuthContext";

const WalletDropdown = ({ formatINR }) => {
  const [open, setOpen] = useState(false);
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const navigate = useNavigate();
  const { wallet, updateWallet } = useAuth();

  const walletBalance = Number(wallet?.cash ?? 0);
  const walletBonus = Number(wallet?.bonus ?? 0);

  const totalAmount = useMemo(
    () => walletBalance + walletBonus,
    [walletBalance, walletBonus]
  );

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all hover:border-teal-200"
          type="button"
        >
          <span className="text-lg text-teal-500">
            <HiOutlineWallet />
          </span>

          <div className="flex items-center gap-2">
            <GiTwoCoins className="text-yellow-500 text-4xl" />
            <span>{totalAmount}</span>
          </div>

          <span className="ml-1 text-[11px] text-gray-400">▼</span>
        </button>

        <div
          className={`absolute right-0 top-12 w-[320px] z-50 transition-all duration-200 origin-top-right ${
            open
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
          }`}
        >
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-teal-500/20 via-emerald-500/15 to-sky-500/20" />
            <div className="absolute -top-2 right-10 w-4 h-4 rotate-45 bg-white border-l border-t border-gray-200" />

            <div className="relative px-5 pt-5 pb-4">
              {/* ✅ close button (top-right cross) */}
              <button
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 p-1.5 rounded-full hover:bg-gray-100 transition"
                type="button"
                aria-label="Close wallet dropdown"
              >
                <HiXMark className="text-xl text-gray-500" />
              </button>

              <p className="text-xs uppercase tracking-wide text-gray-500">
                Wallet Overview
              </p>

              <p className="text-base font-bold text-gray-900 flex gap-2 items-center">
                <GiTwoCoins className="text-yellow-500 text-4xl" />
                <span>{totalAmount}</span>
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 bg-white/70 p-3">
                  <p className="text-xs text-gray-500">Main Balance</p>
                  <p className="text-base font-bold text-gray-900 mt-1 flex items-center gap-2">
                    <GiTwoCoins className="text-yellow-500 text-3xl" />
                    <span>{walletBalance}</span>
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                  <p className="text-xs text-emerald-700">Bonus Cash</p>
                  <p className="text-base font-bold text-emerald-700 mt-1 flex items-center gap-2">
                    <GiTwoCoins className="text-yellow-500 text-3xl" />
                    <span>{walletBonus}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* ✅ bottom buttons: Withdraw + Add Money (no Close here) */}
            <div className="relative px-5 py-4 border-t border-gray-100 flex gap-3 bg-white">
            
                {import.meta.env.VITE_FLAG_V === "V1" && (
              <button
                onClick={() => {
                  setOpen(false);
                  setWithdrawOpen(true);
                }}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition"
                type="button"
              >
                Withdraw
              </button>
            )}
              

              <button
  type="button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    navigate("/purchase");
  }}
  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm hover:opacity-95 transition"
>
  Add Money
</button>

            </div>
          </div>
        </div>
      </div>

      {/* ✅ Add Money Modal */}
      <Payment
        open={addMoneyOpen}
        onClose={() => setAddMoneyOpen(false)}
        onSubmit={(payload) => {
          const amount = Number(payload?.amount ?? 0);
          if (!amount || amount < 100) return;

          updateWallet((prev) => ({
            ...prev,
            cash: Number(prev.cash ?? 0) + amount,
          }));

          setAddMoneyOpen(false);
          console.log("Add money payload:", payload);
        }}
      />

      {/* ✅ Withdraw Modal */}
        {import.meta.env.VITE_FLAG_V === "V1" && (
              <WithDrawl open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
            )}
      
     
    </>
  );
};

export default WalletDropdown;
