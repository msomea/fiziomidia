import Appointment from "../models/Appointment.js";
import Clinic from "../models/Clinic.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// Helper function to create datetime in East Africa Time
const createEATDateTime = (date, time) => {
  const dateTimeString = `${date}T${time}:00`;
  const utcDate = new Date(dateTimeString);
  // Convert to East Africa Time (UTC+3)
  const eatDate = new Date(utcDate.getTime() + 3 * 60 * 60 * 1000);
  return eatDate;
};

// Check clinic working hours and availability
const checkClinicAvailability = async (clinicId, date, time) => {
  try {
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      throw new Error("Clinic not found");
    }

    // Check if clinic has working hours configured
    const hasWorkingHours = clinic.workingHours && clinic.workingHours.length > 0;

    if (!hasWorkingHours) {
      return { hasWorkingHours: false, isValid: true, clinic };
    }

    // Validate time is within working hours
    const scheduledDateTime = createEATDateTime(date, time);
    const dayOfWeek = scheduledDateTime.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "Africa/Dar_es_Salaam",
    });

    const workingHours = clinic.workingHours.find(
      (wh) => wh.dayOfWeek === dayOfWeek && wh.isAvailable
    );

    if (!workingHours) {
      return { hasWorkingHours: false, isValid: true, clinic };
    }

    // Check if requested time is within working hours
    if (time < workingHours.from || time > workingHours.to) {
      return { 
        hasWorkingHours: true, 
        isValid: false, 
        clinic,
        reason: `Requested time ${time} is outside clinic working hours (${workingHours.from} - ${workingHours.to})`
      };
    }

    return { hasWorkingHours: true, isValid: true, clinic };
  } catch (error) {
    throw error;
  }
};

// Check for conflicting appointments at clinic level
const checkClinicAppointmentConflict = async (
  clinicId,
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

    // Build query to find potentially overlapping appointments at the same clinic
    const conflictQuery = {
      clinic: new mongoose.Types.ObjectId(clinicId),
      status: { $in: ["pending", "accepted"] }, // Only check active appointments
      scheduledAt: {
        $gte: new Date(bufferedStart.toISOString()),
        $lt: new Date(bufferedEnd.toISOString()),
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
      if (bufferedStart < conflictEnd && bufferedEnd > conflictStart) {
        return {
          hasConflict: true,
          conflict,
          reason: "Time slot conflicts with existing clinic appointment",
          conflictTime: `${conflictStart.toTimeString().slice(0, 5)} - ${conflictEnd.toTimeString().slice(0, 5)}`,
        };
      }
    }

    return { hasConflict: false };
  } catch (error) {
    throw new Error(
      `Change time, clinic has existing appointment: ${error.message}`,
    );
  }
};

