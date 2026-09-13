-- Brings a database that is out of sync with the committed guidance_tbl.sql
-- (KC's schema/data export) up to date. Found and applied during a full
-- table-by-table audit on 2026-09-13; already applied to the local dev DB.
--
-- Safe to run against any environment that hasn't had these applied yet
-- (production included). Each ALTER TABLE will fail harmlessly with a
-- "Duplicate column name" error if it was already applied there — just
-- skip that statement and continue with the rest.

-- 1. student_table was missing the address *Code columns that
--    api/save-student.php already writes to (it uses defensive column
--    lookups, so without these the region/province/city/barangay codes for
--    student addresses were silently never saved, no error).
ALTER TABLE student_table ADD COLUMN CurrentAddressRegionCode VARCHAR(20) DEFAULT NULL AFTER CurrentAddressData;
ALTER TABLE student_table ADD COLUMN CurrentAddressProvinceCode VARCHAR(20) DEFAULT NULL AFTER CurrentAddressRegionName;
ALTER TABLE student_table ADD COLUMN CurrentAddressCityCode VARCHAR(20) DEFAULT NULL AFTER CurrentAddressProvinceName;
ALTER TABLE student_table ADD COLUMN CurrentAddressBarangayCode VARCHAR(20) DEFAULT NULL AFTER CurrentAddressCityName;
ALTER TABLE student_table ADD COLUMN PermanentAddressRegionCode VARCHAR(20) DEFAULT NULL AFTER PermanentAddressData;
ALTER TABLE student_table ADD COLUMN PermanentAddressProvinceCode VARCHAR(20) DEFAULT NULL AFTER PermanentAddressRegionName;
ALTER TABLE student_table ADD COLUMN PermanentAddressCityCode VARCHAR(20) DEFAULT NULL AFTER PermanentAddressProvinceName;
ALTER TABLE student_table ADD COLUMN PermanentAddressBarangayCode VARCHAR(20) DEFAULT NULL AFTER PermanentAddressCityName;

-- 2. section's SectionName column was too narrow (varchar(45)) for the
--    longest current category name (87 chars) — widen to match the
--    committed schema (varchar(100)) before renaming the rows below.
ALTER TABLE section MODIFY SectionName VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL;

-- 3. section rows still had the old category names — rename by ID so any
--    case already filed under these IDs keeps its link, just displays the
--    corrected text.
UPDATE section SET SectionCode = 'A', SectionName = 'Behavioral or Conduct Problem' WHERE SectionID = 1;
UPDATE section SET SectionCode = 'B', SectionName = 'Self-Harming Behavior or Suicide Ideation' WHERE SectionID = 2;
UPDATE section SET SectionCode = 'C', SectionName = 'Poor Social Skills - Bullying' WHERE SectionID = 3;
UPDATE section SET SectionCode = 'D', SectionName = 'Poor Academic Performance' WHERE SectionID = 4;
UPDATE section SET SectionCode = 'E', SectionName = 'Difficulty in Adapting to Current Situation' WHERE SectionID = 5;
UPDATE section SET SectionCode = 'F', SectionName = 'Signs of Distress Characterized by Physical Deterioration, Lack of Focus and Motivation' WHERE SectionID = 6;

-- 4. schools was missing two schools that exist in KC's list.
INSERT IGNORE INTO schools (school_code, school_name, school_level, assignment_type, is_active, created_at, updated_at, district) VALUES
('bucayao', 'Bucayao National High School', 'Secondary', 'both', 1, '2026-04-29 05:40:02', '2026-09-06 06:21:40', 'Bucayao National High School'),
('camilmil-elementary-school', 'camilmil elementary school', 'East', 'counselor', 1, '2026-09-08 12:55:06', '2026-09-08 12:55:06', 'camilmil elementary school');

-- 5. case_category had drifted from KC's version: some categories renamed
--    with different wording, one category ("All forms of abuse") that
--    isn't in KC's version, and 7 categories from KC's version missing
--    here. Decision made 2026-09-13: adopt KC's version fully.
UPDATE case_category SET CategoryName = 'Emotional/Sociological' WHERE CaseId = '14';
UPDATE case_category SET CategoryName = 'Transferees w/ difficulty adjusting to new environment' WHERE CaseId = '19';
UPDATE case_category SET CategoryName = 'Physical Abuse' WHERE CaseId = '24';
UPDATE case_category SET CategoryName = 'Verbal Abuse' WHERE CaseId = '25';
UPDATE case_category SET CategoryName = 'Sexual Abuse' WHERE CaseId = '26';
DELETE FROM case_category WHERE CaseId = '23' AND CategoryName = 'All forms of abuse';
INSERT INTO case_category (CaseId, SectionID, CategoryName) VALUES
('28', 1, 'CAR'),
('29', 1, 'Child Inconflict with the Law(CICL)'),
('30', 3, 'Cyberbullying'),
('31', 3, 'Gender-Based'),
('32', 3, 'Social'),
('33', 4, 'SARDO'),
('34', 5, 'Victims of Calamity');
