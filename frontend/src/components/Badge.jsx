import { ShieldCheck, User, Stethoscope } from "lucide-react";

const ProfileBadge = ({ role }) => {
  switch (role) {
    case "Admin":
      return (
        <span className="badge badge-error gap-1 flex items-center text-white">
          <ShieldCheck size={14} />
          <span className="hidden sm:inline">Admin</span>
        </span>
      );
    case "PT":
      return (
        <span className="badge badge-info gap-1 flex items-center text-white">
          <Stethoscope size={14} />
          <span className="hidden sm:inline">PT</span>
        </span>
      );
    case "Member":
      return (
        <span className="badge badge-success gap-1 flex items-center text-white">
          <User size={14} />
          <span className="hidden sm:inline">Member</span>
        </span>
      );
    default:
      return null;
  }
};

export default ProfileBadge;