// Request appointment at clinic level
export const requestClinicAppointment = async (req, res) => {
  try {
    const { clinic, pt, date, time, notes, durationMinutes = 60 } = req.body;
    const requesterId = req.user._id; // get logged-in member

    if (!clinic) return res.status(400).json({ message: "Clinic is required" });
    if (!date) return res.status(400).json({ message: "Date is required" });
    if (!time) return res.status(400).json({ message: "Time is required" });

    // Create scheduledAt datetime in East Africa Time
    const scheduledAt = createEATDateTime(date, time);

    // Validate clinic availability
    let availabilityResult;
    try {
      availabilityResult = await checkClinicAvailability(clinic, date, time);
    } catch (validationError) {
      return res.status(400).json({
        message: "Check clinic availability",
        error: validationError.message,
      });
    }

    // Check for appointment conflicts only if clinic has working hours
    try {
      const conflictCheck = await checkClinicAppointmentConflict(
        clinic,
        scheduledAt,
        durationMinutes,
        null,
        availabilityResult.hasWorkingHours,
      );
      if (conflictCheck.hasConflict) {
        return res.status(409).json({
          message: "Clinic appointment conflict detected",
          error: `${conflictCheck.reason}. Conflicting time: ${conflictCheck.conflictTime}`,
          conflict: conflictCheck.conflict,
        });
      }
    } catch (conflictError) {
      return res.status(500).json({
        message: "Change time, clinic has existing appointment",
        error: conflictError.message,
      });
    }

    // If PT is specified, validate PT availability
    if (pt) {
      try {
        const ptUser = await User.findById(pt);
        if (!ptUser || ptUser.role !== "physiotherapist") {
          return res.status(400).json({ message: "Invalid physiotherapist selected" });
        }

        // Check if PT works at this clinic
        const clinicData = availabilityResult.clinic;
        const ptWorksAtClinic = clinicData.physiotherapists.some(
          ptId => ptId.toString() === pt
        );

        if (!ptWorksAtClinic) {
          return res.status(400).json({ 
            message: "Selected physiotherapist does not work at this clinic" 
          });
        }

        // Optional: Check PT working hours (but don't block if not configured)
        const hasPTWorkingHours = ptUser.ptProfile?.workingHours?.length > 0;
        if (hasPTWorkingHours) {
          const scheduledDateTime = createEATDateTime(date, time);
          const dayOfWeek = scheduledDateTime.toLocaleDateString("en-US", {
            weekday: "long",
            timeZone: "Africa/Dar_es_Salaam",
          });

          const ptWorkingHours = ptUser.ptProfile.workingHours.find(
            (wh) => wh.dayOfWeek === dayOfWeek && wh.isAvailable
          );
        }
      } catch (ptError) {
        return res.status(400).json({
          message: "Invalid physiotherapist",
          error: ptError.message,
        });
      }
    }

    const appointment = new Appointment({
      requester: new mongoose.Types.ObjectId(requesterId),
      pt: pt ? new mongoose.Types.ObjectId(pt) : undefined,
      clinic: new mongoose.Types.ObjectId(clinic),
      scheduledAt: scheduledAt,
      durationMinutes: durationMinutes,
      // Keep legacy fields for backward compatibility
      scheduledDate: date,
      scheduledTime: time,
      notes,
    });

    await appointment.save();

    // Create notification for the CLINIC OWNER
    try {
      const clinicData = availabilityResult.clinic;
      const clinicOwner = await User.findById(clinicData.ownerUserId);
      
      if (clinicOwner) {
        let notificationMessage = `New clinic appointment request from ${req.user.fullName || "A patient"} for ${date} at ${time}`;
        let notificationType = "new_clinic_appointment";
        let notificationPriority = "important";

        // Check if clinic has working hours configured
        if (!availabilityResult.hasWorkingHours) {
          notificationMessage += ". \u26a0\ufe0f Please configure your clinic working hours for better scheduling.";
          notificationType = "setup_clinic_hours";
          notificationPriority = "important";
        }

        // If no PT was specified, remind to assign one
        if (!pt) {
          notificationMessage += ". \u2139\ufe0f No physiotherapist specified - please assign one.";
          notificationType = "assign_physiotherapist";
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

        // Add notification to clinic owner's notifications array
        clinicOwner.notifications.push(notification);
        await clinicOwner.save();

        // If PT was specified, also notify them
        if (pt) {
          try {
            const ptUser = await User.findById(pt);
            if (ptUser) {
              const ptNotification = {
                type: "clinic_appointment_assigned",
                message: `New clinic appointment assigned to you from ${req.user.fullName || "A patient"} for ${date} at ${time} at ${clinicData.name}`,
                priority: "update",
                relatedId: appointment._id,
                relatedModel: "Appointment",
                read: false,
                createdAt: new Date(),
              };

              ptUser.notifications.push(ptNotification);
              await ptUser.save();
            }
          } catch (ptNotificationError) {
            console.error("Failed to create PT notification:", ptNotificationError);
          }
        }
      }
    } catch (notificationError) {
      console.error("Failed to create clinic owner notification:", notificationError);
      // Don't fail the appointment creation if notification fails
    }

    res.status(201).json({
      message: "Clinic appointment requested successfully",
      appointment,
    });
  } catch (error) {
    console.error("Request clinic appointment error:", error);
    res.status(400).json({
      message: "Clinic appointment validation failed",
      error: error.message,
    });
  }
};

// Get available PTs for a clinic
export const getClinicAvailablePTs = async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    const clinic = await Clinic.findById(clinicId)
      .populate('physiotherapists', 'fullName email ptProfile.speciality ptProfile.availability');
    
    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found" });
    }

    // Filter PTs who are accepting new patients
    const availablePTs = clinic.physiotherapists.filter(pt => 
      pt.ptProfile?.availability?.isAcceptingNewPatients !== false
    );

    res.json({ 
      clinic: {
        _id: clinic._id,
        name: clinic.name,
        address: clinic.address,
        contactPhone: clinic.contactPhone,
        workingHours: clinic.workingHours
      },
      availablePTs 
    });
  } catch (error) {
    console.error("Error fetching clinic available PTs:", error);
    res.status(500).json({ error: "Failed to fetch clinic available PTs" });
  }
};

