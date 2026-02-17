import { ShieldCheck, User, Stethoscope } from "lucide-react";
import { useTranslation } from "react-i18next";

const ROLE_CONFIG = (t) => ({
  admin: { label: t("role_admin"), Icon: ShieldCheck, color: "text-red-600" },
  physiotherapist: { label: t("role_physiotherapist"), Icon: Stethoscope, color: "text-blue-600" },
  member: { label: t("role_member"), Icon: User, color: "text-green-600" },
});

const ProfileBadge = ({ role, showTooltip = true }) => {
  const { t } = useTranslation();

  if (!role) return null;

  const key = role.toLowerCase();
  const config = ROLE_CONFIG(t)[key];

  if (!config) return null;

  const { label, Icon, color } = config;

  return (
    <div className="relative inline-flex">
      {/* Only the icon */}
      <Icon className={`${color}`} size={18} />

      {/* Tooltip (conditionally rendered) */}
      {showTooltip && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 
                         whitespace-nowrap rounded bg-gray-900 px-2 py-1 
                         text-xs text-white opacity-0 group-hover:opacity-100
                         transition-opacity duration-200 pointer-events-none">
          {label}
        </span>
      )}
    </div>
  );
};

export default ProfileBadge;
