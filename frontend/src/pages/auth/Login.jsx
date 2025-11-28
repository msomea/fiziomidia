import { useState } from "react";
import { Link, useNavigate } from "react-router";
import toast from "react-hot-toast";
import { EyeOff, Eye } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Local states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call AuthContext login with credentials
      const user = await login({ email, password });

      toast.success("Login successful!");

      // Redirect based on role
      if (user.role === "physiotherapist")
        navigate(`/dashboard/pt/${user._id}`);
      else if (user.role === "member")
        navigate(`/dashboard/member/${user._id}`);
      else if (user.role === "admin") navigate(`/dashboard/admin`);
      else navigate("/");

    } catch (err) {
      console.error("Login failed:", err);
      toast.error(err.response?.data?.error || err.message );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-md"
      >
        <h2 className="text-2xl text-black font-bold mb-6 text-center">
          Login
        </h2>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Password */}
        <div className="mb-4 relative">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-2 top-9 text-gray-500"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>

        <div className="mb-4 text-sm text-right">
          <Link to="/forgot-password" className="text-caribbean hover:text-tufts">
            Forgot password?
          </Link>
        </div>

        {/* ✅ Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-caribbean text-white font-bold py-2 px-4 rounded hover:bg-tufts"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm text-black mt-6 text-right">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-caribbean hover:underline">
            Signup
          </Link>
        </p>
      </form>
    </div>
  );
}
