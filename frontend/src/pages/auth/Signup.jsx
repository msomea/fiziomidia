import { useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { EyeOff, Eye } from "lucide-react";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";

export default function Signup() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth(); // optional

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post(`${API_URL}/auth/register`, {
        fullName: name,
        email,
        password,
      });

      toast.success(t("registration_success_verify"));
      navigate("/login");

    } catch (err) {
      console.error("Signup error:", err);
      toast.error(err.response?.data?.error || t("registration_failed"));
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
          {t("sign_up")}
        </h2>

        {/* Full Name */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {t("full_name")}
          </label>
          <input
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {t("email_label")}
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
            {t("password")}
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-caribbean text-white font-bold py-2 px-4 rounded hover:bg-tufts"
        >
          {loading ? t("signing_up") : t("sign_up")}
        </button>

        <p className="mt-4 text-black text-center text-sm">
          {t("already_have_account")}{" "}
          <a href="/login" className="text-caribbean hover:text-tufts">
            {t("login")}
          </a>
        </p>
      </form>
    </div>
  );
}
