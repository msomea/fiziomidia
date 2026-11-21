import { RESOURCE_STATUSES } from "../../constants/education";

const statusColors = {
  pending: "badge-warning",
  approved: "badge-success",
  rejected: "badge-error",
  suspended: "badge-warning",
  removed: "badge-error",
};

export default function ResourceStatusBadge({ status }) {
  const color = statusColors[status] || "badge-ghost";
  return (
    <span className={`badge ${color} badge-sm capitalize`}>
      {status}
    </span>
  );
}
