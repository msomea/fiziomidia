import React, { useEffect, useState } from "react";
import { getUserById } from "../../api/profile";
import { useAuth } from "../../context/AuthContext";

const MemberDetails = () => {
  const { user } = useAuth();
  const [details, setDetails] = useState({}); 

  useEffect(() => {
    const fetchDetails = async () => {
      if (!user?._id) return;
      try {
        const data = await getUserById(user._id);
        setDetails(data);
        console.log("User", user)
      } catch (err) {
        console.error("Failed to fetch Member Details:", err);
      }
    };
    fetchDetails();
  }, [user]);

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      <h2 className="text-xl font-semibold text-black mb-3">Member Details</h2>

      <div className="space-y-2 text-gray-700">
        <p>Name: {user.fullName || "No name provided"}</p>
        <p>Email: {user.email || "No email provided"}</p>
        <p> Bio: {user.bio || "No Bio"}</p>
        <p>Location: {user.location.region || "No Location provided"}</p>
      </div>
    </section>
  );
};

export default MemberDetails;
