import { useCallback, useEffect, useMemo, useState } from "react";
import { useDashboard } from "../../contexts/DashboardContext";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import CollapsibleSection from "./CollapsibleSection";
import SectionSkeleton from "./SectionSkeleton";
import TeamMemberFormModal from "./TeamMemberFormModal";
import {
  adminFetchTeamMembers,
  adminDeleteTeamMember,
} from "../../api/teamMembers";

export default function TeamMembersSection() {
  const { t } = useTranslation();
  const { teamMembers, loading: dashboardLoading } = useDashboard();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await adminFetchTeamMembers();
      setMembers(result.members || []);
    } catch (err) {
      console.error("Failed to load team members:", err);
      toast.error(t("team_load_failed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Seed local list from dashboard context
  useEffect(() => {
    if (Array.isArray(teamMembers) && teamMembers.length > 0) {
      setMembers(teamMembers);
    }
  }, [teamMembers]);

  // No mount fetch — data comes from the dashboard endpoint; refresh/save/delete call this section's API


  const stats = useMemo(() => {
    return {
      total: members.length,
      active: members.filter((member) => member.isActive).length,
      inactive: members.filter((member) => !member.isActive).length,
    };
  }, [members]);

  const openCreate = () => {
    setEditingMember(null);
    setModalOpen(true);
  };

  const openEdit = (member) => {
    setEditingMember(member);
    setModalOpen(true);
  };

  const handleSaved = () => {
    loadMembers();
  };

  const handleDelete = async (member) => {
    if (!window.confirm(t("team_delete_confirm", { name: member.name }))) return;

    try {
      setDeletingId(member._id);
      await adminDeleteTeamMember(member._id);
      toast.success(t("team_member_deleted"));
      loadMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || t("team_delete_failed"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <CollapsibleSection title={t("team_admin_title")}>
      <div className="flex justify-between items-center mb-3 gap-2">
        <button
          onClick={loadMembers}
          className="btn btn-xs btn-ghost text-caribbean"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={openCreate}
          className="btn btn-xs bg-caribbean text-white border-none hover:bg-tufts"
        >
          <Plus className="w-4 h-4" /> {t("team_add_member")}
        </button>
      </div>

      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            ["team_total_members", stats.total],
            ["team_active_members", stats.active],
            ["team_inactive_members", stats.inactive],
          ].map(([key, value]) => (
            <div key={key} className="bg-alice rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-caribbean">{value}</p>
              <p className="text-[10px] text-gray-500">{t(key)}</p>
            </div>
          ))}
        </div>
      )}

      {loading || (dashboardLoading && members.length === 0) ? (
        <SectionSkeleton count={3} />
      ) : members.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          {t("team_no_members")}
        </p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {members.map((member) => (
            <div
              key={member._id}
              className="border border-gray-200 rounded-xl p-3 flex gap-4"
            >
              <img
                src={member.image}
                alt={member.name}
                className="w-16 h-16 rounded-xl object-cover border flex-shrink-0"
              />
              <div className="text-sm flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-caribbean truncate">
                      {member.name}
                    </h3>
                    <p className="text-tufts">{member.title}</p>
                    <p className="text-gray-500 truncate">{member.email}</p>
                    {member.bio && (
                      <p className="text-gray-500 line-clamp-1 mt-1">
                        {member.bio}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {t("team_sort_order")}: {member.sortOrder}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded text-white flex-shrink-0 ${
                      member.isActive ? "bg-green-600" : "bg-gray-500"
                    }`}
                  >
                    {member.isActive ? t("team_active") : t("team_inactive")}
                  </span>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEdit(member)}
                    className="btn btn-xs btn-outline border-caribbean text-caribbean hover:bg-caribbean hover:text-white"
                  >
                    <Pencil className="w-3 h-3" /> {t("edit")}
                  </button>
                  <button
                    onClick={() => handleDelete(member)}
                    disabled={deletingId === member._id}
                    className="btn btn-xs btn-outline border-red-500 text-red-600 hover:bg-red-500 hover:text-white disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" /> {t("delete")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <TeamMemberFormModal
          member={editingMember}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </CollapsibleSection>
  );
}
