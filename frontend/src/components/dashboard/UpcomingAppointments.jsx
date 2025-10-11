export default function UpcomingAppointments({ appointments }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-lg">Upcoming Appointments</h2>
        <button className="btn btn-sm bg-caribbean text-white hover:bg-tufts">
          View All
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr className="bg-alice">
              <th>Patient</th>
              <th>Time</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt, i) => (
              <tr key={i}>
                <td>{appt.patient}</td>
                <td>{appt.time}</td>
                <td>{appt.type}</td>
                <td
                  className={`font-semibold ${
                    appt.status === "Confirmed"
                      ? "text-caribbean"
                      : appt.status === "Pending"
                      ? "text-tufts"
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
