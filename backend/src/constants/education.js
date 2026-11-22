// Shared enums and constants for the Education Resources module.
// Keep values stable — they are stored in MongoDB and exposed via API.

export const EDUCATION_CATEGORIES = [
  "anatomy",
  "physiology",
  "kinesiology",
  "physiotherapy",
  "rehabilitation",
  "research",
  "clinical_practice",
  "education",
  "professional_development",
  "physiotherapy_assessment",
  "clinical_pathology",
  "physiotherapeutic_pharmacology",
  "neuromuscular_physiotherapy",
  "intensive_care",
  "health_promotion",
  "soft_tissue_manipulation",
  "electrotherapy",
  "sports_medicine",
  "counseling_skills",
  "database",
  "communication_skills",
  "microbiology",
  "parasitology",
  "medical_ethics_and_professionalism",
  "entrepreneurship_and_life_skills",
  "infection_prevention_and_control",
  "epidemiology_and_biostatistics",
  "computer_application_and_health_information",
  "emergency_preparedness_and_disaster_management",
  "nutrition",
  "movement_science",
  "patient_care",
  "psychology",
  "sociology",
  "nursing_and_first_aid",
  "manual_therapy",
  "ergonomics",
  "thermotherapy",
  "psychiatry",
  "pain_management",
  "obstetrics_and_gynecology",
  "urology",
  "cardio_respiratory",
  "pediatric",
  "radiology",
];

export const EDUCATION_SUBCATEGORIES = {
  anatomy: ["musculoskeletal", "neuroanatomy", "other"],
  physiology: ["exercise_physiology", "cardiovascular", "other"],
  kinesiology: ["biomechanics", "gait_analysis", "movement_science", "other"],
  physiotherapy: ["musculoskeletal", "neurological", "cardiorespiratory", "other"],
  rehabilitation: ["exercise_therapy", "rehabilitation_protocols", "other"],
  research: ["research_articles", "systematic_reviews", "other"],
  clinical_practice: ["clinical_guidelines", "assessment_tools", "other"],
  education: ["lecture_notes", "presentations", "assignments", "other"],
  professional_development: ["cpd_materials", "professional_guidance", "other"],
};

export const EDUCATION_FILE_TYPES = ["pdf", "docx", "pptx", "epub"];

export const EDUCATION_FILE_TYPE_MIMES = {
  pdf: ["application/pdf"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  pptx: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  epub: ["application/epub+zip"],
};

export const EDUCATION_FILE_EXTENSIONS = {
  pdf: [".pdf"],
  docx: [".docx"],
  pptx: [".pptx"],
  epub: [".epub"],
};

export const EDUCATION_LANGUAGES = ["en", "sw"];

export const EDUCATION_LICENSE_TYPES = [
  "original_work",
  "public_domain",
  "cc0",
  "cc_by",
  "cc_by_sa",
  "permission_granted",
  "other_authorized",
];

export const RESOURCE_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "suspended",
  "removed",
];

// Allowed status transitions for admin review actions.
// Key: current status, Value: array of allowed next statuses.
export const RESOURCE_STATUS_TRANSITIONS = {
  pending: ["approved", "rejected"],
  approved: ["suspended", "removed"],
  suspended: ["approved", "removed"],
  rejected: [],
  removed: [],
};

export const REQUEST_STATUSES = ["open", "fulfilled", "rejected", "closed"];

export const REPORT_REASONS = [
  "unauthorized_textbook",
  "unauthorized_article",
  "unauthorized_lecture_material",
  "unauthorized_commercial_publication",
  "trademark_or_other_ip",
  "other",
];

export const REPORT_STATUSES = [
  "pending",
  "under_review",
  "resolved",
  "rejected",
];

export const REPORT_ACTIONS = [
  "none",
  "download_hold",
  "hold_released",
  "resource_removed",
  "resource_restored",
  "no_action",
];

export const EDUCATION_LIMITS = {
  maxFileSizeBytes: () =>
    (parseInt(process.env.EDUCATION_MAX_FILE_SIZE_MB, 10) || 15) * 1024 * 1024,
  downloadUrlTtlSeconds: () =>
    parseInt(process.env.EDUCATION_DOWNLOAD_URL_TTL_SECONDS, 10) || 300,
  defaultPageSize: () =>
    parseInt(process.env.EDUCATION_DEFAULT_PAGE_SIZE, 10) || 20,
  maxPageSize: () => parseInt(process.env.EDUCATION_MAX_PAGE_SIZE, 10) || 50,
  dailyDownloadLimit: () =>
    parseInt(process.env.EDUCATION_DAILY_DOWNLOAD_LIMIT, 10) || 20,
};

export const RESOURCE_SORT_FIELDS = ["newest", "title", "downloads"];
