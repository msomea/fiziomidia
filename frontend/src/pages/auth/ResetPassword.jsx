import { useParams, useNavigate } from "react-router";
import axios from "axios";
import AuthForm from "../../components/auth/AuthForm";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const handleReset = async (data) => {
    try {
      await axios.post(`/api/auth/reset-password/${token}`, {
        password: data.password,
      });
      toast.success("Password reset successful! You can now log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    }
  };

  return (
    <AuthForm
      title="Reset Your Password"
      buttonLabel="Reset Password"
      onSubmit={handleReset}
      fields={[{ name: "password", label: "New Password", type: "password" }]}
    />
  );
}
