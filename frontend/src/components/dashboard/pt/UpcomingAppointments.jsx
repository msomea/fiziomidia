import dayjs from "dayjs"
export default function UpcomingAppointments({ appointments }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 m-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-lg">Upcoming Appointments</h2>
        <button className="btn btn-sm p-1 bg-caribbean text-white hover:bg-tufts">
          View All
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr className="bg-alice text-caribbean">
              <th>Patient</th>
              <th>Time</th>
              <th>Clinic</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt, i) => (
              <tr key={i}>
                <td>{appt.requester.fullName}</td>
                <td>{dayjs(appt.scheduledAt).format("ddd, DD/MM/YYYY")}</td>
                <td>{appt.clinic.name}</td>
                <td
                  className={`font-semibold ${
                    appt.status === "accepted"
                      ? "text-caribbean"
                      : appt.status === "pending"
                      ? "text-tufts"
                      : appt.status === "cancelled"
                      ? "text-red-400"
                      : appt.status === "declined"
                      ? "text-red-800"
                      : "text-gray-500"
                  }`}
                >
                  {appt.status}
                </td>
                <td>
                  {appt.status === "Pending" && (
                    <button className="btn btn-xs btn-outline btn-success mr-1">
                      Accept
                    </button>
                  )}
                  <button className="btn btn-xs btn-outline btn-info mr-1">
                    View
                  </button>
                  <button className="btn btn-xs btn-outline btn-error">
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
