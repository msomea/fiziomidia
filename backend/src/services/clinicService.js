import Clinic from "../models/Clinic.js";
import Appointment from "../models/Appointment.js";
import ClinicPromotion from "../models/ClinicPromotion.js";
import PTRequest from "../models/PTRequest.js";
import User from "../models/User.js";
import ForumSub from "../models/ForumSub.js";
import { CacheService, CacheKeys, CacheTTL } from "../utils/redis.js";

// ============================================
// Shared Clinic Service Functions
// ============================================

/**
 * Get clinics owned by a PT
 */
export const getOwnedClinicsByPT = async (ptId) => {
  return await Clinic.find({ ownerUserId: ptId });
};

/**
 * Get clinic appointments for PT's owned clinics
 */
export const getClinicAppointmentsForPT = async (ptId, limit = 5) => {
  try {
    // Get clinics owned by PT
    const ownedClinics = await Clinic.find({ ownerUserId: ptId }).select('_id');
    const clinicIds = ownedClinics.map(clinic => clinic._id);

    if (clinicIds.length === 0) {
      return [];
    }

    // Get appointments for owned clinics
    const appointments = await Appointment.find({ 
      clinic: { $in: clinicIds } 
    })
      .populate("requester", "fullName email phone")
      .populate("clinic", "name location address")
      .populate("pt", "fullName email phone")
      .sort({ createdAt: -1 })
      .limit(limit);

    return appointments;
  } catch (error) {
    console.error("Error fetching clinic appointments for PT:", error);
    return [];
  }
};

/**
 * Get clinic promotions for PT's owned clinics
 */
export const getClinicPromotionsForPT = async (ptId, limit = 3) => {
  try {
    // Get clinics owned by PT
    const clinics = await Clinic.find({ ownerUserId: ptId });
    const clinicIds = clinics.map(clinic => clinic._id);

    if (clinicIds.length === 0) {
      return [];
    }

    const promotions = await ClinicPromotion.find({ 
      clinic: { $in: clinicIds } 
    })
      .populate("clinic", "name")
      .sort({ createdAt: -1 })
      .limit(limit);

    return promotions;
  } catch (error) {
    console.error("Error fetching clinic promotions for PT:", error);
    return [];
  }
};

/**
 * Get clinic invitations for PT (clinics where PT is in physiotherapists array but not owner)
 */
export const getClinicInvitationsForPT = async (ptId) => {
  try {
    // Find clinics where PT is in physiotherapists array
    const clinics = await Clinic.find({ 
      physiotherapists: ptId 
    })
      .populate("ownerUserId", "fullName email phone")
      .select("name address ownerUserId physiotherapists");

    // Filter to get only clinics where PT is not the owner (these are invitations)
    const invitations = clinics.filter(clinic => 
      clinic.ownerUserId._id.toString() !== ptId
    );

    return invitations;
  } catch (error) {
    console.error("Error fetching clinic invitations for PT:", error);
    return [];
  }
};

/**
 * Get PT requests (actual invitations from clinics to join as physiotherapist)
 */
export const getPTRequestsForPT = async (ptId) => {
  try {
    const requests = await PTRequest.find({ 
      physiotherapistId: ptId,
      status: "pending" 
    })
      .populate('clinicId', 'name address imageUrl ownerUserId')
      .populate('requestedBy', 'fullName email phone')
      .sort({ requestedAt: -1 });

    return requests;
  } catch (error) {
    console.error("Error fetching PT requests:", error);
    return [];
  }
};

/**
 * Get user notifications (integrated from userController)
 */
export const getUserNotifications = async (userId) => {
  try {
    const cacheKey = CacheKeys.USER_NOTIFICATIONS(userId);
    
    // Try to get from cache first
    const cachedNotifications = await CacheService.get(cacheKey);
    if (cachedNotifications) {
      return cachedNotifications;
    }

    const notifications = await User.findById(userId)
      .select('notifications')
      .lean();
    
    // Sort by date (newest first) and filter unread only
    const sortedNotifications = notifications?.notifications?.filter(n => !n.read)
      .sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      ) || [];

    // Cache the result
    await CacheService.set(cacheKey, sortedNotifications, CacheTTL.NOTIFICATIONS);
    
    return sortedNotifications;
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return [];
  }
};

/**
 * Get forum subscriptions for PT (integrated from forumController)
 */
export const getMyForumSubs = async (ptId) => {
  try {
    const subs = await ForumSub.find({ createdBy: ptId });
    return subs;
  } catch (error) {
    console.error("Error fetching forum subs:", error);
    return [];
  }
};
