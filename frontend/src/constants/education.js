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
  {
    value: "professional_development",
    labelKey: "edu_cat_professional_development",
  },
  {
    value: "physiotherapy_assessment",
    labelKey: "edu_cat_physiotherapy_assessment",
  },
  { value: "clinical_pathology", labelKey: "edu_cat_clinical_pathology" },
  {
    value: "physiotherapeutic_pharmacology",
    labelKey: "edu_cat_physiotherapeutic_pharmacology",
  },
  {
    value: "neuromuscular_physiotherapy",
    labelKey: "edu_cat_neuromuscular_physiotherapy",
  },
  { value: "intensive_care", labelKey: "edu_cat_intensive_care" },
  { value: "health_promotion", labelKey: "edu_cat_health_promotion" },
  {
    value: "soft_tissue_manipulation",
    labelKey: "edu_cat_soft_tissue_manipulation",
  },
  { value: "electrotherapy", labelKey: "edu_cat_electrotherapy" },
  { value: "sports_medicine", labelKey: "edu_cat_sports_medicine" },
  { value: "counseling_skills", labelKey: "edu_cat_counseling_skills" },
  { value: "database", labelKey: "edu_cat_database" },
  { value: "communication_skills", labelKey: "edu_cat_communication_skills" },
  { value: "microbiology", labelKey: "edu_cat_microbiology" },
  { value: "parasitology", labelKey: "edu_cat_parasitology" },
  {
    value: "medical_ethics_and_professionalism",
    labelKey: "edu_cat_medical_ethics_and_professionalism",
  },
  {
    value: "entrepreneurship_and_life_skills",
    labelKey: "edu_cat_entrepreneurship_and_life_skills",
  },
  {
    value: "infection_prevention_and_control",
    labelKey: "edu_cat_infection_prevention_and_control",
  },
  {
    value: "epidemiology_and_biostatistics",
    labelKey: "edu_cat_epidemiology_and_biostatistics",
  },
  {
    value: "computer_application_and_health_information",
    labelKey: "edu_cat_computer_application_and_health_information",
  },
  {
    value: "emergency_preparedness_and_disaster_management",
    labelKey: "edu_cat_emergency_preparedness_and_disaster_management",
  },
  { value: "nutrition", labelKey: "edu_cat_nutrition" },
  { value: "movement_science", labelKey: "edu_cat_movement_science" },
  { value: "patient_care", labelKey: "edu_cat_patient_care" },
  { value: "psychology", labelKey: "edu_cat_psychology" },
  { value: "sociology", labelKey: "edu_cat_sociology" },
  { value: "nursing_and_first_aid", labelKey: "edu_cat_nursing_and_first_aid" },
  { value: "manual_therapy", labelKey: "edu_cat_manual_therapy" },
  { value: "ergonomics", labelKey: "edu_cat_ergonomics" },
  { value: "thermotherapy", labelKey: "edu_cat_thermotherapy" },
  { value: "psychiatry", labelKey: "edu_cat_psychiatry" },
  { value: "pain_management", labelKey: "edu_cat_pain_management" },
  {
    value: "obstetrics_and_gynecology",
    labelKey: "edu_cat_obstetrics_and_gynecology",
  },
  { value: "urology", labelKey: "edu_cat_urology" },
  { value: "cardio_respiratory", labelKey: "edu_cat_cardio_respiratory" },
  { value: "pediatric", labelKey: "edu_cat_pediatric" },
  { value: "radiology", labelKey: "edu_cat_radiology" },
  { value: "patient_guidelines", labelKey: "edu_cat_patient_guidelines" },
  { value: "publications", labelKey: "edu_cat_publications" },
];

// Categories sorted alphabetically by their translated label.
export const getSortedCategories = (t) =>
  [...EDUCATION_CATEGORIES].sort((a, b) =>
    t(a.labelKey).localeCompare(t(b.labelKey)),
  );

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
