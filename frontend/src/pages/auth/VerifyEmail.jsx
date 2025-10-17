import { useState } from "react";
import axios from "axios";
import AuthForm from "../../components/auth/AuthForm";
import toast from "react-hot-toast";

export default function VerifyEmail() {
  const [verified, setVerified] = useState(false);

  const handleVerify = async (data) => {
    try {
      await axios.post("/api/auth/verify-email", {
        email: data.email,
        code: data.code,
      });
      setVerified(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    }
  };

  if (verified)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Email Verified!</h2>
          <p>You can now log in to your account.</p>
        </div>
      </div>
    );

  return (
    <AuthForm
      title="Verify Your Email"
      buttonLabel="Verify"
      onSubmit={handleVerify}
      fields={[
        { name: "email", label: "Email", type: "email" },
        { name: "code", label: "Verification Code", type: "text" },
      ]}
    />
  );
}
