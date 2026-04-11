import React, { useEffect, useState } from "react";
import { getUserById } from "../../../api/users";
import { useAuth } from "../../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { ChevronsRight } from "lucide-react";

const MemberDetails = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [details, setDetails] = useState({}); 

  useEffect(() => {
    const fetchDetails = async () => {
      if (!user?._id) return;
      try {
        const data = await getUserById(user._id);
        setDetails(data);
      } catch (err) {
        console.error(t("failed_fetch_member_details"), err);
      }
    };
    fetchDetails();
  }, [user, t]);

  return (
    <section className="bg-white shadow-sm rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-black mb-3">
        {t("member_details_title")}
      </h2>

      <div className="space-y-2 text-gray-700">
        <p>
          <span className="font-semibold">{t("name")}: </span>
          {user.fullName || t("no_name_provided")}
        </p>

        <p>
          <span className="font-semibold">{t("email")}: </span>
          {user.email || t("no_email_provided")}
        </p>

        <p>
          <span className="font-semibold">{t("bio")}: </span>
          {user.bio || t("no_bio")}
        </p>

        <div>
          <span className="font-semibold">{t("location")}: </span>
          {user.location ? (
            <>
              {user.location.region && <span>{user.location.region}</span>}
              {user.location.district && <span>, {user.location.district}</span>}
              {user.location.ward && <span>, {user.location.ward}</span>}
              {user.location.street && <span>, {user.location.street}</span>}
            </>
          ) : (
            <span>{t("no_location_set")}</span>
          )}
        </div>
      </div>
    </section>
  );
};

export default MemberDetails;
