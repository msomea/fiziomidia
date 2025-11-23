import React, { useState } from "react";
import dayjs from "dayjs";
import { Star, StarHalf, ChevronDown } from "lucide-react";

const PTRatings = ({ ratings, reviews }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!ratings) return null;

  const { average, count } = ratings;
  const recentReviews = reviews?.slice(-5).reverse() || [];

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<Star key={i} className="w-4 h-4 text-yellow-500 inline-block" />);
      } else if (rating >= i - 0.5) {
        stars.push(<StarHalf key={i} className="w-4 h-4 text-yellow-500 inline-block" />);
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300 inline-block" />);
      }
    }
    return stars;
  };

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      {/* Heading (always visible) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center mb-3"
      >
        <h2 className="text-xl font-bold text-caribbean">Ratings & Reviews</h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform text-caribbean duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <>
          {/* Ratings */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="flex">{renderStars(average)}</div>
              <span className="text-gray-700 font-semibold">{average.toFixed(2)}</span>
            </div>
            <span className="text-gray-500 text-sm">({count} reviews)</span>
          </div>

          {/* Latest Reviews */}
          <div className="space-y-4">
            {recentReviews.length === 0 ? (
              <p className="text-gray-700 text-sm md:text-base">No reviews yet.</p>
            ) : (
              recentReviews.map((review, index) => (
                <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{review.user}</h3>
                    <div className="flex">{renderStars(review.rating)}</div>
                  </div>
                  <p className="text-gray-700 text-sm mt-1">{review.comment}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {dayjs(review.createdAt).format("DD MMM YYYY")}
                  </p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default PTRatings;