// Get clinic appointments (for clinic owners)
export const getClinicAppointments = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const userId = req.user._id;
    
    
    // Verify user owns the clinic
    const clinic = await Clinic.findById(clinicId);
    
    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found" });
    }
    
    if (clinic.ownerUserId.toString() !== userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden - you don't own this clinic" });
    }

    const appointments = await Appointment.find({ clinic: clinicId })
      .populate("pt", "fullName email ptProfile.speciality")  
      .populate("requester", "fullName email")
      .sort({ createdAt: -1 });



    res.json({ appointments });
  } catch (error) {
    console.error("Error fetching clinic appointments:", error);
    res.status(500).json({ error: "Failed to fetch clinic appointments" });
  }
};

// Accept or reject clinic appointment (for clinic owners)
export const updateClinicAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, assignedPT, scheduledDate, scheduledTime, notes } = req.body;
    const userId = req.user._id;

    // Validate status
    const validStatuses = ["accepted", "declined", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate("clinic")
      .populate("requester", "fullName email")
      .populate("pt", "fullName email");

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Verify user owns the clinic
    if (appointment.clinic.ownerUserId.toString() !== userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden - you don't own this clinic" });
    }

    // If accepting, ensure a PT is assigned
    if (status === "accepted" && !assignedPT && !appointment.pt) {
      return res.status(400).json({ 
        error: "Must assign a physiotherapist when accepting appointment" 
      });
    }

    // Update appointment
    appointment.status = status;
    appointment.adminNotes = notes;

    // Handle PT assignment
    if (assignedPT) {
      // Verify the PT works at this clinic
      const clinic = await Clinic.findById(appointment.clinic._id);
      const ptWorksAtClinic = clinic.physiotherapists.some(
        ptId => ptId.toString() === assignedPT
      );

      if (!ptWorksAtClinic) {
        return res.status(400).json({ 
          error: "Selected physiotherapist does not work at this clinic" 
        });
      }

      appointment.pt = assignedPT;
    }

    // Handle time updates if provided
    if (scheduledDate && scheduledTime) {
      const scheduledAt = createEATDateTime(scheduledDate, scheduledTime);
      appointment.scheduledAt = scheduledAt;
      appointment.scheduledDate = scheduledDate;
      appointment.scheduledTime = scheduledTime;
    }

    await appointment.save();

    // Create notifications
    try {
      // Notify the patient about the status update
      const patientUser = await User.findById(appointment.requester._id);
      if (patientUser) {
        let notificationMessage = "";
        let notificationType = "clinic_appointment_update";

        switch (status) {
          case "accepted":
            notificationMessage = `Your appointment at ${appointment.clinic.name} on ${new Date(appointment.scheduledAt).toLocaleDateString()} at ${new Date(appointment.scheduledAt).toTimeString().slice(0, 5)} has been accepted`;
            break;
          case "declined":
            notificationMessage = `Your appointment at ${appointment.clinic.name} on ${new Date(appointment.scheduledAt).toLocaleDateString()} at ${new Date(appointment.scheduledAt).toTimeString().slice(0, 5)} has been declined`;
            break;
          case "cancelled":
            notificationMessage = `Your appointment at ${appointment.clinic.name} on ${new Date(appointment.scheduledAt).toLocaleDateString()} at ${new Date(appointment.scheduledAt).toTimeString().slice(0, 5)} has been cancelled`;
            break;
        }

        if (assignedPT && status === "accepted") {
          const ptUser = await User.findById(assignedPT);
          if (ptUser) {
            notificationMessage += ` with ${ptUser.fullName}`;
          }
        }

        const patientNotification = {
          type: notificationType,
          message: notificationMessage,
          priority: "update",
          relatedId: appointment._id,
          relatedModel: "Appointment",
          read: false,
          createdAt: new Date(),
        };

        patientUser.notifications.push(patientNotification);
        await patientUser.save();
      }

      // If a PT was assigned, notify them
      if (assignedPT && status === "accepted") {
        const ptUser = await User.findById(assignedPT);
        if (ptUser) {
          const ptNotification = {
            type: "appointment_assigned",
            message: `You have been assigned an appointment at ${appointment.clinic.name} on ${new Date(appointment.scheduledAt).toLocaleDateString()} at ${new Date(appointment.scheduledAt).toTimeString().slice(0, 5)} with ${appointment.requester.fullName}`,
            priority: "important",
            relatedId: appointment._id,
            relatedModel: "Appointment",
            read: false,
            createdAt: new Date(),
          };

          ptUser.notifications.push(ptNotification);
          await ptUser.save();
        }
      }
    } catch (notificationError) {
      console.error("Failed to create notifications:", notificationError);
      // Don't fail the status update if notifications fail
    }

    // Return updated appointment with populated data
    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate("pt", "fullName email ptProfile.speciality")
      .populate("requester", "fullName email")
      .populate("clinic", "name address");

    res.json({ 
      message: `Appointment ${status} successfully`,
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error("Error updating clinic appointment status:", error);
    res.status(500).json({ error: "Failed to update appointment status" });
  }
};

// Get available PTs for appointment assignment (for clinic owners)
export const getClinicPTsForAssignment = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const userId = req.user._id;
    
    // Verify user owns the clinic
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found" });
    }
    
    if (clinic.ownerUserId.toString() !== userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden - you don't own this clinic" });
    }

    // Get all PTs working at the clinic with their availability
    const pts = await User.find({ 
      _id: { $in: clinic.physiotherapists },
      role: "physiotherapist"
    }).select("fullName email ptProfile.speciality ptProfile.availability ptProfile.workingHours");

    res.json({ pts });
  } catch (error) {
    console.error("Error fetching clinic PTs for assignment:", error);
    res.status(500).json({ error: "Failed to fetch clinic PTs" });
  }
};

