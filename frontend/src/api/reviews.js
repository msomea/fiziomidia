import API from "./axios";
import { API_URL } from "../config/constants";

/**
 * Create a new review
 * @param {Object} reviewData - Review data
 * @param {string} reviewData.physiotherapistId - PT ID (for PT reviews)
 * @param {string} reviewData.clinicId - Clinic ID (for clinic reviews)
 * @param {number} reviewData.rating - Rating (1-5)
 * @param {string} reviewData.comment - Review comment
 * @returns {Promise} - Created review
 */
export const createReview = async (reviewData) => {
  const res = await API.post(`${API_URL}/reviews`, reviewData);
  return res.data;
};

/**
 * Get all reviews for a physiotherapist
 * @param {string} physiotherapistId - PT ID
 * @returns {Promise} - Array of reviews
 */
export const getPTReviews = async (physiotherapistId) => {
  const res = await API.get(`${API_URL}/reviews/physiotherapist/${physiotherapistId}`);
  return res.data;
};

/**
 * Get all reviews for a clinic
 * @param {string} clinicId - Clinic ID
 * @returns {Promise} - Array of reviews
 */
export const getClinicReviews = async (clinicId) => {
  const res = await API.get(`${API_URL}/reviews/clinic/${clinicId}`);
  return res.data;
};

/**
 * Update a review
 * @param {string} reviewId - Review ID
 * @param {Object} updateData - Update data
 * @param {number} updateData.rating - Updated rating
 * @param {string} updateData.comment - Updated comment
 * @returns {Promise} - Updated review
 */
export const updateReview = async (reviewId, updateData) => {
  const res = await API.put(`${API_URL}/reviews/${reviewId}`, updateData);
  return res.data;
};

/**
 * Delete a review
 * @param {string} reviewId - Review ID
 * @returns {Promise} - Delete confirmation
 */
export const deleteReview = async (reviewId) => {
  const res = await API.delete(`${API_URL}/reviews/${reviewId}`);
  return res.data;
};

/**
 * Get a single review by ID
 * @param {string} reviewId - Review ID
 * @returns {Promise} - Review data
 */
export const getReviewById = async (reviewId) => {
  const res = await API.get(`${API_URL}/reviews/${reviewId}`);
  return res.data;
};

/**
 * Get user's reviews for a specific PT
 * @param {string} userId - User ID
 * @param {string} physiotherapistId - PT ID
 * @returns {Promise} - User's review for the PT
 */
export const getUserPTReview = async (userId, physiotherapistId) => {
  const res = await API.get(`${API_URL}/reviews/user/${userId}/physiotherapist/${physiotherapistId}`);
  return res.data;
};

/**
 * Get user's reviews for a specific clinic
 * @param {string} userId - User ID
 * @param {string} clinicId - Clinic ID
 * @returns {Promise} - User's review for the clinic
 */
export const getUserClinicReview = async (userId, clinicId) => {
  const res = await API.get(`${API_URL}/reviews/user/${userId}/clinic/${clinicId}`);
  return res.data;
};

/**
 * Get all reviews by a user
 * @param {string} userId - User ID
 * @returns {Promise} - Array of user's reviews
 */
export const getUserReviews = async (userId) => {
  const res = await API.get(`${API_URL}/reviews/user/${userId}`);
  return res.data;
};

/**
 * Get review statistics for a PT
 * @param {string} physiotherapistId - PT ID
 * @returns {Promise} - Review statistics
 */
export const getPTReviewStats = async (physiotherapistId) => {
  const res = await API.get(`${API_URL}/reviews/physiotherapist/${physiotherapistId}/stats`);
  return res.data;
};

/**
 * Get review statistics for a clinic
 * @param {string} clinicId - Clinic ID
 * @returns {Promise} - Review statistics
 */
export const getClinicReviewStats = async (clinicId) => {
  const res = await API.get(`${API_URL}/reviews/clinic/${clinicId}/stats`);
  return res.data;
};
