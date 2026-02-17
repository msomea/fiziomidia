import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function MessageRouterPage() {
  const { receiverId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const loadConversation = async () => {
      try {
        // 1. Try fetch existing conversation with this user
        const res = await API.get(`${API_URL}/conversations/user/${receiverId}`);
        const conversation = res.data;
        // Navigate using receiverId (otherUserId), not conversation._id
        return navigate(`/messages/${receiverId}`);
      } catch (err) {
        if (err.response?.status === 404) {
          // 2. Create new conversation
          try {
            const createRes = await API.post(`${API_URL}/conversations`, {
              receiver: receiverId,
            });
            // Navigate using receiverId (otherUserId), not conversation._id
            return navigate(`/messages/${receiverId}`);
          } catch (createErr) {
            console.error("Error creating conversation:", createErr);
            navigate("/messages");
          }
        } else {
          // Handle non-404 errors
          console.error("Error loading conversation:", err);
          navigate("/messages");
        }
      }
    };

    loadConversation();
  }, [receiverId, navigate]);

  return <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">{t("loading")}</p>
      </div>;
}
