-- Document Library Table for Digitized Files
CREATE TABLE `document_library` (
  `document_id` int NOT NULL AUTO_INCREMENT,
  `student_id` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_type` enum('inventory','referral','follow-up','case') COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stored_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'image/jpeg',
  `uploaded_by` int NOT NULL,
  `school_attended` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `access_level` enum('student','counselor','coordinator','sdo') COLLATE utf8mb4_unicode_ci DEFAULT 'coordinator',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`document_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_document_type` (`document_type`),
  KEY `idx_school` (`school_attended`),
  KEY `idx_uploaded_by` (`uploaded_by`),
  KEY `idx_uploaded_at` (`uploaded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraint
ALTER TABLE `document_library`
  ADD CONSTRAINT `fk_doc_student` FOREIGN KEY (`student_id`) REFERENCES `student_table` (`StudentId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_doc_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `accounts` (`id`) ON DELETE RESTRICT;
