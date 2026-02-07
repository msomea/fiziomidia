import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import { Link } from "react-router";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const ForumSubManagement = () => {
  const { user } = useAuth();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;

    const fetchSubs = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        const res = await axios.get("/api/forum/my-subs", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) setSubs(res.data.subs);
      } catch (err) {
        console.error("Failed to fetch subs:", err);
        toast.error("Failed to fetch your subs");
      } finally {
        setLoading(false);
      }
    };

    fetchSubs();
  }, [user]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="animate-spin w-6 h-6 text-caribbean" />
      </div>
    );

  if (!subs.length)
    return <p className="text-gray-500">You haven't created any subs yet.</p>;

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold mb-2">Forum Sub Management</h2>
      {subs.map((sub) => (
        <Link
          key={sub._id}
          to={`/forum/sub/${sub._id}/manage`}
          className="block bg-white shadow rounded-lg p-3 hover:bg-alice transition-colors"
        >
          <div className="flex justify-between items-center">
            <span className="font-medium text-black">{sub.title}</span>
            <span className="text-gray-400 text-sm">
              {sub.rules?.length} rule{sub.rules?.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-gray-500 text-sm line-clamp-2">{sub.description}</p>
        </Link>
      ))}
    </div>
  );
};

export default ForumSubManagement;
