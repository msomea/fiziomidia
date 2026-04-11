import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import avatar from "../../assets/avatar.jpg";
import { 
  MapPin, 
  Phone, 
  Star, 
  Users, 
  Calendar,
  Loader2,
  ChevronLeft,
  Edit,
  Trash2
} from "lucide-react";
import API from "../../api/axios";
import StarRating from "../../components/StarRating";
import dayjs from "dayjs";

const ClinicDetails = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { clinicId } = useParams();

  const [clinic, setClinic] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState(null);

  const avatarUrl = avatar;

  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: ""
  });

  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchClinicDetails();
    fetchReviews();
  }, [clinicId]);

  const fetchClinicDetails = async () => {
    try {
      const response = await API.get(`/clinics/${clinicId}`);
      setClinic(response.data);
    } catch (error) {
      console.error("Error fetching clinic details:", error);
      toast.error("Failed to load clinic details");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await API.get(`/reviews/clinic/${clinicId}`);
      setReviews(response.data);
      
      // Check if current user has already reviewed
      if (user) {
        const existingReview = response.data.find(
          review => review.reviewer._id === user._id
        );
        setUserReview(existingReview);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!reviewForm.rating) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setSubmittingReview(true);
      
      const reviewData = {
        clinicId,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      };

      const response = await API.post("/reviews", reviewData);
      
      toast.success("Review submitted successfully!");
      setShowReviewForm(false);
      setReviewForm({ rating: 0, comment: "" });
      setUserReview(response.data);
      fetchReviews();
      fetchClinicDetails(); // Refresh to update rating
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(error.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReviewUpdate = async (e) => {
    e.preventDefault();
    
    if (!reviewForm.rating) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setSubmittingReview(true);
      
      const updateData = {
        rating: reviewForm.rating,
        comment: reviewForm.comment
      };

      await API.put(`/reviews/${userReview._id}`, updateData);
      
      toast.success("Review updated successfully!");
      setShowReviewForm(false);
      setReviewForm({ rating: 0, comment: "" });
      fetchReviews();
      fetchClinicDetails();
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error(error.response?.data?.error || "Failed to update review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReviewDelete = async () => {
    if (!confirm("Are you sure you want to delete your review?")) {
      return;
    }

    try {
      await API.delete(`/reviews/${userReview._id}`);
      toast.success("Review deleted successfully!");
      setUserReview(null);
      fetchReviews();
      fetchClinicDetails();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('clinic_not_found')}</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {t('go_back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              {t('back')}
            </button>
            
            {user && clinic.ownerUserId._id === user._id && (
              <button
                onClick={() => navigate(`/clinic/edit/${clinicId}`)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                {t('edit_clinic')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Clinic Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Clinic Header */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{clinic.name}</h1>
              {/* Clinic Image */}
              <div className="h-48 bg-gradient-to-br from-caribbean to-tufts relative overflow-hidden">
                {clinic.imageUrl ? (
                  <img
                    src={clinic.imageUrl}
                    alt={clinic.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Star className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}
              </div>
              
              {/* Rating Display */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center space-x-2">
                  <StarRating 
                    rating={clinic.rating?.average || 0} 
                    readonly={true}
                    size="w-6 h-6"
                  />
                  <span className="text-lg font-semibold text-gray-900">
                    {clinic.rating?.average?.toFixed(1) || "0.0"}
                  </span>
                </div>
                <span className="text-gray-500">
                  ({clinic.rating?.count || 0} {clinic.rating?.count === 1 ? t('review') : t('reviews')})
                </span>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-gray-900">{clinic.address}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <p className="text-gray-900">{clinic.contactPhone}</p>
                </div>
              </div>

              {/* Services */}
              {clinic.services && clinic.services.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('services')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {clinic.services.map((service, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Physiotherapists */}
              {clinic.physiotherapists && clinic.physiotherapists.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('physiotherapists')}</h3>
                  <div className="space-y-3">
                    {clinic.physiotherapists.map((pt) => (
                      <div key={pt._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        {pt.profileImageUrl ? (
                          <img 
                            src={pt.profileImageUrl} 
                            alt={pt.fullName}
                            className="w-10 h-10 border-2 border-blue-600 rounded-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = avatarUrl;
                            }}
                          />
                        ) : (
                          <img 
                            src={avatarUrl}
                            alt={pt.fullName}
                            className="w-10 h-10 border-2 border-blue-600 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{pt.fullName}</p>
                          <p className="text-sm text-gray-500">{pt.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{t('reviews')}</h2>
                
                {user && user.role !== 'guest' && !userReview ? (
                  <button
                    onClick={openReviewForm}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {t('write_a_review')}
                  </button>
                ) : user && user.role === 'guest' ? (
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    {t('log_in_to_review')}
                  </button>
                ) : null}
              </div>

              {/* User's Review */}
              {userReview && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
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
                <form onSubmit={userReview ? handleReviewUpdate : handleReviewSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900">
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
                      size="w-8 h-8"
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
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('share_your_experience')}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submittingReview ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                          {userReview ? t('update_review') : t('submit_review')}
                        </>
                      ) : (
                        t('submit')
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {reviewsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : reviews.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">{t('no_reviews_yet')}</p>
                ) : (
                  reviews
                    .filter(review => !userReview || review._id !== userReview._id)
                    .map((review) => (
                      <div key={review._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{review.reviewer.fullName}</h4>
                            {review.physiotherapist && (
                              <p className="text-sm text-gray-500">
                                Reviewed {review.physiotherapist.fullName}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <StarRating rating={review.rating} readonly={true} />
                            <p className="text-xs text-gray-500 mt-1">
                              {dayjs(review.createdAt).format("DD MMM YYYY")}
                            </p>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 mt-2">{review.comment}</p>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Clinic Owner */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('clinic_owner')}</h3>
              <div className="flex items-center space-x-3">
                {clinic.ownerUserId.profileImageUrl ? (
                  <img 
                    src={clinic.ownerUserId.profileImageUrl} 
                    alt={clinic.ownerUserId.fullName}
                    className="w-12 h-12 border-2 border-green-600 rounded-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = avatarUrl;
                    }}
                  />
                ) : (
                  <img 
                    src={avatarUrl}
                    alt={clinic.ownerUserId.fullName}
                    className="w-12 h-12 border-2 border-green-600 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">{clinic.ownerUserId.fullName}</p>
                  <p className="text-sm text-gray-500">{clinic.ownerUserId.email}</p>
                  <p className="text-sm text-gray-500">{clinic.ownerUserId.phone}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('quick_actions')}</h3>
              <div className="space-y-3">
                {user && user.role !== 'guest' ? (
                  <>
                    <button 
                      onClick={() => navigate(`/clinic/${clinicId}/request-appointment`)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      {t('book_appointment')}
                    </button>
                    {clinic.contactPhone && (
                      <button 
                        onClick={() => window.open(`tel:${clinic.contactPhone}`, '_self')}
                        className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center justify-center"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {t('call_clinic')}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => navigate('/login')}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      {t('login_to_book')}
                    </button>
                    {clinic.contactPhone && (
                      <button 
                        onClick={() => navigate('/login')}
                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {t('login_to_call')}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetails;
