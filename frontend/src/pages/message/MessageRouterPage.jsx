import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import API from "../../api/axios";

export default function MessageRouterPage() {
  const { receiverId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const loadConversation = async () => {
      try {
        // 1. Try fetch existing
        const res = await API.get(`/conversations/user/${receiverId}`);
        const conversation = res.data;
        return navigate(`/messages/${conversation._id}`);
      } catch (err) {
        if (err.response?.status === 404) {
          // 2. Create new
          const createRes = await API.post("/conversations", {
            receiver: receiverId,
          });
          return navigate(`/messages/${createRes.data._id}`);
        }
      }
    };

    loadConversation();
  }, [receiverId]);

  return <div className="p-4 text-center">Loading...</div>;
}
