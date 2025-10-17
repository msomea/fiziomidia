import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { loginUser } from "../../api/auth";
import toast from "react-hot-toast";
import { EyeOff, Eye } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // rename
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send "password", not "passwordHash"
      const res = await loginUser({ email, password });
      // Store token & user in localStorage
      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      localStorage.setItem("user", JSON.stringify(res.user));

      toast.success("Login successful!");
      setLoading(false);

      // Redirect to Dashboard based on role
      if (res.user.role === "physiotherapist")
        navigate(`/dashboard/pt/${res.user._id}`);
      else if (res.user.role === "member")
        navigate(`/dashboard/member/${res.user._id}`);
      else if (res.user.role === "admin") navigate(`/dashboard/admin`);
      else navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <form
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-md"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl text-black font-bold mb-6 text-center">Login</h2>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-4 relative">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            value={password} // updated
            onChange={(e) => setPassword(e.target.value)} // updated
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
          <a
            href="/forgot-password"
            className="text-caribbean hover:text-tufts"
          >
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          className="w-full bg-caribbean text-white font-bold py-2 px-4 rounded hover:bg-tufts"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm text-black mt-6 text-right">
          Don't have an account?{" "}
          <Link to="/signup" className="text-caribbean hover:underline">
            Signup
          </Link>
        </p>
      </form>
    </div>
  );
}
