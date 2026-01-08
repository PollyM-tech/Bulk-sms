// src/pages/auth/ResetPassword.tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return alert("Please fill in all fields.");
    if (password.length < 6) return alert("Password must be at least 6 characters.");
    if (password !== confirmPassword) return alert("Passwords do not match.");

    console.log("Resetting password with token:", token, password);
    setMessage("Password successfully reset!");
    setTimeout(() => navigate("/login"), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <svg className="w-full h-full object-cover" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pattern-bg" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#e0e7ff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pattern-bg)" />
        </svg>
      </div>

      {/* Form container */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 sm:p-12">
        {/* Top icon */}
        <div className="flex justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-12 h-12 text-indigo-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 12a4 4 0 11-8 0 4 4 0 018 0zM12 16v4m0-4H8m4 0h4"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Reset Password
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Enter your new password below.
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* New Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="peer w-full border border-gray-300 rounded-lg px-4 py-3 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 transition pr-12"
              required
            />
            <label className="absolute left-4 top-3 text-gray-400 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm peer-focus:top-[-0.5rem] peer-focus:text-indigo-500 peer-focus:text-xs">
              New Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-500"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.418 0-8-3.582-8-8 0-.778.121-1.528.344-2.242M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 2l20 20" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="peer w-full border border-gray-300 rounded-lg px-4 py-3 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 transition pr-12"
              required
            />
            <label className="absolute left-4 top-3 text-gray-400 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm peer-focus:top-[-0.5rem] peer-focus:text-indigo-500 peer-focus:text-xs">
              Confirm New Password
            </label>
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-500"
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.418 0-8-3.582-8-8 0-.778.121-1.528.344-2.242M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 2l20 20" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg"
          >
            Reset Password
          </button>
        </form>

        {message && <p className="mt-4 text-green-600 text-center">{message}</p>}

        <div className="mt-4 text-center text-sm text-indigo-600">
          <a href="/login" className="hover:underline font-medium">
            Back to Login
          </a>
        </div>

        <p className="mt-6 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} BulkSMS Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
}
