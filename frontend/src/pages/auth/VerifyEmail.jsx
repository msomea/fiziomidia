import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { useTranslation } from 'react-i18next'
import { Loader2 } from "lucide-react";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import toast from "react-hot-toast";

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading"); 
  const { t } = useTranslation()
  // loading | success | error

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await API.get(`${API_URL}/auth/verify-email/${token}`);
        toast.success(res.data.message || t('email_verified'));
        setStatus("success");
      } catch (err) {
        toast.error(err.response?.data?.message || t('verification_failed'));
        setStatus("error");
      }
    };

    if (token) verify();
  }, [token]);

  // ---------- Loading ----------
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-white">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">{t('loading')}</p>
      </div>
    );
  }

  // ---------- Success ----------
  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-white">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl text-caribbean font-bold mb-2">{t('email_verified')}</h2>
          <p className="mb-6 text-tufts
          ">{t('account_active')}</p>
          <Link
            to="/login"
            className="bg-caribbean hover:bg-tufts text-white px-6 py-3 rounded-xl"
          >
            {t('go_to_login')}
          </Link>
        </div>
      </div>
    );
  }

  // ---------- Error ----------
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-white">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl text-caribbean font-bold mb-2">{t('verification_failed_title')}</h2>
        <p className="mb-6 text-tufts">{t('verification_link_invalid')}</p>

        <Link
          to="/forgot-password"
          className="bg-caribbean hover:bg-tufts text-white px-6 py-3 rounded-xl"
        >
          {t('resend_verification_email')}
        </Link>
      </div>
    </div>
  );
}
