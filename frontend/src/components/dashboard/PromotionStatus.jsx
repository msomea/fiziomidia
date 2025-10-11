export default function PromotionStatus({ promotion }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="font-semibold text-lg mb-3">Promotion Status</h2>
      <p className="text-gray-600">
        Days Remaining:{" "}
        <span className="font-bold text-caribbean">{promotion.daysLeft}</span>
      </p>
      <p className="text-gray-600">
        Next Renewal:{" "}
        <span className="font-bold text-tufts">{promotion.renewalDate}</span>
      </p>
      <button className="btn bg-caribbean text-white hover:bg-tufts mt-3">
        Extend Promotion
      </button>
    </div>
  );
}
