import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { MessageSquare, Loader2 } from "lucide-react";
import avatar from "../assets/avatar.jpg";
import { API_URL, ASSET_URL } from "../config/constants";

const MemberProfile = () => {
  const { id } = useParams();
  const { user: loggedInUser } = useAuth();
  const [loading, setLoading] = useState(true);
    const [member, setMember] = useState();

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const response = await API.get(`${API_URL}/users/${id}`);
        setMember(response.data.user);
      } catch (error) {
        console.error("Error fetching member profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">Loading Member Profile...</p>
      </div>
    );
  }

  if (!member)
    return <p className="p-4 text-red-600">Member not found.</p>;

  const isOwnProfile = loggedInUser?._id === member?._id;

  return (
    <div className="max-w-3xl mx-auto mt-20 p-4 space-y-6">
      {/* Member Header */}
      <section className="bg-white p-6 rounded-2xl shadow flex flex-col md:flex-row md:items-center md:space-x-5 space-y-4 md:space-y-0">

        {/* Avatar */}
        <img
          src={`${ASSET_URL}${member.profileImageUrl}` || avatar}
          alt="avatar"
          className="w-24 h-24 rounded-full object-cover border"
        />

        {/* Name + Bio */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-caribbean">{member.fullName}</h1>
          <p className="text-gray-600 mt-1">{member.email}</p>

          {member.bio && (
            <p className="text-gray-700 mt-2 text-sm">{member.bio}</p>
          )}

          {/* Message Button (MOBILE BELOW BIO) */}
          <div className="mt-4 md:hidden">
            {!isOwnProfile && loggedInUser?.role !== "guest" ? (
              <Link
                className="w-full bg-caribbean text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-caribbean-dark"
                to={`/messages/user/${member._id}`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>Message</span>
              </Link>
            ) : (
              !isOwnProfile && (
                <p className="text-sm text-gray-500 italic">
                  Login to message this member
                </p>
              )
            )}
          </div>
        </div>

        {/* Message Button (DESKTOP RIGHT SIDE) */}
        <div className="hidden md:block">
          {!isOwnProfile && loggedInUser?.role !== "guest" ? (
            <Link
              className="bg-caribbean text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-caribbean-dark"
              to={`/messages/user/${member._id}`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Message</span>
            </Link>
          ) : (
            !isOwnProfile && (
              <p className="text-sm text-gray-500 italic">
                Login to message this member
              </p>
            )
          )}
        </div>
      </section>


      {/* Basic Info */}
      <section className="bg-white p-5 rounded-2xl shadow">
        <h2 className="text-xl font-bold text-caribbean mb-3">About</h2>

        <div className="space-y-2 text-gray-700">
          {member.location && (
            <p><strong>Location:</strong> {member.location.region},  {member.location.district}</p>
          )}
          <p><strong>Joined:</strong> {new Date(member.createdAt).toDateString()}</p>
          <p><strong>Last seen:</strong> {new Date(member.lastLogin).toDateString()}</p>
          
        </div>
      </section>

    </div>
  );
};

export default MemberProfile;
