import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { 
  Star, 
  ChevronDown,
  Loader2,
  Edit,
  Trash2
} from "lucide-react";
import { 
  getPTReviews, 
  createReview, 
  updateReview, 
  deleteReview 
} from "../../api/reviews";
import { fetchPTById } from "../../api/pts";
import StarRating from "../StarRating";
import dayjs from "dayjs";

const PTRatings = ({ ptId, isOwner = false }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: urlPtId } = useParams();

  const physiotherapistId = ptId || urlPtId;
  
  const [ptData, setPtData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState(null);

  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: ""
  });

  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (physiotherapistId) {
      fetchPTRatings();
      fetchPTReviews();
    }
  }, [physiotherapistId]);

  const fetchPTRatings = async () => {
    try {
      const response = await fetchPTById(physiotherapistId);
      setPtData({ ptProfile: response });
    } catch (error) {
      console.error("Error fetching PT ratings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPTReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await getPTReviews(physiotherapistId);
      setReviews(response);
      
      // Check if current user has already reviewed this PT
      if (user) {
        const existingReview = response.find(
          review => review.reviewer._id === user._id
        );
        setUserReview(existingReview);
      }
    } catch (error) {
      console.error("Error fetching PT reviews:", error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!reviewForm.rating) {
      toast.error(t('please_select_rating'));
      return;
    }

    try {
      setSubmittingReview(true);
      
      const reviewData = {
        physiotherapistId,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      };

      const response = await createReview(reviewData);
      
      toast.success(t('review_submitted_successfully'));
      setShowReviewForm(false);
      setReviewForm({ rating: 0, comment: "" });
      setUserReview(response.data);
      fetchPTReviews();
      fetchPTRatings(); // Refresh to update rating
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(error.response?.data?.error || t('failed_to_submit_review'));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReviewUpdate = async (e) => {
    e.preventDefault();
    
    if (!reviewForm.rating) {
      toast.error(t('please_select_rating'));
      return;
    }

    try {
      setSubmittingReview(true);
      
      const updateData = {
        rating: reviewForm.rating,
        comment: reviewForm.comment
      };

      await updateReview(userReview._id, updateData);
      
      toast.success(t('review_updated_successfully'));
      setShowReviewForm(false);
      setReviewForm({ rating: 0, comment: "" });
      fetchPTReviews();
      fetchPTRatings();
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error(error.response?.data?.error || t('failed_to_update_review'));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReviewDelete = async () => {
    if (!confirm(t('confirm_delete_review'))) {
      return;
    }

    try {
      await deleteReview(userReview._id);
      toast.success(t('review_deleted_successfully'));
      setUserReview(null);
      fetchPTReviews();
      fetchPTRatings();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error(t('failed_to_delete_review'));
    }
  };

  const openReviewForm = () => {
    if (userReview) {
      setReviewForm({
        rating: userReview.rating,
        comment: userReview.comment || ""
      });
    } else {
      setReviewForm({ rating: 0, comment: "" });
    }
    setShowReviewForm(true);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<Star key={i} className="w-4 h-4 text-yellow-500 inline-block fill-current" />);
      } else if (rating >= i - 0.5) {
        stars.push(<StarHalf key={i} className="w-4 h-4 text-yellow-500 inline-block fill-current" />);
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300 inline-block fill-current" />);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <section className="bg-white shadow-sm rounded-2xl p-5">
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </section>
    );
  }

  const { average, count } = ptData?.ptProfile?.ratings || { average: 0, count: 0 };

  return (
    <section className="bg-white shadow-sm rounded-2xl p-5">
      {/* Heading (always visible) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center mb-3"
      >
        <h2 className="text-xl font-bold text-caribbean">{t('ratings_reviews')}</h2>
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
            <span className="text-gray-500 text-sm">({count} {count === 1 ? t('review') : t('reviews')})</span>
          </div>

          {/* Review Button */}
          <div className="mb-4">
            {user && user.role !== 'guest' && !userReview ? (
              <button
                onClick={openReviewForm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                {t('write_a_review')}
              </button>
            ) : user && user.role === 'guest' ? (
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
              >
                {t('log_in_to_review')}
              </button>
            ) : null}
          </div>

          {/* User's Review */}
          {userReview && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{t('your_review')}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={openReviewForm}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleReviewDelete}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <StarRating rating={userReview.rating} readonly={true} />
                <span className="text-sm text-gray-500">
                  {dayjs(userReview.createdAt).format("DD MMM YYYY")}
                </span>
              </div>
              {userReview.comment && (
                <p className="text-gray-700">{userReview.comment}</p>
              )}
            </div>
          )}

          {/* Review Form */}
          {showReviewForm && (
            <form onSubmit={userReview ? handleReviewUpdate : handleReviewSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">
                {userReview ? t('update_your_review') : t('write_a_review')}
              </h3>
              
              {/* Rating */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('rating')} *
                </label>
                <StarRating
                  rating={reviewForm.rating}
                  onRatingChange={(rating) => setReviewForm({ ...reviewForm, rating })}
                  size="w-6 h-6"
                />
              </div>

              {/* Comment */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('comment_optional')}
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('share_your_experience')}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {submittingReview ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      {userReview ? t('updating') : t('submitting')}
                    </>
                  ) : (
                    userReview ? t('update_review') : t('submit_review')
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          )}

          {/* Latest Reviews */}
          <div className="space-y-4">
            {reviewsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-gray-700 text-sm md:text-base">{t('no_reviews_yet')}</p>
            ) : (
              reviews
                .filter(review => !userReview || review._id !== userReview._id)
                .map((review) => (
                  <div key={review._id} className="border-b border-gray-200 pb-3 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{review.reviewer.fullName}</h3>
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
