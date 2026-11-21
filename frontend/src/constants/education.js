// Education Resources constants — mirrors backend/src/constants/education.js

export const EDUCATION_CATEGORIES = [
  { value: "anatomy", labelKey: "edu_cat_anatomy" },
  { value: "physiology", labelKey: "edu_cat_physiology" },
  { value: "kinesiology", labelKey: "edu_cat_kinesiology" },
  { value: "physiotherapy", labelKey: "edu_cat_physiotherapy" },
  { value: "rehabilitation", labelKey: "edu_cat_rehabilitation" },
  { value: "research", labelKey: "edu_cat_research" },
  { value: "clinical_practice", labelKey: "edu_cat_clinical_practice" },
  { value: "education", labelKey: "edu_cat_education" },
  { value: "professional_development", labelKey: "edu_cat_professional_development" },
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

export const EDUCATION_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "sw", label: "Swahili" },
];

export const EDUCATION_LICENSE_TYPES = [
  { value: "original_work", labelKey: "edu_license_original_work" },
  { value: "public_domain", labelKey: "edu_license_public_domain" },
  { value: "cc0", labelKey: "edu_license_cc0" },
  { value: "cc_by", labelKey: "edu_license_cc_by" },
  { value: "cc_by_sa", labelKey: "edu_license_cc_by_sa" },
  { value: "permission_granted", labelKey: "edu_license_permission_granted" },
  { value: "other_authorized", labelKey: "edu_license_other_authorized" },
];

export const RESOURCE_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "suspended",
  "removed",
];

export const REPORT_REASONS = [
  { value: "unauthorized_textbook", labelKey: "edu_report_reason_textbook" },
  { value: "unauthorized_article", labelKey: "edu_report_reason_article" },
  { value: "unauthorized_lecture_material", labelKey: "edu_report_reason_lecture" },
  { value: "unauthorized_commercial_publication", labelKey: "edu_report_reason_commercial" },
  { value: "trademark_or_other_ip", labelKey: "edu_report_reason_ip" },
  { value: "other", labelKey: "edu_report_reason_other" },
];

export const MAX_FILE_SIZE_MB = 15;
export const ACCEPTED_FILE_TYPES = ".pdf,.docx,.pptx,.epub";