// Get member's clinic appointments (only for clinics they own)
export const getMemberClinicAppointments = async (req, res) => {
  try {
    const userId = req.user._id;
    // First, find all clinics owned by this member
    const ownedClinics = await Clinic.find({ ownerUserId: userId }).select('_id');
    const ownedClinicIds = ownedClinics.map(clinic => clinic._id);
    
    // Get all clinic appointments where the user is the requester AND the clinic is owned by them
    const appointments = await Appointment.find({ 
      clinic: { $in: ownedClinicIds }
    })
      .populate("clinic", "name address contactPhone")
      .populate("pt", "fullName email ptProfile.speciality")
      .populate("requester", "fullName")
      .sort({ createdAt: -1 });

    res.json({ appointments });
  } catch (error) {
    console.error("Error fetching member clinic appointments:", error);
    res.status(500).json({ error: "Failed to fetch clinic appointments" });
  }
};

// Get clinic appointments for PTs who work at the clinic (not just owners)
export const getClinicAppointmentsForPT = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const userId = req.user._id;
    
    // Verify the clinic exists
    const clinic = await Clinic.findById(clinicId);
    
    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found" });
    }
    
    // Check if PT works at this clinic (is in the physiotherapists array)
    const worksAtClinic = clinic.physiotherapists.some(ptId => 
      ptId.toString() === userId.toString()
    );
    
    if (!worksAtClinic && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden - you don't work at this clinic" });
    }

    // Get appointments for this clinic
    const appointments = await Appointment.find({ clinic: clinicId })
      .populate("pt", "fullName email ptProfile.speciality")  
      .populate("requester", "fullName email")
      .sort({ createdAt: -1 });

    res.json({ appointments });
  } catch (error) {
    console.error("Error fetching clinic appointments for PT:", error);
    res.status(500).json({ error: "Failed to fetch clinic appointments" });
  }
};

// Get a single clinic appointment by ID
export const getClinicAppointmentById = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user._id;

    // Find the appointment and populate related fields
    const appointment = await Appointment.findById(appointmentId)
      .populate("pt", "fullName email ptProfile.speciality")
      .populate("requester", "fullName email")
      .populate("clinic", "name");

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Check if user is authorized to view this appointment
    // User can view if they are:
    // 1. The requester
    // 2. The assigned PT
    // 3. The clinic owner
    // 4. An admin
    
    const isRequester = appointment.requester._id.toString() === userId.toString();
    const isAssignedPT = appointment.pt?._id?.toString() === userId.toString();
    const clinic = await Clinic.findById(appointment.clinic._id);
    const isClinicOwner = clinic?.ownerUserId?.toString() === userId.toString();
    const isAdmin = req.user.role === "admin";

    if (!isRequester && !isAssignedPT && !isClinicOwner && !isAdmin) {
      return res.status(403).json({ error: "Forbidden - you don't have permission to view this appointment" });
    }

    res.json({ appointment });
  } catch (error) {
    console.error("Error fetching clinic appointment:", error);
    res.status(500).json({ error: "Failed to fetch clinic appointment" });
  }
};
