# OPDFlow AI - Data Model Specification (Phase 0)

This document describes the initial PostgreSQL database schema and data models for the **OPDFlow AI** hackathon prototype. These schemas will be implemented in Supabase in subsequent phases.

---

## 1. User
Represents authentication accounts. It extends Supabase's native `auth.users` system.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, References `auth.users.id` | Unique user identifier. |
| `email` | `text` | Unique, Not Null | Account email address. |
| `role` | `enum` | Not Null, Default `'PATIENT'` | Options: `PATIENT`, `DEPARTMENT_STAFF`, `DOCTOR`, `HOSPITAL_ADMIN`. |
| `created_at` | `timestamptz`| Not Null, Default `now()` | Account registration timestamp. |

---

## 2. PatientProfile
Holds demographic and basic profile data for patient users.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Unique profile identifier. |
| `user_id` | `uuid` | References `User.id` (ON DELETE CASCADE) | The underlying authenticated user. |
| `full_name` | `text` | Not Null | Patient's full name. |
| `date_of_birth`| `date` | Not Null | Date of birth for age calculations. |
| `gender` | `text` | Not Null | Patient gender (e.g., Male, Female, Other). |
| `phone` | `text` | Not Null | Contact phone number. |
| `email` | `text` | Not Null | Contact email address. |
| `created_at` | `timestamptz`| Not Null, Default `now()` | Profile creation timestamp. |
| `updated_at` | `timestamptz`| Not Null, Default `now()` | Profile last updated timestamp. |

---

## 3. Department
Represents clinical departments within the hospital (e.g., Cardiology, Pediatrics).

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Unique department identifier. |
| `name` | `text` | Not Null, Unique | Department name (e.g., "Cardiology"). |
| `code` | `text` | Not Null, Unique | 3-4 letter prefix (e.g., "CARD", "PEDI", "DERM"). |
| `status` | `enum` | Not Null, Default `'ACTIVE'` | Options: `ACTIVE`, `INACTIVE`, `PAUSED` (due to congestion). |
| `current_capacity`| `integer`| Not Null, Default `0` | Number of patients currently inside department. |
| `max_capacity` | `integer`| Not Null, Default `3` | Maximum concurrent patient capacity. |
| `created_at` | `timestamptz`| Not Null, Default `now()` | Department configuration timestamp. |

---

## 4. StaffProfile
Holds operational details for clinical and administrative staff members.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Unique staff profile identifier. |
| `user_id` | `uuid` | References `User.id` (ON DELETE CASCADE) | The underlying authenticated user. |
| `department_id`| `uuid` | References `Department.id` (ON DELETE SET NULL) | Assigned department. |
| `full_name` | `text` | Not Null | Staff member's name. |
| `role` | `enum` | Not Null | Options: `NURSE`, `DOCTOR`, `RECEPTIONIST`. |
| `status` | `enum` | Not Null, Default `'ACTIVE'` | Options: `ACTIVE`, `ON_BREAK`, `INACTIVE`. |
| `created_at` | `timestamptz`| Not Null, Default `now()` | Staff creation timestamp. |

---

## 5. SymptomAssessment
Records the patient's answers to the structured symptom intake wizard.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Unique assessment identifier. |
| `patient_id` | `uuid` | References `PatientProfile.id` (ON DELETE CASCADE) | Patient who submitted the assessment. |
| `main_symptom` | `text` | Not Null | Primary symptom (e.g., "Chest Pain"). |
| `duration` | `text` | Not Null | Duration of symptoms (e.g., "2 hours"). |
| `severity` | `text` | Not Null | Severity rating (e.g., Slight, Moderate, Severe). |
| `associated_symptoms` | `text[]` | Not Null, Default `'{}'` | List of secondary symptoms selected. |
| `free_text_description` | `text` | | Additional text details written by the patient. |
| `status` | `enum` | Not Null, Default `'DRAFT'` | Options: `DRAFT`, `SUBMITTED`, `PROCESSED`. |
| `submitted_at` | `timestamptz`| | Timestamp when final submit occurred. |
| `created_at` | `timestamptz`| Not Null, Default `now()` | Draft initialization timestamp. |

---

