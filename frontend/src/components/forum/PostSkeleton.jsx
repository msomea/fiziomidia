const PostSkeleton = () => {
  return (
    <div className="bg-white shadow-sm rounded-xl p-4 flex flex-col md:flex-row gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-gray-300" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-300 w-1/3 rounded"></div>
        <div className="h-4 bg-gray-300 w-1/2 rounded"></div>
        <div className="h-4 bg-gray-200 w-full rounded"></div>
        <div className="h-4 bg-gray-200 w-full rounded"></div>
        <div className="h-4 bg-gray-200 w-3/4 rounded"></div>
      </div>
    </div>
  );
};

export { PostSkeleton };
