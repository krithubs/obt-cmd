/**
 * Shared field length limits used across frontend (maxLength) and backend (validation).
 */

export const FIELD_LIMITS = {
  // User fields
  USER_NAME: 100,
  USER_EMAIL: 100,
  USER_PASSWORD_MIN: 6,
  USER_PASSWORD_MAX: 72, // bcrypt limit

  // Complaint fields
  COMPLAINT_NAME: 50,
  COMPLAINT_PHONE: 20,
  COMPLAINT_EMAIL: 100,
  COMPLAINT_DESCRIPTION: 2000,
  COMPLAINT_LOCATION: 300,
  COMPLAINT_INTERNAL_NOTE: 1000,

  // News fields
  NEWS_TITLE: 200,
  NEWS_CONTENT: 5000,

  // Search
  SEARCH_TERM: 200,
} as const
