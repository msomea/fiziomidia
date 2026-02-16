import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const EditPostPage = () => {
  const { postId, ptId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [post, setPost] = useState(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await API.get(`${API_URL}/forum/posts/${postId}`);
        setPost(res.data);
        setTitle(res.data.title);
        setBody(res.data.body);
      } catch (err) {
        console.error("Error fetching post:", err);
        toast.error(t("failed_load_post"));
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put(`${API_URL}/forum/posts/${postId}`, { title, body });
      toast.success(t("post_updated_successfully"));
      navigate(`/forum/pt/posts/${ptId}`);
    } catch (err) {
      console.error("Update error:", err);
      toast.error(t("failed_update_post"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">
          {t("loading_posts")}
        </p>
      </div>
    );
  }

  if (!post) {
    return (
      <p className="text-center mt-6 text-red-500">
        {t("post_not_found")}
      </p>
    );
  }

  return (
    <div className="max-w-3xl mt-20 mx-auto p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl text-caribbean font-semibold mb-4">
        {t("edit_post")}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-caribbean font-medium mb-1">
            {t("title_label")}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
            required
          />
        </div>

        <div>
          <label className="block text-caribbean font-medium mb-1">
            {t("content_label")}
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows="8"
            className="w-full p-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
            required
          ></textarea>
        </div>

        <div className="flex justify-end space-x-3 mt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-red-500 border rounded hover:bg-gray-100 hover:text-caribbean"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? t("saving") : t("save_changes")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPostPage;
