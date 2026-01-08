import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/UseAuth";
import { toast } from "react-toastify";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone: string) =>
    /^\+?\d{7,15}$/.test(phone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const input = emailOrPhone.trim();

    if (!input) {
      toast.error("Please enter your email or phone number");
      return;
    }

    if (!validateEmail(input) && !validatePhone(input)) {
      toast.error("Invalid email or phone number");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      await login(input, password);

      toast.success("Login successful 🎉");
      navigate("/dashboard");
    } catch {
      toast.error("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const toastId = "google-login";

    try {
      setGoogleLoading(true);
      toast.loading("Signing in with Google...", { toastId });

      await loginWithGoogle();

      toast.update(toastId, {
        render: "Google login successful 🚀",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      navigate("/dashboard");
    } catch {
      toast.update(toastId, {
        render: "Google login failed",
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
      {/* Left Illustration Panel */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden flex-col justify-center items-center text-white p-10">
        <div className="absolute w-72 h-72 bg-white/20 rounded-full top-10 left-10 animate-float-slow" />
        <div className="absolute w-64 h-64 bg-white/10 rounded-full top-64 left-32 animate-float" />
        <div className="absolute w-96 h-96 bg-white/5 rounded-full bottom-20 right-10 animate-float-reverse" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-16 h-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 14a4 4 0 01-8 0m8-4a4 4 0 10-8 0 4 4 0 008 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 14v7m-4-4h8"
            />
          </svg>
          <h2 className="text-3xl font-bold">Welcome Back</h2>
          <p className="text-sm max-w-xs">
            Sign in to your account to manage your SMS campaigns efficiently.
          </p>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 relative z-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Sign in
          </h1>
          <p className="text-center text-gray-500 mb-6">
            Enter your credentials to continue.
          </p>

          {/* Google Sign-In */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 mb-5 rounded-xl border border-gray-300 hover:bg-gray-100 transition disabled:opacity-60"
          >
            {googleLoading ? (
              <span className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full" />
            ) : (
              <>
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                Sign in with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center text-sm text-gray-400 my-4">
            <span className="flex-1 h-px bg-gray-300"></span>
            <span className="px-3">or continue with email</span>
            <span className="flex-1 h-px bg-gray-300"></span>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Email or Phone"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition placeholder-gray-400"
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition placeholder-gray-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-gray-500">
            <Link
              to="/forgot-password"
              className="block text-indigo-600 hover:underline"
            >
              Forgot password?
            </Link>
            <p>
              Don’t have an account?{" "}
              <Link
                to="/signup"
                className="text-indigo-600 font-medium hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-gray-400 text-xs">
            &copy; {new Date().getFullYear()} BulkSMS Platform. All rights
            reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
