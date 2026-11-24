const SkeletonTeamMemberCard = () => {
  return (
    <div className="flex-shrink-0 w-[85%] sm:w-[300px] bg-alice rounded-2xl p-4 shadow animate-pulse text-center">
      <div className="mx-auto mb-4 w-full aspect-square rounded-xl bg-gray-300" />
      <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-2" />
      <div className="h-3 bg-gray-300 rounded w-1/2 mx-auto mb-3" />
      <div className="h-9 bg-gray-300 rounded w-full" />
    </div>
  );
};

export default SkeletonTeamMemberCard;
