import AdminActivityLog from "../models/AdminActivityLog.js";

export const logAdminActivity = (action, getTargetInfo = () => ({})) => {
  return async (req, res, next) => {
    // Store original res.json and res.status
    const originalJson = res.json;
    const originalStatus = res.status;

    let responseData = null;
    let statusCode = 200;

    // Override res.json to capture response data
    res.json = function(data) {
      responseData = data;
      return originalJson.call(this, data);
    };

    // Override res.status to capture status code
    res.status = function(code) {
      statusCode = code;
      return originalStatus.call(this, code);
    };

    // Continue to the actual controller
    res.on('finish', async () => {
      // Only log successful admin actions (2xx status codes)
      if (req.user?.role === 'admin' && statusCode >= 200 && statusCode < 300) {
        try {
          const targetInfo = getTargetInfo(req, responseData);
          
          await AdminActivityLog.create({
            admin: req.user._id,
            action,
            targetId: targetInfo.targetId,
            targetType: targetInfo.targetType,
            description: targetInfo.description,
            details: {
              ...targetInfo.details,
              method: req.method,
              endpoint: req.originalUrl,
              statusCode,
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
          });
        } catch (error) {
          console.error('Failed to log admin activity:', error);
          // Don't block the response if logging fails
        }
      }
    });

    next();
  };
};

// Helper functions for different action types
export const getUserTargetInfo = (req, responseData) => ({
  targetId: req.params.id,
  targetType: "User",
  description: `User ${req.params.id} role updated to ${req.body.role}`,
  details: { newRole: req.body.role, user: responseData?.user }
});

export const getLicenseTargetInfo = (req, responseData) => ({
  targetId: req.params.id,
  targetType: "User",
  description: `License ${req.body.status} for user ${req.params.id}`,
  details: { status: req.body.status, notes: req.body.notes, index: req.body.index }
});

export const getAppointmentTargetInfo = (req, responseData) => ({
  targetId: req.params.id,
  targetType: "Appointment",
  description: `Appointment ${req.params.id} ${req.method === 'DELETE' ? 'deleted' : 'updated'}`,
  details: { updates: req.body }
});

export const getPromotionTargetInfo = (req, responseData) => ({
  targetId: req.params.id,
  targetType: "Promotion",
  description: `Promotion ${req.params.id} ${req.method === 'DELETE' ? 'deleted' : 'updated'}`,
  details: { updates: req.body }
});

export const getSponsorshipTargetInfo = (req, responseData) => ({
  targetId: req.params.id,
  targetType: "ForumSub",
  description: `Sponsorship ${req.body.isSponsored ? 'enabled' : 'disabled'} for forum sub ${req.params.id}`,
  details: { sponsorshipData: req.body }
});

export const getProductTargetInfo = (req, responseData) => {
  const isCreate = req.method === 'POST';
  const isDelete = req.method === 'DELETE';
  
  return {
    targetId: isCreate ? responseData?.product?._id : req.params.id,
    targetType: "SponsoredProduct",
    description: `Sponsored product ${isCreate ? 'created' : isDelete ? 'deleted' : 'updated'} ${isCreate ? '' : req.params.id}`,
    details: { productData: req.body, product: responseData?.product }
  };
};

export const getEmailTargetInfo = (req, responseData) => ({
  targetId: req.params.id,
  targetType: "User",
  description: `Email sent to user ${req.params.id}: ${req.body.title}`,
  details: { emailTitle: req.body.title, emailBody: req.body.body }
});

export const getModRequestTargetInfo = (req, responseData) => ({
  targetId: req.params.id,
  targetType: "ModRequest",
  description: `Moderator request ${req.params.id} role updated to ${req.body.role}`,
  details: { newRole: req.body.role }
});
