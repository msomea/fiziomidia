import React from "react";
import { Star } from "lucide-react";

const StarRating = ({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = "w-5 h-5", 
  className = "" 
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleMouseEnter = (value) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const handleClick = (value) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = i <= (hoverRating || rating);
      stars.push(
        <Star
          key={i}
          className={`${size} ${
            filled 
              ? "text-yellow-500 fill-yellow-500" 
              : "text-gray-300 fill-gray-300"
          } ${!readonly ? "cursor-pointer transition-colors" : ""} ${className}`}
          onMouseEnter={() => handleMouseEnter(i)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(i)}
        />
      );
    }
    return stars;
  };

  return <div className="flex items-center space-x-1">{renderStars()}</div>;
};

export default StarRating;
