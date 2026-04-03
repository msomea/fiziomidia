import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { API_URL } from "../../config/constants";
import { X, Loader2 } from "lucide-react";
import { useTranslation } from 'react-i18next'

export default function ForumModRequestsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [loading, setLoading] = useState(false);

  const { t } = useTranslation()

  useEffect(() => {
    loadRequest();
  }, []);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const res = await API.get(`${API_URL}/admin/forum/mod-requests/${id}`);
      setRequest(res.data.request);
      setNewRole(res.data.request.role); // current requested role
    } catch (err) {
      toast.error(t('failed_load_request'));
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async () => {
    try {
      await API.put(`${API_URL}/admin/forum/mod-requests/${id}/role`, { role: newRole });
      toast.success(t('request_role_updated'));
      loadRequest();
    } catch (err) {
      toast.error(t('failed_update_role'));
    }
  };

  if (loading || !request) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">{t('loading_request')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 mt-20 max-w-3xl mx-auto border rounded-lg shadow bg-gray-50">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold text-caribbean">{t('mod_request_details')}</h2>
        <button onClick={() => navigate(-1)}>
          <X className="text-red-500 hover:text-red-800" />
        </button>
      </div>

      <div className="space-y-4 text-tufts">
        <p><b>{t('user_label')}</b> {request.user.fullName}</p>
        <p><b>{t('sub_label')}</b> {request.sub.title?.en || request.sub.title}</p>
        <p><b>{t('current_status')}</b> {request.status}</p>
        <p><b>{t('current_role')}</b> {request.role}</p>

        <div className="mt-3">
          <label className="block font-medium mb-1">{t('assign_role')}</label>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="member">{t('role_member')}</option>
            <option value="sub_mod">{t('role_sub_mod')}</option>
            <option value="mod">{t('role_mod')}</option>
          </select>
          <button
            onClick={updateRole}
            className="ml-3 bg-blue-600 text-white px-3 py-1 rounded"
          >
            {t('update_role')}
          </button>
        </div>
      </div>
    </div>
  );
}
