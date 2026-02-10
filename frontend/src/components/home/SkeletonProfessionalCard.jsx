const SkeletonProfessionalCard = () => {
  return (
    <div className="flex-shrink-0 w-[85%] sm:w-[300px] bg-alice rounded-2xl p-4 shadow animate-pulse text-center">
      {/* Avatar */}
      <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gray-300" />

      {/* Name */}
      <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-2" />

      {/* Specialty */}
      <div className="h-3 bg-gray-300 rounded w-full mx-auto mb-2" />

      {/* Institution */}
      <div className="h-3 bg-gray-300 rounded w-2/3 mx-auto mb-4" />

      {/* Button */}
      <div className="h-9 bg-gray-300 rounded w-full" />
    </div>
  );
};

export default SkeletonProfessionalCard;
