const SkeletonSponsoredCard = () => {
  return (
    <div className="flex-shrink-0 w-[85%] sm:w-[300px] rounded-2xl p-4 shadow bg-gray-300 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:400px_100%] animate-shimmer
">
      {/* Image */}
      <div className="w-full h-40 bg-gray-300 rounded-xl" />

      {/* Title */}
      <div className="h-4 bg-gray-300 rounded mt-4 w-3/4" />

      {/* Price */}
      <div className="h-4 bg-gray-300 rounded mt-2 w-1/3" />

      {/* Description */}
      <div className="space-y-2 mt-3">
        <div className="h-3 bg-gray-300 rounded w-full" />
        <div className="h-3 bg-gray-300 rounded w-5/6" />
      </div>

      {/* Button */}
      <div className="h-9 bg-gray-300 rounded mt-4 w-full" />
    </div>
  );
};

export default SkeletonSponsoredCard;
