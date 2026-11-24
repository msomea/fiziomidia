import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowBigLeftIcon, ArrowBigRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import avatar from "../../assets/avatar.jpg";
import { fetchTeamMembers } from "../../api/teamMembers";
import SkeletonTeamMemberCard from "./SkeletonTeamMemberCard";

export default function TeamMembersSection() {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const [paused, setPaused] = useState(false);
  const carouselRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadMembers = async () => {
      setLoading(true);
      try {
        const result = await fetchTeamMembers();
        if (!cancelled) {
          setMembers(result.members || []);
        }
      } catch (err) {
        console.error("Failed to load team members:", err);
        if (!cancelled) {
          toast.error(t("team_load_failed"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    const calculateItems = () => {
      if (!carouselRef.current) return;

      const width = carouselRef.current.offsetWidth;
      if (width < 500) setItemsPerPage(1);
      else if (width < 1030) setItemsPerPage(2);
      else setItemsPerPage(3);
    };

    calculateItems();
    window.addEventListener("resize", calculateItems);
    return () => window.removeEventListener("resize", calculateItems);
  }, []);

  const totalPages = Math.ceil(members.length / itemsPerPage);

  const goToPage = useCallback(
    (newPage) => {
      if (!carouselRef.current) return;

      const card = carouselRef.current.firstChild;
      if (!card) return;

      const cardWidth = card.offsetWidth;
      const gap = 16;
      const scrollX = newPage * itemsPerPage * (cardWidth + gap);

      carouselRef.current.scrollTo({
        left: scrollX,
        behavior: "smooth",
      });

      setPage(newPage);
    },
    [itemsPerPage],
  );

  const scrollLeft = () =>
    goToPage(page === 0 ? totalPages - 1 : page - 1);

  const scrollRight = () => goToPage((page + 1) % totalPages);

  useEffect(() => {
    if (totalPages <= 1 || paused) return;

    const interval = setInterval(() => {
      setPage((prev) => {
        const next = (prev + 1) % totalPages;
        goToPage(next);
        return next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [totalPages, paused, goToPage]);

  if (!loading && members.length === 0) {
    return null;
  }

  const showSkeletons = loading;

  return (
    <section className="bg-white shadow-md rounded-2xl p-6 md:p-12">
      <h2 className="text-3xl font-bold text-caribbean mb-6">{t("our_team")}</h2>

      <div
        className="relative flex items-center"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {!showSkeletons && totalPages > 1 && (
          <button
            onClick={scrollLeft}
            aria-label="Previous"
            className="absolute left-0 z-20 bg-gray-100 p-2 rounded-full shadow text-caribbean hover:bg-gray-200"
          >
            <ArrowBigLeftIcon />
          </button>
        )}

        <div
          ref={carouselRef}
          className="flex gap-4 overflow-x-hidden px-12 w-full scroll-smooth"
        >
          {showSkeletons
            ? Array.from({ length: itemsPerPage }).map((_, i) => (
                <SkeletonTeamMemberCard key={i} />
              ))
            : members.map((member) => (
                <div
                  key={member._id}
                  className="flex-shrink-0 w-[85%] sm:w-[300px] bg-alice rounded-2xl p-4 shadow hover:shadow-lg transition text-center"
                >
                  <div className="mx-auto mb-4 w-full aspect-square rounded-xl ring ring-caribbean ring-offset-2 overflow-hidden">
                    <img
                      src={member.image || avatar}
                      alt={member.name}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = avatar;
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <h3 className="font-semibold text-caribbean text-lg">
                    {member.name}
                  </h3>

                  <p className="text-sm text-gray-600">{member.title}</p>

                  {member.bio && (
                    <div className="text-sm text-gray-500 mt-1 max-h-16 overflow-y-auto whitespace-pre-line text-left break-words">
                      {member.bio}
                    </div>
                  )}

                  <a
                    href={`mailto:${member.email}`}
                    className="btn btn-sm bg-caribbean text-white mt-3 w-full hover:bg-tufts"
                  >
                    {t("team_contact")}
                  </a>
                </div>
              ))}
        </div>

        {!showSkeletons && totalPages > 1 && (
          <button
            onClick={scrollRight}
            aria-label="Next"
            className="absolute right-0 z-20 bg-gray-100 p-2 rounded-full shadow text-caribbean hover:bg-gray-200"
          >
            <ArrowBigRightIcon />
          </button>
        )}
      </div>

      {!showSkeletons && totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-6">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i)}
              className={`w-3 h-3 rounded-full transition ${
                i === page ? "bg-caribbean" : "bg-gray-300"
              }`}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
