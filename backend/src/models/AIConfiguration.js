import mongoose from "mongoose";

const aiConfigurationSchema = new mongoose.Schema(
  {
    // Global killswitch — AI_ENABLED=false disables all agents
    enabled: { type: Boolean, default: true },

    // Per-agent settings; model is configurable without redeploy
    agents: [
      {
        name: {
          type: String,
          enum: ["physiotherapy", "forumContent", "virtualAdmin"],
          required: true,
        },
        enabled: { type: Boolean, default: true },
        model: { type: String, default: null }, // null → use default
        dailyRequestCap: { type: Number, default: null }, // null → built-in default
        systemPrompt: { type: String, default: null }, // override; null → code default
        schedule: { type: String, default: null }, // cron expr for job agents
        lastRunAt: { type: Date, default: null },
      },
    ],

    // Safety toggles
    safetyClassifierEnabled: { type: Boolean, default: true },
    knowledgeRetrievalEnabled: { type: Boolean, default: true },

    // Admin alerting
    adminEmail: { type: String, default: null }, // null → resolved from admin user
  },
  { timestamps: true },
);

// Singleton enforced at application level (findOneAndUpdate upsert).
// Do NOT add a unique index on _id — MongoDB manages it implicitly.

const AIConfiguration = mongoose.model("AIConfiguration", aiConfigurationSchema);

export default AIConfiguration;
