import Appointment from "../models/Appointment.js";
import { CacheService } from "../utils/redis.js";
import Clinic from "../models/Clinic.js";
import mongoose from "mongoose";
import User from "../models/User.js";

// Helper function to create datetime in East Africa Time
const createEATDateTime = (date, time) => {
  const dateTimeString = `${date}T${time}:00`;
  const utcDate = new Date(dateTimeString);
  // Convert to East Africa Time (UTC+3)
  const eatDate = new Date(utcDate.getTime() + 3 * 60 * 60 * 1000);
  return eatDate;
};

// Check for conflicting appointments
const checkAppointmentConflict = async (
  ptId,
  scheduledAt,
  durationMinutes = 60,
  excludeId = null,
  hasWorkingHours = true,
) => {
  try {
    if (!hasWorkingHours) {
      return { hasConflict: false };
    }

    const appointmentStart = new Date(scheduledAt);
    const appointmentEnd = new Date(
      appointmentStart.getTime() + durationMinutes * 60 * 1000,
    );

    // Add 10-minute buffer for more flexible scheduling
    const bufferedStart = new Date(appointmentStart.getTime() - 10 * 60 * 1000);
    const bufferedEnd = new Date(appointmentEnd.getTime() + 10 * 60 * 1000);

    // Build query to find potentially overlapping appointments within buffered time range
    const conflictQuery = {
      pt: new mongoose.Types.ObjectId(ptId),
      status: { $in: ["pending", "accepted"] }, // Only check active appointments
      scheduledAt: {
        $gte: new Date(bufferedStart.toISOString()), // Start from buffered start time
        $lt: new Date(bufferedEnd.toISOString()), // End at buffered end time
      },
    };

    // Exclude current appointment if updating
    if (excludeId) {
      conflictQuery._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }

    const conflictingAppointments = await Appointment.find(conflictQuery);

    for (const conflict of conflictingAppointments) {
      const conflictStart = new Date(conflict.scheduledAt);
      const conflictEnd = new Date(
        conflictStart.getTime() + conflict.durationMinutes * 60 * 1000,
      );

      // Check for time overlap with 10-minute buffer
      // Case 1: New appointment (with buffer) starts during existing appointment
      if (bufferedStart >= conflictStart && bufferedStart < conflictEnd) {
        return {
          hasConflict: true,
          conflict,
          reason: "Time slot too close to existing appointment",
          conflictTime: `${conflictStart.toTimeString().slice(0, 5)} - ${conflictEnd.toTimeString().slice(0, 5)}`,
        };
      }

      // Case 2: New appointment (with buffer) ends during existing appointment
      if (bufferedEnd > conflictStart && bufferedEnd <= conflictEnd) {
        return {
          hasConflict: true,
          conflict,
          reason: "Time slot overlaps with existing appointment",
          conflictTime: `${conflictStart.toTimeString().slice(0, 5)} - ${conflictEnd.toTimeString().slice(0, 5)}`,
        };
      }

      // Case 3: New appointment (with buffer) completely contains existing appointment
      if (bufferedStart <= conflictStart && bufferedEnd >= conflictEnd) {
        return {
          hasConflict: true,
          conflict,
          reason: "Time slot conflicts with existing appointment",
          conflictTime: `${conflictStart.toTimeString().slice(0, 5)} - ${conflictEnd.toTimeString().slice(0, 5)}`,
        };
      }

      // Case 4: Existing appointment starts during new appointment's buffered time
      if (conflictStart >= bufferedStart && conflictStart < bufferedEnd) {
        return {
          hasConflict: true,
          conflict,
          reason: "Time slot too close to existing appointment",
          conflictTime: `${conflictStart.toTimeString().slice(0, 5)} - ${conflictEnd.toTimeString().slice(0, 5)}`,
        };
      }
    }

    return { hasConflict: false };
  } catch (error) {
    throw new Error(
      `Change time, PT has existing appointment: ${error.message}`,
    );
  }
};

