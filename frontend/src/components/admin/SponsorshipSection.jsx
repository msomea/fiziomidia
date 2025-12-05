import { useEffect, useState } from "react";
import { fetchForumSubs, updateSponsorship, removeSponsorship } from "../../api/admin";
import CollapsibleSection from "./CallapsibleSection";
import toast from "react-hot-toast";
import { Link } from "react-router";


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


  return (
    <CollapsibleSection title="Forum Sponsorships">
      {subs.slice(0, 5).map((sub) => (
        <div key={sub._id} className="mt-2 border p-2 rounded text-sm text-tufts">
          <Link to={`/admin/sponsorship/${sub._id}`}>
            <h2 className="text-caribbean"><b>Sub:</b> #{sub._id}</h2>
          </Link>
          <p><b>Name:</b> {sub.title}</p>
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
    </CollapsibleSection>
  );
}