## 6. TriageResult
Stores the AI-generated preliminary triage assessment and recommendation.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Unique triage result identifier. |
| `assessment_id`| `uuid` | References `SymptomAssessment.id` | Source symptom assessment questionnaire. |
| `visit_id` | `uuid` | References `Visit.id` (ON DELETE SET NULL) | Resulting hospital visit record. |
| `recommended_department_id` | `uuid` | References `Department.id` | System recommended clinic. |
| `priority` | `enum` | Not Null | Options: `P1_CRITICAL`, `P2_HIGH`, `P3_MODERATE`, `P4_ROUTINE`. |
| `explanation` | `text` | Not Null | Human-readable reasoning for priority. |
| `key_factors` | `text[]` | Not Null, Default `'{}'` | Primary factors triggering this decision. |
| `uncertainty_note`| `text` | | AI uncertainty disclaimer or note. |
| `model_version`| `text` | Not Null | Name/version of LLM used (e.g., `gemini-1.5-pro`). |
| `is_overridden`| `boolean` | Not Null, Default `false` | Set to true if a staff member overrides priority. |
| `overridden_by_staff_id` | `uuid` | References `StaffProfile.id` | Staff who performed the override. |
| `override_priority`| `enum` | | Overridden priority value. |
| `override_reason`| `text` | | Staff explanation for overriding. |
| `created_at` | `timestamptz`| Not Null, Default `now()` | Triage generation timestamp. |

---

## 7. Visit
Tracks an active patient journey through a specific department visit.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Unique visit identifier. |
| `patient_id` | `uuid` | References `PatientProfile.id` | Patient performing the visit. |
| `department_id`| `uuid` | References `Department.id` | Assigned clinic department. |
| `priority` | `enum` | Not Null | Options: `P1`, `P2`, `P3`, `P4` (e.g., P1 Critical to P4 Routine). |
| `token_number` | `text` | Not Null | Daily generated token (e.g., "C-027", "P-005"). |
| `qr_code_reference`| `text` | Not Null, Unique | Secure random string used for QR payload. |
| `status` | `enum` | Not Null, Default `'WAITING'` | Options: `WAITING`, `CHECKED_IN`, `IN_TREATMENT`, `COMPLETED`, `CANCELLED`, `NO_SHOW`. |
| `checked_in_at`| `timestamptz`| | When patient scanned in at department. |
| `treatment_started_at`| `timestamptz`| | When clinician started patient treatment. |
| `completed_at` | `timestamptz`| | When treatment was concluded/scanned out. |
| `created_at` | `timestamptz`| Not Null, Default `now()` | Visit token generation timestamp. |

---

## 8. QueueEntry
Maintains the real-time position of waiting and called patients in active queues.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Unique queue entry identifier. |
| `visit_id` | `uuid` | References `Visit.id` (ON DELETE CASCADE) | The visit representing this queue item. |
| `department_id`| `uuid` | References `Department.id` | The clinic department queue. |
| `priority` | `enum` | Not Null | Quick check priority (`P1`, `P2`, `P3`, `P4`). |
| `queue_time` | `timestamptz`| Not Null, Default `now()` | Time of entry into active queue state. |
| `status` | `enum` | Not Null, Default `'WAITING'` | Options: `WAITING`, `CALLED`. |
| `position` | `integer`| Not Null | Dynamic queue position index. |
| `created_at` | `timestamptz`| Not Null, Default `now()` | Entry creation timestamp. |

---

## 9. QRSession
Manages secure QR tokens to ensure QR codes expire and cannot be reused maliciously.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Unique session identifier. |
| `visit_id` | `uuid` | References `Visit.id` (ON DELETE CASCADE) | The associated visit. |
| `secure_reference`| `text` | Not Null, Unique | The random code embedded in the QR image. |
| `status` | `enum` | Not Null, Default `'ACTIVE'` | Options: `ACTIVE`, `EXPIRED`. |
| `created_at` | `timestamptz`| Not Null, Default `now()` | Generation timestamp. |

---

## 10. AuditEvent
Logs critical changes and manual overrides for transparency and system review.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Unique log identifier. |
| `actor_id` | `uuid` | References `User.id` | User triggering the audit event. |
| `action_type` | `text` | Not Null | E.g., `TRIAGE_CREATED`, `QUEUE_OVERRIDE`, `DEPARTMENT_PAUSED`, `CHECKIN_SUCCESS`. |
| `description` | `text` | Not Null | Detailed text log (e.g., "Staff overridden token C-027 to P1 Critical"). |
| `timestamp` | `timestamptz`| Not Null, Default `now()` | Occurrence timestamp. |
| `ip_address` | `text` | | IP address of user interface client. |