// Validate PT availability for requested date and time
const validatePTAvailability = async (ptId, date, time) => {
  try {
    const pt = await User.findById(ptId);
    if (!pt || pt.role !== "physiotherapist") {
      throw new Error("Physiotherapist not found");
    }

    // Check if PT is accepting new patients
    if (!pt.ptProfile?.availability?.isAcceptingNewPatients) {
      throw new Error("Physiotherapist is not accepting new patients");
    }

    // Check if next available date is set and in the future
    if (pt.ptProfile?.availability?.nextAvailableDate) {
      const nextAvailable = new Date(
        pt.ptProfile.availability.nextAvailableDate,
      );
      const requestedDate = new Date(date);
      if (requestedDate < nextAvailable) {
        throw new Error(
          `Physiotherapist is not available until ${nextAvailable.toDateString()}`,
        );
      }
    }

    // Check working hours for the requested day (use EAT timezone)
    const scheduledDateTime = createEATDateTime(date, time);
    const dayOfWeek = scheduledDateTime.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "Africa/Dar_es_Salaam",
    });

    const workingHours = pt.ptProfile?.workingHours?.find(
      (wh) => wh.dayOfWeek === dayOfWeek && wh.isAvailable,
    );

    if (!workingHours) {
      // If no working hours are configured, allow booking (more user-friendly)
      // PTs should configure working hours in their profile for proper scheduling
      console.log(
        `[INFO] No working hours configured for ${dayOfWeek}, allowing booking`,
      );
      return { hasWorkingHours: false, isValid: true };
    }

    // Validate time is within working hours
    if (time < workingHours.from || time > workingHours.to) {
      throw new Error(
        `Requested time ${time} is outside working hours (${workingHours.from} - ${workingHours.to})`,
      );
    }

    return { hasWorkingHours: true, isValid: true };
  } catch (error) {
    throw error;
  }
};

// Request a new appointment
export const requestAppointment = async (req, res) => {
  try {
    const { pt, clinic, date, time, notes, durationMinutes = 60 } = req.body; // pt = selected PT ID, clinic = selected clinic ID
    const requesterId = req.user._id; // get logged-in member

    if (!pt) return res.status(400).json({ message: "PT is required" });
    if (!date) return res.status(400).json({ message: "Date is required" });
    if (!time) return res.status(400).json({ message: "Time is required" });

    // Create scheduledAt datetime in East Africa Time
    const scheduledAt = createEATDateTime(date, time);

    // Validate PT availability before creating appointment
    let availabilityResult;
    try {
      availabilityResult = await validatePTAvailability(pt, date, time);
    } catch (validationError) {
      return res.status(400).json({
        message: "Check PT Availability",
        error: validationError.message,
      });
    }

    // Check for appointment conflicts only if PT has working hours
    try {
      const conflictCheck = await checkAppointmentConflict(
        pt,
        scheduledAt,
        durationMinutes,
        null,
        availabilityResult.hasWorkingHours,
      );
      if (conflictCheck.hasConflict) {
        return res.status(409).json({
          message: "Appointment conflict detected",
          error: `${conflictCheck.reason}. Conflicting time: ${conflictCheck.conflictTime}`,
          conflict: conflictCheck.conflict,
        });
      }
    } catch (conflictError) {
      return res.status(500).json({
        message: "Change time, PT has existing appointment",
        error: conflictError.message,
      });
    }

    const appointment = new Appointment({
      requester: new mongoose.Types.ObjectId(requesterId),
      pt: new mongoose.Types.ObjectId(pt),
      clinic: clinic ? new mongoose.Types.ObjectId(clinic) : undefined,
      scheduledAt: scheduledAt,
      durationMinutes: durationMinutes,
      // Keep legacy fields for backward compatibility
      scheduledDate: date,
      scheduledTime: time,
      notes,
    });

    await appointment.save();

    // Create notification for the PT
    try {
      const ptUser = await User.findById(pt);
      if (ptUser) {
        // Check if PT has working hours configured
        const hasWorkingHours = ptUser.ptProfile?.workingHours?.length > 0;

        let notificationMessage = `New appointment request from ${req.user.fullName || "A patient"} for ${date} at ${time}`;
        let notificationType = "new_appointment";
        let notificationPriority = "important"; // Default priority for new appointments

        if (!hasWorkingHours) {
          notificationMessage +=
            ". ⚠️ Please configure your working hours in your profile setting for better scheduling.";
          notificationType = "setup_working_hours";
          notificationPriority = "important"; // Setup reminders are important
        }

        const notification = {
          type: notificationType,
          message: notificationMessage,
          priority: notificationPriority,
          relatedId: appointment._id,
          relatedModel: "Appointment",
          read: false,
          createdAt: new Date(),
        };

        // Add notification to PT's notifications array
        ptUser.notifications.push(notification);
        await ptUser.save();

        console.log(
          `📱 Notification sent to PT ${ptUser.fullName} for new appointment (Priority: ${notificationPriority})`,
        );

        if (!hasWorkingHours) {
          console.log(
            `⚠️ PT ${ptUser.fullName} has no working hours configured - reminder sent`,
          );
        }
      }
    } catch (notificationError) {
      console.error("Failed to create PT notification:", notificationError);
      // Don't fail the appointment creation if notification fails
    }

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    console.error("Request appointment error:", error);
    res.status(400).json({
      message: "Appointment validation failed",
      error: error.message,
    });
  }
};

