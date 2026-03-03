// src/components/auth/UserForget.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "../../utils/axiosInstance"; // ✅ adjust path if needed

/**
 * UserForget.jsx
 * - Step 1: Send OTP
 * - Step 2: Verify OTP
 * - Step 3: Reset Password
 *
 * Props:
 *  open: boolean
 *  onClose: () => void
 *  defaultEmail?: string
 *  onSuccess?: () => void (optional: called after password reset success)
 */

const isValidEmail = (v) => /^\S+@\S+\.\S+$/.test(String(v || "").trim());

const API = {
  sendOtp: "/user/forget-password",   // ✅ baseURL already has /api
  verifyOtp: "/user/verify-otp",
  resetPassword: "/user/reset-password",
};

export default function UserForget({
  open,
  onClose,
  defaultEmail = "",
  onSuccess,
}) {
  const [step, setStep] = useState(1); // 1 send | 2 verify | 3 reset
  const [email, setEmail] = useState(defaultEmail || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [cooldown, setCooldown] = useState(0); // resend timer seconds

  const cardRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setEmail(defaultEmail || "");
    setOtp("");
    setNewPassword("");
    setShowPass(false);
    setLoading(false);
    setMsg("");
    setErr("");
    setCooldown(0);
    setTimeout(() => cardRef.current?.focus?.(), 50);
  }, [open, defaultEmail]);

  useEffect(() => {
    if (!open) return;
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown, open]);

  const canSendOtp = useMemo(
    () => isValidEmail(email) && !loading,
    [email, loading]
  );

  const canVerifyOtp = useMemo(
    () => isValidEmail(email) && otp.trim().length >= 4 && !loading,
    [email, otp, loading]
  );

  const canReset = useMemo(
    () => isValidEmail(email) && newPassword.trim().length >= 6 && !loading,
    [email, newPassword, loading]
  );

  const closeIfBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const getAxiosMessage = (error, fallback) => {
    const msg =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      error?.message;
    return msg || fallback;
  };

  const onSendOtp = async (e) => {
    e?.preventDefault?.();
    setErr("");
    setMsg("");

    if (!isValidEmail(email)) {
      setErr("Enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.post(API.sendOtp, { email: email.trim() });

      setMsg("OTP sent successfully. Please check your email.");
      setStep(2);
      setCooldown(30);
    } catch (error) {
      setErr(getAxiosMessage(error, "Failed to send OTP."));
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (e) => {
    e?.preventDefault?.();
    setErr("");
    setMsg("");

    if (!isValidEmail(email)) return setErr("Enter a valid email address.");
    if (otp.trim().length < 4) return setErr("Enter the OTP.");

    try {
      setLoading(true);
      await axiosInstance.post(API.verifyOtp, {
        email: email.trim(),
        otp: otp.trim(),
      });

      setMsg("OTP verified. Now set a new password.");
      setStep(3);
    } catch (error) {
      setErr(getAxiosMessage(error, "OTP verification failed."));
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (e) => {
    e?.preventDefault?.();
    setErr("");
    setMsg("");

    if (!isValidEmail(email)) return setErr("Enter a valid email address.");
    if (newPassword.trim().length < 6)
      return setErr("Password must be at least 6 characters.");

    try {
      setLoading(true);
      await axiosInstance.post(API.resetPassword, {
        email: email.trim(),
        newPassword: newPassword.trim(),
      });

      setMsg("Password reset successful. You can login now.");
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 800);
    } catch (error) {
      setErr(getAxiosMessage(error, "Failed to reset password."));
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (cooldown > 0 || loading) return;
    setOtp("");
    await onSendOtp();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-6"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)" }}
      onMouseDown={closeIfBackdrop}
      role="dialog"
      aria-modal="true"
    >
      <div ref={cardRef} tabIndex={-1} className="w-full max-w-md outline-none">
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-2xl">
          {/* glow */}
          <div className="absolute -top-24 -left-24 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

          {/* header */}
          <div className="relative px-6 pt-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-white">
                  Forgot Password
                </h2>
                <p className="mt-1 text-sm text-white/70">
                  {step === 1 && "We’ll send an OTP to your email."}
                  {step === 2 && "Enter the OTP to verify your account."}
                  {step === 3 && "Set a strong new password."}
                </p>
              </div>

              <button
                onClick={onClose}
                className="rounded-xl px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 transition"
                aria-label="Close"
                disabled={loading}
              >
                ✕
              </button>
            </div>

            {/* stepper */}
            <div className="mt-5 flex items-center gap-2">
              <StepPill active={step >= 1} label="Email" />
              <div
                className={`h-[2px] flex-1 ${
                  step >= 2 ? "bg-white/70" : "bg-white/20"
                }`}
              />
              <StepPill active={step >= 2} label="OTP" />
              <div
                className={`h-[2px] flex-1 ${
                  step >= 3 ? "bg-white/70" : "bg-white/20"
                }`}
              />
              <StepPill active={step >= 3} label="Reset" />
            </div>
          </div>

          {/* body */}
          <div className="relative px-6 pb-6">
            {(err || msg) && (
              <div
                className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
                  err
                    ? "border-red-400/30 bg-red-500/10 text-red-100"
                    : "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
                }`}
              >
                <div className="font-semibold">{err ? "Action required" : "Done"}</div>
                <div className="mt-0.5 opacity-90">{err || msg}</div>
              </div>
            )}

            {/* Email */}
            <label className="block text-sm font-semibold text-white/85">
              Email
            </label>
            <div className="mt-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/35 focus:bg-white/15 transition"
                disabled={loading || step !== 1}
              />

              {step !== 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setNewPassword("");
                    setMsg("");
                    setErr("");
                    setCooldown(0);
                  }}
                  className="mt-2 text-xs font-semibold text-white/75 hover:text-white underline underline-offset-4"
                  disabled={loading}
                >
                  Change email
                </button>
              )}
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <form onSubmit={onSendOtp} className="mt-5">
                <button
                  type="submit"
                  disabled={!canSendOtp}
                  className={`w-full rounded-2xl px-4 py-3 font-extrabold tracking-wide transition ${
                    canSendOtp
                      ? "bg-white text-black hover:opacity-95"
                      : "bg-white/20 text-white/50 cursor-not-allowed"
                  }`}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>

                <p className="mt-3 text-xs text-white/60">
                  Tip: Check spam/junk if you don’t see the OTP.
                </p>
              </form>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <form onSubmit={onVerifyOtp} className="mt-5">
                <label className="block text-sm font-semibold text-white/85">
                  OTP
                </label>

                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\s/g, ""))}
                    inputMode="numeric"
                    placeholder="Enter OTP"
                    className="flex-1 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/35 focus:bg-white/15 transition"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    onClick={onResend}
                    disabled={loading || cooldown > 0}
                    className={`rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                      cooldown > 0
                        ? "bg-white/10 text-white/40 cursor-not-allowed"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                    title="Resend OTP"
                  >
                    {cooldown > 0 ? `Resend (${cooldown})` : "Resend"}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!canVerifyOtp}
                  className={`mt-4 w-full rounded-2xl px-4 py-3 font-extrabold tracking-wide transition ${
                    canVerifyOtp
                      ? "bg-white text-black hover:opacity-95"
                      : "bg-white/20 text-white/50 cursor-not-allowed"
                  }`}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setMsg("");
                    setErr("");
                  }}
                  disabled={loading}
                  className="mt-3 w-full rounded-2xl px-4 py-3 font-extrabold tracking-wide bg-white/10 text-white/80 hover:bg-white/15 transition"
                >
                  Back
                </button>
              </form>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <form onSubmit={onResetPassword} className="mt-5">
                <label className="block text-sm font-semibold text-white/85">
                  New Password
                </label>

                <div className="mt-2 relative">
                  <input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type={showPass ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 pr-16 text-white placeholder:text-white/40 outline-none focus:border-white/35 focus:bg-white/15 transition"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-xs font-extrabold text-white/80 hover:bg-white/10 hover:text-white transition"
                    disabled={loading}
                  >
                    {showPass ? "HIDE" : "SHOW"}
                  </button>
                </div>

                <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                  Use a strong password (letters + numbers). Avoid your name/email.
                </div>

                <button
                  type="submit"
                  disabled={!canReset}
                  className={`mt-4 w-full rounded-2xl px-4 py-3 font-extrabold tracking-wide transition ${
                    canReset
                      ? "bg-white text-black hover:opacity-95"
                      : "bg-white/20 text-white/50 cursor-not-allowed"
                  }`}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(2);
                    setNewPassword("");
                    setMsg("");
                    setErr("");
                  }}
                  disabled={loading}
                  className="mt-3 w-full rounded-2xl px-4 py-3 font-extrabold tracking-wide bg-white/10 text-white/80 hover:bg-white/15 transition"
                >
                  Back
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-3 text-center text-xs text-white/55">
          Secure verification • OTP expires as per server policy
        </div>
      </div>
    </div>
  );
}

function StepPill({ active, label }) {
  return (
    <div
      className={`rounded-full px-3 py-1 text-xs font-extrabold tracking-wide border transition ${
        active
          ? "border-white/40 bg-white/20 text-white"
          : "border-white/15 bg-white/5 text-white/50"
      }`}
    >
      {label}
    </div>
  );
}
