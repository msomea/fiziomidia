import { useState } from "react";
import API from "../../api/axios";
import AuthForm from "../../components/auth/AuthForm";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);

  const handleSubmit = async (data) => {
    try {
      await API.post("/auth/forgot-password", {
        email: data.email,
      });

      setSent(true);
      toast.success("Reset link sent to your email");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  if (sent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-white">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl text-caribbean font-bold mb-4">Check Your Email</h2>
          <p className="text-tufts">
            If an account with that email exists, you’ll receive a password reset
            link shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthForm
      title="Forgot Password"
      buttonLabel="Send Reset Link"
      onSubmit={handleSubmit}
      fields={[
        { name: "email", label: "Email", type: "email", placeholder: "Enter your email"},
      ]}
    />
  );
}
