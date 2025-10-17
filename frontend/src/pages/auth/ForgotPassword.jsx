import axios from "axios";
import { useState } from "react";
import AuthForm from "../../components/auth/AuthForm";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);

  const handleForgotPassword = async (data) => {
    try {
      await axios.post("/api/auth/forgot-password", { email: data.email });
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  if (submitted)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Check your email</h2>
          <p>We’ve sent you a link to reset your password.</p>
        </div>
      </div>
    );

  return (
    <AuthForm
      title="Forgot Password"
      buttonLabel="Send Reset Link"
      onSubmit={handleForgotPassword}
      fields={[{ name: "email", label: "Email", type: "email" }]}
    />
  );
}
