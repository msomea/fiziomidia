import { useEffect, useState } from "react";
import { fetchAllUsers } from "../../api/admin";
import toast from "react-hot-toast";
import CollapsibleSection from "./CallapsibleSection";

export default function UsersSection() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchAllUsers(); 
        setUsers(res.users);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load users");
      }
    };
    load();
  }, []);

  return (

    <CollapsibleSection title="Users">
      {users.slice(0, 5).map((u) => (
        <p className="text-gray-600 text-sm mt-1" key={u._id}>
          {u.fullName} — {u.email}
        </p>
      ))}

      <p className="text-xs text-gray-400 mt-2">Showing first 5 users</p>
    </CollapsibleSection>
  );
}
