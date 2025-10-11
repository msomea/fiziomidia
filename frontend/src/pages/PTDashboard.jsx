import Sidebar from "../components/dashboard/Sidebar";
import Statistics from "../components/dashboard/Statistics";
import UpcomingAppointments from "../components/dashboard/UpcomingAppointments";
import ForumPosts from "../components/dashboard/ForumPosts";
import PromotionStatus from "../components/dashboard/PromotionStatus";

export default function PTMyProfile() {
  const stats = [
    { title: "Today’s Appointments", value: 4 },
    { title: "Upcoming", value: 12 },
    { title: "Pending Requests", value: 3 },
    { title: "Promotion Days Left", value: 7 },
  ];

  const appointments = [
    { patient: "Jane Doe", time: "10:30 AM", type: "Rehab", status: "Confirmed" },
    { patient: "Mark Elias", time: "11:00 AM", type: "Exercise Therapy", status: "Pending" },
    { patient: "Asha Mushi", time: "1:00 PM", type: "Home Visit", status: "Confirmed" },
  ];

  const posts = [
    { title: "The role of balance training in elderly care", date: "2 days ago" },
    { title: "Stretching for lower back pain relief", date: "5 days ago" },
  ];

  const promotion = { daysLeft: 7, renewalDate: "Oct 20, 2025" };

  return (
    <div className="flex min-h-screen bg-alice text-black">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">My Dashboard</h1>
        <Statistics stats={stats} />
        <UpcomingAppointments appointments={appointments} />
        <div className="grid md:grid-cols-2 gap-4">
          <ForumPosts posts={posts} />
          <PromotionStatus promotion={promotion} />
        </div>
      </main>
    </div>
  );
}
