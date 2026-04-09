import PTRequest from "../models/PTRequest.js";
import Clinic from "../models/Clinic.js";
import User from "../models/User.js";
import { getPTRequestsForPT } from "../services/clinicService.js";
import { CacheService } from "../utils/redis.js";

export const createPTRequest = async (req, res) => {
  try {
    const { clinicId, physiotherapistId, message } = req.body;

    // Validate inputs
    if (!clinicId || !physiotherapistId) {
      return res.status(400).json({ error: "Clinic ID and Physiotherapist ID are required" });
    }

    // Check if clinic exists and user owns it
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found" });
    }

    if (clinic.ownerUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to send requests for this clinic" });
    }

    // Check if PT exists and is a physiotherapist
    const pt = await User.findById(physiotherapistId);
    if (!pt || pt.role !== "physiotherapist") {
      return res.status(404).json({ error: "Physiotherapist not found" });
    }

    // Check if PT is already in the clinic
    if (clinic.physiotherapists.includes(physiotherapistId)) {
      return res.status(400).json({ error: "Physiotherapist is already part of this clinic" });
    }

    // Check if request already exists
    const existingRequest = await PTRequest.findOne({
      clinicId,
      physiotherapistId,
      status: { $in: ["pending", "accepted"] }
    });

    if (existingRequest) {
      return res.status(400).json({ 
        error: existingRequest.status === "pending" 
          ? "Request already pending" 
          : "Physiotherapist already joined this clinic" 
      });
    }

    // Create the request
    const ptRequest = new PTRequest({
      clinicId,
      physiotherapistId,
      requestedBy: req.user._id,
      message: message || ""
    });

    await ptRequest.save();

    // Populate for response
    const populatedRequest = await PTRequest.findById(ptRequest._id)
      .populate('clinicId', 'name')
      .populate('physiotherapistId', 'fullName email profileImageUrl')
      .populate('requestedBy', 'fullName email');

    // Add notification to PT
    pt.notifications.push({
      type: "clinic_invitation",
      message: `You have been invited to join ${clinic.name}`,
      read: false,
      createdAt: new Date()
    });
    await pt.save();

    // Invalidate caches
    await CacheService.del(`user:${pt._id}:notifications`);
    await CacheService.del(`clinic:${clinicId}:requests`);

    res.status(201).json(populatedRequest);
  } catch (error) {
    console.error("Error creating PT request:", error);
    res.status(500).json({ error: "Failed to create PT request" });
  }
};

export const getPTRequests = async (req, res) => {
  try {
    const { clinicId } = req.params;

    // Verify clinic ownership
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found" });
    }

    if (clinic.ownerUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to view requests for this clinic" });
    }

    const requests = await PTRequest.find({ clinicId })
      .populate('physiotherapistId', 'fullName email profileImageUrl ptProfile.speciality')
      .populate('requestedBy', 'fullName email')
      .sort({ requestedAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("Error fetching PT requests:", error);
    res.status(500).json({ error: "Failed to fetch PT requests" });
  }
};

export const respondToPTRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, responseMessage } = req.body; // action: 'accepted' or 'rejected'

    if (!["accepted", "rejected"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    const request = await PTRequest.findById(requestId)
      .populate('clinicId', 'name physiotherapists ownerUserId')
      .populate('physiotherapistId', 'fullName email notifications');

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Verify PT ownership (only the PT can respond)
    if (request.physiotherapistId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to respond to this request" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ error: "Request is no longer pending" });
    }

    // Update request status
    request.status = action;
    request.responseMessage = responseMessage || "";
    request.respondedAt = new Date();
    await request.save();

    // If accepted, add PT to clinic
    if (action === "accepted") {
      const clinic = await Clinic.findById(request.clinicId._id);
      if (!clinic.physiotherapists.includes(request.physiotherapistId._id)) {
        clinic.physiotherapists.push(request.physiotherapistId._id);
        await clinic.save();

        // Update PT's clinicIds
        const pt = await User.findById(request.physiotherapistId._id);
        if (pt.ptProfile) {
          pt.ptProfile.clinicIds = pt.ptProfile.clinicIds || [];
          if (!pt.ptProfile.clinicIds.includes(request.clinicId._id)) {
            pt.ptProfile.clinicIds.push(request.clinicId._id);
            await pt.save();
          }
        }

        // Invalidate caches
        await CacheService.del(`user:${request.physiotherapistId._id}:profile`);
        await CacheService.del(`clinic:${request.clinicId._id}`);
      }
    }

    // Add notification to clinic owner
    const clinicOwner = await User.findById(request.clinicId.ownerUserId)
      .select('notifications');

  

    if (clinicOwner) {
      // Initialize notifications array if it doesn't exist
      if (!clinicOwner.notifications) {
        clinicOwner.notifications = [];
      }
      
      clinicOwner.notifications.push({
        type: action === "accepted" ? "clinic_request_accepted" : "clinic_request_rejected",
        message: `${request.physiotherapistId.fullName} ${action} your invitation to join ${request.clinicId.name}`,
        read: false,
        createdAt: new Date()
      });
      await clinicOwner.save();

      // Invalidate caches
      await CacheService.del(`user:${request.clinicId.ownerUserId}:notifications`);
      await CacheService.del(`clinic:${request.clinicId._id}:requests`);
    }

    // Return updated request
    const updatedRequest = await PTRequest.findById(requestId)
      .populate('clinicId', 'name')
      .populate('physiotherapistId', 'fullName email profileImageUrl')
      .populate('requestedBy', 'fullName email');

    res.json(updatedRequest);
  } catch (error) {
    console.error("Error responding to PT request:", error);
    res.status(500).json({ error: "Failed to respond to PT request" });
  }
};

export const getMyPTRequests = async (req, res) => {
  try {
    // Use shared service to get PT requests
    const requests = await getPTRequestsForPT(req.user._id);
    res.json(requests);
  } catch (error) {
    console.error("Error fetching PT requests:", error);
    res.status(500).json({ error: "Failed to fetch PT requests" });
  }
};

export const cancelPTRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await PTRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Verify clinic ownership (only the clinic owner can cancel)
    const clinic = await Clinic.findById(request.clinicId);
    if (clinic.ownerUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to cancel this request" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ error: "Cannot cancel a request that is no longer pending" });
    }

    request.status = "cancelled";
    await request.save();

    // Add notification to PT
    const pt = await User.findById(request.physiotherapistId);
    pt.notifications.push({
      type: "clinic_invitation_cancelled",
      message: `Your invitation to join ${clinic.name} has been cancelled`,
      read: false,
      createdAt: new Date()
    });
    await pt.save();

    // Invalidate caches
    await CacheService.del(`user:${request.physiotherapistId._id}:notifications`);
    await CacheService.del(`clinic:${request.clinicId}:requests`);

    res.json({ message: "Request cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling PT request:", error);
    res.status(500).json({ error: "Failed to cancel PT request" });
  }
};
