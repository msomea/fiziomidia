import React, { useEffect, useState } from "react";
import ForumTopics from "../../components/forum/ForumTopics";
import ForumList from "../../components/forum/ForumList";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useForum } from "../../context/ForumContext";
import API from "../../api/axios";
import toast from "react-hot-toast";

const Forum = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { posts, fetchPosts, fetchSub, selectedSub, loadingPosts } = useForum();
  const [requesting, setRequesting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  const handleSelectTopic = async (topic) => {
    await fetchSub(topic._id);
    await fetchPosts(topic._id);
    checkModRequestStatus(topic._id);
  };

  // Check if user already requested to be a mod
  const checkModRequestStatus = async (subId) => {
    if (!user || user.role !== "physiotherapist") return;

    try {
      const res = await API.get(`/forum/subs/${subId}/my-mod-request`);
      setHasRequested(res.data.requested || false);
    } catch (err) {
      console.error("Failed to check mod request:", err);
    }
  };

  // Request to become sub moderator
  const requestModerator = async () => {
    if (!selectedSub) return;
    setRequesting(true);

    try {
      const res = await API.post(`/forum/subs/${selectedSub._id}/mod-requests`);
      if (res.data.success) {
        toast.success("Moderator request sent successfully");
        setHasRequested(true);
      } else {
        toast.error(res.data.error || "Request failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send mod request");
    } finally {
      setRequesting(false);
    }
  };

  // Conditions for showing the button:
  const showRequestButton =
    user?.role === "physiotherapist" &&
    selectedSub &&
    !selectedSub.moderators?.some((m) => m._id === user._id) &&
    selectedSub.createdBy?._id !== user._id;

  return (
    <div className="min-h-screen bg-alice mt-20 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-caribbean">Forum</h1>

          <div className="flex gap-2">
            {["physiotherapist", "admin"].includes(user.role) && (
              <button
                onClick={() => navigate("/forum/create")}
                className="btn p-2 bg-caribbean text-white hover:bg-tufts"
              >
                New Post
              </button>
            )}

            {showRequestButton && (
              <button
                onClick={requestModerator}
                disabled={requesting || hasRequested}
                className={`btn p-2 ${
                  hasRequested ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-800"
                } text-white`}
              >
                {hasRequested ? "Request Sent" : requesting ? "Sending..." : "Request Moderator"}
              </button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <ForumTopics onSelectTopic={handleSelectTopic} />
          </div>

          <div className="md:col-span-2">
            <ForumList
              user={user}
              posts={posts}
              loading={loadingPosts || !selectedSub}
              currentTopic={selectedSub}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;