// Get appointments
export const getAppointments = async (req, res) => {
  try {
    const { ptId, limit, search, clinic, pt, requester, status } = req.query;
    // Ensure req.user exists
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    let filter = {};

    if (req.user.role === "physiotherapist") {
      filter.pt = req.user._id;
    } else if (req.user.role === "member") {
      filter.requester = req.user._id;
    } else if (req.user.role === "admin") {
      // For admin, apply additional filters if provided
      if (ptId) filter.pt = ptId;
      if (pt) filter.pt = pt;
      if (requester) filter.requester = requester;
      if (status) filter.status = status;
      if (clinic) filter.clinic = clinic;

      // Handle search functionality - search across clinic name, PT name, and requester name
      if (search) {
        // Find clinics that match the search term
        const clinics = await Clinic.find({
          name: { $regex: search, $options: "i" },
        }).select("_id");

        // Find PTs that match the search term
        const pts = await User.find({
          fullName: { $regex: search, $options: "i" },
          role: "physiotherapist",
        }).select("_id");

        // Find requesters that match the search term
        const requesters = await User.find({
          fullName: { $regex: search, $options: "i" },
        }).select("_id");

        // Build OR condition for search
        const searchConditions = [];
        if (clinics.length > 0) {
          searchConditions.push({ clinic: { $in: clinics.map((c) => c._id) } });
        }
        if (pts.length > 0) {
          searchConditions.push({ pt: { $in: pts.map((p) => p._id) } });
        }
        if (requesters.length > 0) {
          searchConditions.push({
            requester: { $in: requesters.map((r) => r._id) },
          });
        }

        // If we found any matches, add to filter
        if (searchConditions.length > 0) {
          filter.$or = searchConditions;
        } else {
          // If no matches found, return empty result
          return res.json({ appointments: [] });
        }
      }
    } else if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const appts = await Appointment.find(filter)
      .populate("pt", "fullName email ptProfile.speciality")
      .populate("requester", "fullName email")
      .populate("clinic", "name address")
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 50); // Increased limit for admin

    res.json({ appointments: appts });
  } catch (err) {
    console.error("Appointments API error:", err.message, err.stack);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
};


