import { ShieldCheck, User, Stethoscope } from "lucide-react";

const ROLE_CONFIG = {
  admin: {
    label: "Admin",
    className: "badge badge-error text-white",
    Icon: ShieldCheck,
  },
  physiotherapist: {
    label: "Physiotherapist",
    className: "badge badge-info text-white",
    Icon: Stethoscope,
  },
  member: {
    label: "Member",
    className: "badge badge-success text-white",
    Icon: User,
  },
};

const ProfileBadge = ({ role }) => {
  if (!role) return null;

  const key = role.toLowerCase();
  const config = ROLE_CONFIG[key];

  if (!config) return null;

  const { label, className, Icon } = config;

  return (
    <div className="relative group inline-flex">
      {/* Badge */}
      <span className={`${className} flex items-center justify-center p-2`}>
        <Icon size={16} />
      </span>

      {/* Tooltip */}
      <span className="absolute -top-9 left-1/2 -translate-x-1/2 
                       whitespace-nowrap rounded bg-gray-900 px-2 py-1 
                       text-xs text-white opacity-0 group-hover:opacity-100
                       transition-opacity duration-200 pointer-events-none">
        {label}
      </span>
    </div>
  );
};

export default ProfileBadge;
