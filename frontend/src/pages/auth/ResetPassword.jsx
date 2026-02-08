import { useState } from "react";
import { useParams, Link } from "react-router";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import AuthForm from "../../components/auth/AuthForm";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const { token } = useParams();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await API.post(`${API_URL}/auth/reset-password/${token}`, {
        newPassword: data.password,
      });

      setSuccess(true);
      toast.success("Password reset successful!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-white">
        <div className="bg-gray-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl text-caribbean font-bold mb-4">Password Updated</h2>
          <p className="mb-6 text-tufts">You can now log in with your new password.</p>
          <Link
            to="/login"
            className="bg-caribbean hover:bg-tufts text-white px-6 py-3 rounded-xl"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AuthForm
      title="Reset Your Password"
      buttonLabel="Reset Password"
      onSubmit={handleSubmit}
      fields={[
        { name: "password", label: "New Password", type: "password" },
        {
          name: "confirmPassword",
          label: "Confirm Password",
          type: "password",
        },
      ]}
    />
  );
}
