import { useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { EyeOff, Eye } from "lucide-react";
import API from "../../api/axios"; // use same axios instance
import { useAuth } from "../../context/AuthContext"; // optional for auto-login

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth(); // optional — for auto login after signup

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Send registration data
      const res = await API.post("/auth/register", {
        fullName: name,
        email,
        password,
      });

      toast.success("Registration successfu! Please verify your email before logging in.");
      navigate("/login");
      
    } catch (err) {
      console.error("Signup error:", err);
      toast.error(err.response?.data?.error || "Registration failed");
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
          Sign Up
        </h2>

        {/* ✅ Full Name */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Full Name
          </label>
          <input
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* ✅ Email */}
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

        {/* ✅ Password */}
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

        {/* ✅ Submit */}
        <button
          type="submit"
          className="w-full bg-caribbean text-white font-bold py-2 px-4 rounded hover:bg-tufts"
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        <p className="mt-4 text-black text-center text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-caribbean hover:text-tufts">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}
