import { useEffect, useState } from "react";
import { fetchForumSubs, updateSponsorship, removeSponsorship } from "../../api/admin";
import CollapsibleSection from "./CallapsibleSection";
import toast from "react-hot-toast";

export default function SponsorshipSection() {
  const [subs, setSubs] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchForumSubs();
        setSubs(res.subs);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load forum subs");
      }
    };
    load();
  }, []);

  const handleRemove = async (id) => {
    try {
      await removeSponsorship(id);
      toast.success("Sponsorship removed");
      setSubs((prev) =>
        prev.map((s) => (s._id === id ? { ...s, isSponsored: false } : s))
      );
    } catch {
      toast.error("Failed to remove sponsorship");
    }
  };

  return (
    <CollapsibleSection title="Forum Sponsorships">

      {subs.slice(0, 5).map((sub) => (
        <div key={sub._id} className="mt-2 border p-2 rounded text-sm text-tufts">
          <p><b>Sub:</b> {sub.title}</p>
          <p>
            <b>Status:</b>{" "}
            {sub.isSponsored ? (
              <span className="text-green-600">Sponsored</span>
            ) : (
              "Not sponsored"
            )}
          </p>

          {sub.isSponsored && (
            <button
              onClick={() => handleRemove(sub._id)}
              className="mt-2 text-xs text-red-500 hover:underline"
            >
              Remove Sponsorship
            </button>
          )}
        </div>
      ))}
    </CollapsibleSection>
  );
}
