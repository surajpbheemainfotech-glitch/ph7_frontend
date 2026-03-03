import React, { useState } from "react";
import axiosInstance from "../utils/axiosInstance";

const cn = (...a) => a.filter(Boolean).join(" ");

const isValidUpi = (upi) =>
  /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(String(upi || "").trim());

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Payment({
  open,
  onClose,
  onSubmit,
  userId = 1,
  amount = 0,
  title = "Selected Package",
  package_id = null,
}) {
  const [upiId, setUpiId] = useState("");
  const [provider, setProvider] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  if (!open) return null;

  const markTouched = (k) => setTouched((p) => ({ ...p, [k]: true }));

  const errors = {
    upiId: !upiId ? "UPI ID required" : !isValidUpi(upiId) ? "Invalid UPI ID" : null,
    provider: !provider ? "Select payment app" : null,
    package_id: !package_id ? "Package not selected" : null,
    amount: !amount || Number(amount) <= 0 ? "Invalid amount" : null,
  };

  const close = () => {
    if (loading) return;
    setUpiId("");
    setProvider("");
    setTouched({});
    onClose?.();
  };

const handlePay = async () => {
  if (!package_id) {
    alert("Package not selected");
    return;
  }

  const amt = Number(amount);
  if (!amt || amt <= 0) {
    alert("Invalid amount");
    return;
  }

  try {
    setLoading(true);

    const ok = await loadRazorpay();
    if (!ok) {
      alert("Razorpay SDK failed to load. Check internet/adblock.");
      return;
    }

    // ✅ Create order (your backend keys)
    const { data } = await axiosInstance.post("/payment/create-order", {
      amount: amt,
      userId,
      currency: "INR",
    });

    const orderId = data?.orderId || data?.order?.id;
    const currency = data?.currency || data?.order?.currency || "INR";

    if (!data?.success || !orderId) {
      alert(data?.message || "Order creation failed");
      return;
    }

    const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!key) {
      alert("Missing VITE_RAZORPAY_KEY_ID in .env");
      return;
    }

    const rpAmount = Number(data?.order?.amount) || Math.round(amt * 100);

    const options = {
      key,
      amount: rpAmount,
      currency,
      name: "Your App",
      description: `Buy Package: ${title}`,
      order_id: orderId,
      notes: {
        userId: String(userId),
        package_id: String(package_id),
        title,
      },
      theme: { color: "#14b8a6" },

      handler: async function (response) {
        try {
          const verifyRes = await axiosInstance.post("/payment/verify", {
            razorpay_order_id: response?.razorpay_order_id,
            razorpay_payment_id: response?.razorpay_payment_id,
            razorpay_signature: response?.razorpay_signature,
            userId,
            package_id,
          });

          if (verifyRes?.data?.success) {
            alert("✅ Payment Successful");

            onSubmit?.({
              userId,
              package_id,
              amount: amt,
              razorpay_order_id: response?.razorpay_order_id,
              razorpay_payment_id: response?.razorpay_payment_id,
            });

            close();
          } else {
            alert(verifyRes?.data?.message || "Payment verification failed");
          }
        } catch (err) {
          alert(err?.response?.data?.message || err?.message || "Verify error");
        } finally {
          setLoading(false);
        }
      },

      modal: {
        ondismiss: () => setLoading(false),
      },
    };

    new window.Razorpay(options).open();
  } catch (err) {
    alert(err?.response?.data?.message || err?.message || "Payment error");
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/40" onClick={close} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border">
          {/* Header */}
          <div className="px-5 py-4 border-b flex justify-between">
            <div>
              <p className="font-bold text-gray-900">Payment</p>
              <p className="text-xs text-gray-500">Buy Package</p>
            </div>

            <button
              onClick={close}
              disabled={loading}
              className="text-sm px-3 py-1 border rounded-lg"
              type="button"
            >
              Close
            </button>
          </div>

          {/* Body */}
         <div className="p-5">
  <p className="text-sm text-gray-600">Purchasing:</p>
  <p className="font-bold text-lg text-gray-900">{title}</p>

  <div className="mt-4 rounded-xl border bg-gray-50 p-4">
    <p className="text-xs text-gray-500">Amount</p>
    <p className="text-3xl font-bold">
      ₹{Number(amount).toLocaleString("en-IN")}
    </p>

   
  </div>

  <button
    onClick={handlePay}
    disabled={loading}
    className="w-full mt-6 py-3 rounded-xl text-white font-semibold bg-teal-500 hover:bg-teal-600 disabled:opacity-60"
    type="button"
  >
    {loading ? "Opening Razorpay..." : "Pay Now"}
  </button>

  <p className="mt-3 text-xs text-gray-500 text-center">
    You will be redirected to Razorpay checkout.
  </p>
</div>
        </div>
      </div>
    </div>
  );
}