// Update appointment status
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, scheduledAt, date, time, durationMinutes } = req.body;
    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ error: "Not found" });

    const userId = req.user._id.toString();
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== appt.pt.toString() &&
      req.user._id.toString() !== appt.requester.toString()
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Only allow valid status updates
    const validStatuses = ["accepted", "declined", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // Handle scheduledAt updates (support both new format and legacy)
    let newScheduledAt = appt.scheduledAt;
    if (scheduledAt) {
      newScheduledAt = new Date(scheduledAt);
    } else if (date && time) {
      newScheduledAt = createEATDateTime(date, time);
      appt.scheduledDate = date;
      appt.scheduledTime = time;
    }

    // Check for conflicts if updating time (only for accepted/pending appointments)
    if (
      (scheduledAt || (date && time)) &&
      ["pending", "accepted"].includes(status)
    ) {
      const finalDuration = durationMinutes || appt.durationMinutes || 60;

      // Check if PT has working hours configured
      const ptUser = await User.findById(appt.pt);
      const hasWorkingHours = ptUser?.ptProfile?.workingHours?.length > 0;

      try {
        const conflictCheck = await checkAppointmentConflict(
          appt.pt.toString(),
          newScheduledAt,
          finalDuration,
          id, // Exclude current appointment from conflict check
          hasWorkingHours,
        );
        if (conflictCheck.hasConflict) {
          return res.status(409).json({
            message: "Appointment conflict detected",
            error: `${conflictCheck.reason}. Conflicting time: ${conflictCheck.conflictTime}`,
            conflict: conflictCheck.conflict,
          });
        }
      } catch (conflictError) {
        return res.status(500).json({
          message: "Change time, PT has existing appointment",
          error: conflictError.message,
        });
      }
    }

    appt.status = status;
    appt.scheduledAt = newScheduledAt;

    if (durationMinutes) {
      appt.durationMinutes = durationMinutes;
    }

    await appt.save();

    // Create notification for the PT when updating appointments (remind about working hours if needed)
    try {
      const ptUser = await User.findById(appt.pt);
      if (ptUser) {
        const hasWorkingHours = ptUser.ptProfile?.workingHours?.length > 0;

        if (!hasWorkingHours && (scheduledAt || (date && time))) {
          const setupNotification = {
            type: "setup_working_hours",
            message:
              "⚠️ You updated an appointment but still have no working hours configured. Please set your working hours in your profile for better scheduling.",
            priority: "important",
            relatedId: appt._id,
            relatedModel: "Appointment",
            read: false,
            createdAt: new Date(),
          };

          ptUser.notifications.push(setupNotification);
          await ptUser.save();
        }
      }
    } catch (ptNotificationError) {
      console.error(
        "Failed to create PT reminder notification:",
        ptNotificationError,
      );
    }

    // Create notification for the patient when PT updates appointment status
    try {
      const patientUser = await User.findById(appt.requester);
      if (patientUser) {
        let notificationMessage = "";

        switch (status) {
          case "accepted":
            notificationMessage = `Your appointment for ${new Date(appt.scheduledAt).toLocaleDateString()} at ${new Date(appt.scheduledAt).toTimeString().slice(0, 5)} has been accepted`;
            break;
          case "declined":
            notificationMessage = `Your appointment for ${new Date(appt.scheduledAt).toLocaleDateString()} at ${new Date(appt.scheduledAt).toTimeString().slice(0, 5)} has been declined`;
            break;
          case "cancelled":
            notificationMessage = `Your appointment for ${new Date(appt.scheduledAt).toLocaleDateString()} at ${new Date(appt.scheduledAt).toTimeString().slice(0, 5)} has been cancelled`;
            break;
          case "completed":
            notificationMessage = `Your appointment for ${new Date(appt.scheduledAt).toLocaleDateString()} has been completed`;
            break;
          default:
            notificationMessage = `Your appointment status has been updated to ${status}`;
        }

        const notification = {
          type: "appointment_update",
          message: notificationMessage,
          priority: "update", // Appointment status updates are important
          relatedId: appt._id,
          relatedModel: "Appointment",
          read: false,
          createdAt: new Date(),
        };

        patientUser.notifications.push(notification);
        await patientUser.save();

      }
    } catch (notificationError) {
      console.error(
        "Failed to create patient notification:",
        notificationError,
      );
      // Don't fail the status update if notification fails
    }

    res.json({ appointment: appt });
  } catch (err) {
    console.error("Error updating appointment status:", err);
    res.status(500).json({ error: "Failed to update appointment status" });
  }
};


// Get a single appointment
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await Appointment.findById(id)
      .populate("clinic")
      .populate("requester", "fullName email")
      .populate("pt", "fullName email specialization")
    if (!appt) return res.status(404).json({ error: "Appointment not found" });

    const userId = req.user._id.toString();
    if (
      req.user.role === "guest" &&
      userId !== appt.pt.toString() &&
      userId !== appt.requester.toString()
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json({ appointment: appt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get appointments by member
export const getAppointmentsByMember = async (req, res) => {
  try {
    const memberId = req.params.id;

    // Only allow admin or the member themselves
    if (req.user.role !== "admin" && req.user._id.toString() !== memberId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const appts = await Appointment.find({ requester: memberId })
      .populate("pt", "fullName email phone")
      .populate("requester", "fullName email")
      .populate("clinic", "address name contactPhone")
      .sort({ createdAt: -1 });

    return res.status(200).json({ appts });
  } catch (err) {
    console.error("❌ Failed to fetch data", err);
    return res.status(500).json({ error: err.message });
  }
};

// Delete an appointment
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ error: "Appointment not found" });

    // Only requester, PT, or admin can delete
    const userId = req.user._id.toString();
    if (
      req.user.role !== "admin" &&
      userId !== appt.pt.toString() &&
      userId !== appt.requester.toString()
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await appt.deleteOne();

    // Invalidate admin dashboard cache due to appointment deletion
    await CacheService.delPattern(`dashboard:admin:*`);
    console.log(
      `🗑️ Admin dashboard cache invalidated due to appointment deletion`,
    );

    res.json({ message: "Appointment deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
