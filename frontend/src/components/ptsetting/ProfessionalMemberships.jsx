import React, { useState } from "react";
import { Plus, X, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const ProfessionalMembershipsSection = ({ formData, setFormData }) => {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(true);
  const [newMembership, setNewMembership] = useState({ organization: "", role: "" });
  const [memberships, setMemberships] = useState(formData.memberships || []);

  const addMembership = () => {
    if (!newMembership.organization) {
      toast.error(t("enter_organization_name"));
      return;
    }
    const updated = [...memberships, newMembership];
    setMemberships(updated);
    setFormData(prev => ({ ...prev, memberships: updated }));
    setNewMembership({ organization: "", role: "" });
    toast.success(t("membership_added"));
  };

  const removeMembership = (index) => {
    const updated = memberships.filter((_, i) => i !== index);
    setMemberships(updated);
    setFormData(prev => ({ ...prev, memberships: updated }));
    toast.success(t("membership_removed"));
  };

  return (
    <div className="card bg-white shadow-md p-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <h2 className="text-xl font-bold text-caribbean">{t("professional_memberships")}</h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {memberships.map((m, i) => (
            <div key={i} className="flex justify-between items-center p-2 bg-alice rounded-lg">
              <span>
                {m.organization} {m.role && `- ${m.role}`}
              </span>
              <button
                onClick={() => removeMembership(i)}
                className="text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder={t("organization")}
              value={newMembership.organization}
              onChange={(e) => setNewMembership(prev => ({ ...prev, organization: e.target.value }))}
              className="input input-bordered w-full text-sm"
            />
            <input
              type="text"
              placeholder={t("role_position")}
              value={newMembership.role}
              onChange={(e) => setNewMembership(prev => ({ ...prev, role: e.target.value }))}
              className="input input-bordered w-full text-sm"
            />
          </div>

          <button
            type="button"
            onClick={addMembership}
            className="btn bg-caribbean text-white w-full hover:bg-tufts flex items-center justify-center gap-2"
          >
            <Plus size={18} /> {t("add_membership")}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfessionalMembershipsSection;
