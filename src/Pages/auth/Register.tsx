import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/UseAuth";
import { toast } from "react-toastify";

export default function RegisterPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await signup({ email, phone, password });

      toast.success("Account created successfully 🎉");
      navigate("/dashboard");
    } catch {
      toast.error("Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    const toastId = "google-signup";

    try {
      setGoogleLoading(true);
      toast.loading("Signing up with Google...", { toastId });

      // Frontend-only placeholder
      await new Promise((res) => setTimeout(res, 1500));

      toast.update(toastId, {
        render: "Google signup successful 🚀",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      navigate("/dashboard");
    } catch {
      toast.update(toastId, {
        render: "Google signup failed",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Illustration */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden flex-col justify-center items-center text-white p-10">
        <div className="absolute w-72 h-72 bg-white/20 rounded-full top-10 left-10 animate-float-slow" />
        <div className="absolute w-64 h-64 bg-white/10 rounded-full top-64 left-32 animate-float" />
        <div className="absolute w-96 h-96 bg-white/5 rounded-full bottom-20 right-10 animate-float-reverse" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <svg
            className="w-16 h-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <h2 className="text-3xl font-bold">Create Your Own Account</h2>
          <p className="text-sm max-w-xs">
            Sign up to start sending SMS campaigns quickly and easily.
          </p>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10">
          <h1 className="text-3xl font-bold text-center mb-2">
            Create Account
          </h1>
          <p className="text-center text-gray-500 mb-6">
            Start sending SMS campaigns in minutes.
          </p>

          {/* Google Signup */}
          <button
            onClick={handleGoogleSignup}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 border rounded-xl py-3 hover:bg-gray-50 transition font-medium disabled:opacity-60"
          >
            {googleLoading ? (
              <span className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path
                    fill="#FFC107"
                    d="M43.6 20.1H24v8h11.3C33.8 32.4 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.2l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.5 0 19-8.5 19-19 0-1.3-.1-2.6-.4-3.9z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-sm">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-400"
            />

            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-400"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-400"
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-400"
            />

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:from-indigo-600 hover:to-purple-600 transition disabled:opacity-60 flex items-center justify-center"
            >
              {loading ? (
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-indigo-600 font-medium hover:underline"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
