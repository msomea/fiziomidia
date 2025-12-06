import { useEffect, useState } from "react";
import { fetchForumSubs } from "../../api/admin";
import CollapsibleSection from "./CallapsibleSection";
import toast from "react-hot-toast";
import { Link } from "react-router";

export default function SponsorshipSection() {
  const [subs, setSubs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchForumSubs();
        setSubs(res.subs || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load forum subs");
      }
    };
    load();
  }, []);

  // 🔎 Filter logic (applied instantly in UI)
  const filteredSubs = subs.filter((sub) => {
    const matchesSearch =
      sub.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "sponsored"
        ? sub.isSponsored === true
        : sub.isSponsored === false;

    return matchesSearch && matchesStatus;
  });

  return (
    <CollapsibleSection title="Forum Sponsorships">
      {/* 🔍 Search + Filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by sub name..."
          className="border p-2 rounded w-full md:w-1/2"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Filter Dropdown */}
        <select
          className="border p-2 rounded w-full md:w-1/3"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All</option>
          <option value="sponsored">Sponsored</option>
          <option value="not_sponsored">Not Sponsored</option>
        </select>
      </div>

      {/* Listing */}
      {filteredSubs.slice(0, 10).map((sub) => (
        <div
          key={sub._id}
          className="mt-2 border p-2 rounded text-sm text-tufts"
        >
          <Link to={`/admin/sponsorship/${sub._id}`}>
            <h2 className="text-caribbean">
              <b>Sub:</b> #{sub._id}
            </h2>
          </Link>

          <p>
            <b>Name:</b> {sub.title}
          </p>

          <p>
            <b>Status:</b>{" "}
            {sub.isSponsored ? (
              <span className="text-green-600">Sponsored</span>
            ) : (
              <span className="text-red-600">Not Sponsored</span>
            )}
          </p>
        </div>
      ))}

      {filteredSubs.length === 0 && (
        <p className="text-gray-500 text-sm mt-4">No subs found.</p>
      )}
    </CollapsibleSection>
  );
}
