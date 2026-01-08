import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const value = email.trim();

    if (!value) {
      toast.error("Please enter your email");
      return;
    }

    if (!emailRegex.test(value)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      toast.loading("Sending reset link...", { toastId: "reset" });

      // Frontend-only placeholder (replace with API call)
      await new Promise((res) => setTimeout(res, 1500));

      toast.update("reset", {
        render: "If this email exists, a reset link has been sent 📧",
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });

      setEmail("");
    } catch {
      toast.update("reset", {
        render: "Failed to send reset link",
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <svg className="w-full h-full object-cover" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="pattern-bg"
              x="0"
              y="0"
              width="30"
              height="30"
              patternUnits="userSpaceOnUse"
            >
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
          Forgot Password
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Enter your email to receive a password reset link.
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="peer w-full border border-gray-300 rounded-lg px-4 py-3 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 transition disabled:opacity-60"
              required
            />
            <label className="absolute left-4 top-3 text-gray-400 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm peer-focus:top-[-0.5rem] peer-focus:text-indigo-500 peer-focus:text-xs">
              Email
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg disabled:opacity-60"
          >
            {loading ? "Sending..." : "Request Reset"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-indigo-600">
          <Link to="/login" className="hover:underline font-medium">
            Back to Login
          </Link>
        </div>

        <p className="mt-6 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} BulkSMS Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
}
