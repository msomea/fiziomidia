import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { getUserById }from "../api/profile";
import MemberDetails from "../components/profiles/MemberDetails";
import MemberAppointments from "../components/profiles/MemberAppointments";
import MemberSavedPTs from "../components/profiles/MemberSavedPTs";


const MemberProfile = () => {
  const { memberId } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const response = await getUserById(memberId);
        setMember(response?.data);
      } catch (error) {
        console.error("Error fetching member profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [memberId]);

  if (loading) return <p className="p-4">Loading member profile...</p>;
  if (!member) return <p className="p-4 text-red-600">Member not found.</p>;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Member Details Section */}
      <section className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-2">Member Details</h2>
        <MemberDetails member={member} />
      </section>

      {/* Saved PTs */}
      <section className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-2">Saved Physiotherapists</h2>
        <MemberSavedPTs memberId={memberId} />
      </section>

      {/* Appointments Section (if public access allowed) */}
      <section className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-2">Appointments</h2>
        <MemberAppointments memberId={memberId} />
      </section>
    </div>
  );
};

export default MemberProfile;
