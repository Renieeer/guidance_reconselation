-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 07, 2026 at 08:01 PM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `guidance_tbl`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `id` int NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'student',
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school_attended` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `accounts`
--

INSERT INTO `accounts` (`id`, `email`, `password`, `user_type`, `first_name`, `last_name`, `phone`, `school_attended`, `created_at`, `updated_at`) VALUES
(5, 'counselor@gmail.com', '$2y$10$ERhNcegrQ3gFj/W.TFsYRuiCVCMo/ZXYZACaPbrSGdusX33Erpayi', 'counselor', 'admin', 'admin', NULL, 'omnhs', '2026-04-03 17:36:15', '2026-04-03 17:36:15'),
(7, 'coordinator@gmail.com', '$2y$10$OWydHeJe.A2tN.okDVio0ep7AKqbroyKExuzlLZvAPhINMVBi86NK', 'coordinator', 'admin', 'admin', NULL, 'omnhs', '2026-04-03 17:42:55', '2026-04-03 17:42:55'),
(8, 'teacher@gmail.com', '$2y$10$uJpWqcqk7UNLlsGgb6MrIeb2KBsGOazzSoIL6rATszSDNF.lK6lye', 'teacher', 'admin', 'admin', NULL, 'omnhs', '2026-04-03 17:55:54', '2026-04-03 17:55:54'),
(9, 'reneirmanongsong1@gmail.com', '$2y$10$YxDu8IvRTZDl0aO0oZZoguOL/cFuy5bE0ER2A0QV5cZruFfU40jsO', 'student', 'renier', 'manongsong', NULL, 'omnhs', '2026-04-03 18:12:32', '2026-04-03 18:12:32'),
(10, 'alice@test.com', '$2y$10$9wEJRqygMcudm44rDyy.QO3AtJAK3L7.swGkUyjYd8ekQSUZXVPCy', 'student', 'Alice', 'Johnson', '09123456789', 'omnhs', '2026-04-06 18:34:38', '2026-04-06 18:50:07'),
(11, 'bob@test.com', '$2y$10$iySogRrIqM3HigSNFmhr6.PbGT8yYeNx/NJxoLougiFVpyIeez9c6', 'student', 'Bob', 'Smith', '09123456789', 'omnhs', '2026-04-06 18:34:38', '2026-04-06 18:50:07'),
(12, 'carol@test.com', '$2y$10$.eFn5PJFDLwKFNRmeg3VGOece4pNVQVxLo7O7iKojyMjx8C/maJ1S', 'student', 'Carol', 'Davis', '09123456789', 'omnhs', '2026-04-06 18:34:38', '2026-04-06 18:50:07'),
(13, 'raizah@gmail.com', '$2y$10$tCO4dMNlmfATouGzJy1f9e7Fx1H/WIlc1mnoYjXmtBJ.fjlYzU6IS', 'student', 'raizah', 'manogsong', NULL, 'omnhs', '2026-04-06 19:21:48', '2026-04-06 19:21:48'),
(14, 'trial@gmail.com', '$2y$10$Nn4DGWHBr3z5bd44TxL7juLBchwGazu.GIhhWGAZqvOHWQRQ2Ag.C', 'counselor-and-coordinator', 'raizah', 'manongsong', NULL, 'personas', '2026-04-07 18:00:52', '2026-04-07 18:00:52'),
(15, 'SchoolDistricOffice@gmail.com', '$2y$10$aefyxsXv55BIKWO7Bka0XeFhycDhXgaWzGkQ5IWCmHf0sdhInEaea', 'sdo', 'System', 'Administrator', NULL, NULL, '2026-04-07 18:19:19', '2026-04-07 18:25:34');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int NOT NULL,
  `section_id` int NOT NULL,
  `category_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `section_id`, `category_name`) VALUES
(1, 1, 'Alcohol'),
(2, 1, 'Membership of any Gang / Fraternity / Unsolicited Group'),
(3, 1, 'Smoking'),
(4, 1, 'Drinking'),
(5, 1, 'Gambling'),
(6, 1, 'Carrying Deadly Weapon'),
(7, 2, 'Non-diagnosed'),
(8, 2, 'Depression'),
(9, 2, 'Suicide Attempt'),
(10, 2, 'Suicide Completed'),
(11, 2, 'Abused'),
(12, 3, 'Physical'),
(13, 3, 'Verbal'),
(14, 3, 'Emotional'),
(15, 4, 'Underachievement'),
(16, 5, 'Early Marriage'),
(17, 5, 'Teenage Pregnancy'),
(18, 5, 'Learning Disability'),
(19, 5, 'Transfers w/ difficulty adjusting'),
(20, 6, 'Family Problem'),
(21, 6, 'Unfavorable family set up'),
(22, 6, 'Loss of loved one'),
(23, 6, 'All forms of abuse'),
(24, 6, 'Physical'),
(25, 6, 'Verbal'),
(26, 6, 'Sexual'),
(27, 6, 'Psychological');

-- --------------------------------------------------------

--
-- Table structure for table `document_library`
--

CREATE TABLE `document_library` (
  `document_id` int NOT NULL,
  `student_id` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_type` enum('inventory','referral','follow-up','case') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `stored_filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int NOT NULL,
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'image/jpeg',
  `uploaded_by` int NOT NULL,
  `school_attended` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `access_level` enum('student','counselor','coordinator','sdo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'coordinator',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `educational_background`
--

CREATE TABLE `educational_background` (
  `EducationalBgId` int NOT NULL,
  `StudentId` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `GradeLevel` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SchoolAttended` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `InclusiveYes` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PlaceAndSchool` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `family_status`
--

CREATE TABLE `family_status` (
  `FamilyStatusID` int NOT NULL,
  `StudentId` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `LivingTogether` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MarriedYet` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MarriedChurch` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TemporarilySepered` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PermanentlySepered` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FatherWithPartner` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MotherWithPartner` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `follow_up`
--

CREATE TABLE `follow_up` (
  `Follow_id` int NOT NULL,
  `StudentID` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Status` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `CategoryID` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Title` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Counselor` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TimeCreated` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TimeUpdated` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `friends_table`
--

CREATE TABLE `friends_table` (
  `FriendID` int NOT NULL,
  `StudentId` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `In_school` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FirstName` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MiddleName` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LastName` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `grades`
--

CREATE TABLE `grades` (
  `id` int NOT NULL,
  `grade_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `grades`
--

INSERT INTO `grades` (`id`, `grade_name`) VALUES
(1, 'Grade 7'),
(2, 'Grade 8'),
(3, 'Grade 9'),
(4, 'Grade 10');

-- --------------------------------------------------------

--
-- Table structure for table `guardian`
--

CREATE TABLE `guardian` (
  `GuardianID` int NOT NULL,
  `StudentId` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `FirstName` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MiddleName` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LastName` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Address` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Landline` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MobileNumber` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Relationship` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `guardian`
--

INSERT INTO `guardian` (`GuardianID`, `StudentId`, `FirstName`, `MiddleName`, `LastName`, `Address`, `Landline`, `MobileNumber`, `Relationship`) VALUES
(1, 'STU001', 'Maria', 'Lopez', 'Dela Cruz', 'Butucan Proper', 'N/A', '09987654321', 'Mother'),
(2, 'STU002', 'Carlos', 'Mendoza', 'Garcia', 'Valencia City', 'N/A', '09335556666', 'Father');

-- --------------------------------------------------------

--
-- Table structure for table `oraganization`
--

CREATE TABLE `oraganization` (
  `OrganizationId` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `OrganizationName` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `PositionTitle` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inCampus` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `StudentId` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `parent_table`
--

CREATE TABLE `parent_table` (
  `ParentId` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `StudentId` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `FirstName` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `LastName` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MiddleName` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NickName` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `BirthDate` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PlaceOfBirth` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ContactNumber` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `HighestEducationalAttainment` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Occupation` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isDeceased` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `referral`
--

CREATE TABLE `referral` (
  `id` int NOT NULL,
  `referral_code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_id` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `grade` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `section` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` int DEFAULT NULL,
  `gender` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referral_reason` text COLLATE utf8mb4_unicode_ci,
  `description` text COLLATE utf8mb4_unicode_ci,
  `intervention_attempts` text COLLATE utf8mb4_unicode_ci,
  `observed_behaviors` text COLLATE utf8mb4_unicode_ci,
  `parent_guardian` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_contact` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `family_background` text COLLATE utf8mb4_unicode_ci,
  `teacher_id` int DEFAULT NULL,
  `teacher_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school_attended` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_school` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `urgency` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `stage` int DEFAULT '1',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `date_submitted` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `referral`
--

INSERT INTO `referral` (`id`, `referral_code`, `student_id`, `student_name`, `grade`, `section`, `age`, `gender`, `referral_reason`, `description`, `intervention_attempts`, `observed_behaviors`, `parent_guardian`, `parent_contact`, `parent_email`, `family_background`, `teacher_id`, `teacher_name`, `school_attended`, `student_school`, `urgency`, `stage`, `status`, `date_submitted`, `created_at`, `updated_at`) VALUES
(4, 'REF-F40C6114', '11156410012', 'Renier Manongsong', 'Grade 7', 'A', 12, 'Male', 'Breathing difficulty', 'utot ng utot ', '', '', 'renan santos', '09662260205', 'admin@gmail.com', '', 8, 'admin admin', 'Default School', 'Default School', 'Low', 6, 'completed', '2026-04-05 04:53:27', '2026-04-05 04:53:27', '2026-04-05 04:55:40');

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int NOT NULL,
  `category_id` int NOT NULL,
  `grade_id` int NOT NULL,
  `male_count` int DEFAULT '0',
  `female_count` int DEFAULT '0',
  `school_year` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`id`, `category_id`, `grade_id`, `male_count`, `female_count`, `school_year`, `created_at`) VALUES
(1, 1, 1, 3, 2, '2026-2027', '2026-02-14 04:23:34'),
(2, 1, 2, 5, 1, '2026-2027', '2026-02-14 04:23:34'),
(3, 1, 3, 2, 3, '2026-2027', '2026-02-14 04:23:34'),
(4, 1, 4, 4, 2, '2026-2027', '2026-02-14 04:23:34'),
(5, 3, 1, 2, 1, '2026-2027', '2026-02-14 04:23:34'),
(6, 3, 2, 4, 0, '2026-2027', '2026-02-14 04:23:34'),
(7, 3, 3, 3, 2, '2026-2027', '2026-02-14 04:23:34'),
(8, 8, 1, 1, 3, '2026-2027', '2026-02-14 04:23:34'),
(9, 8, 2, 2, 5, '2026-2027', '2026-02-14 04:23:34'),
(10, 8, 3, 1, 4, '2026-2027', '2026-02-14 04:23:34'),
(11, 8, 4, 3, 6, '2026-2027', '2026-02-14 04:23:34'),
(12, 12, 1, 4, 1, '2026-2027', '2026-02-14 04:23:34'),
(13, 12, 2, 3, 2, '2026-2027', '2026-02-14 04:23:34'),
(14, 13, 1, 2, 4, '2026-2027', '2026-02-14 04:23:34'),
(15, 13, 2, 3, 5, '2026-2027', '2026-02-14 04:23:34'),
(16, 13, 3, 1, 3, '2026-2027', '2026-02-14 04:23:34'),
(17, 15, 1, 5, 3, '2026-2027', '2026-02-14 04:23:34'),
(18, 15, 2, 6, 4, '2026-2027', '2026-02-14 04:23:34'),
(19, 15, 3, 4, 5, '2026-2027', '2026-02-14 04:23:34'),
(20, 15, 4, 7, 6, '2026-2027', '2026-02-14 04:23:34'),
(21, 17, 3, 0, 2, '2026-2027', '2026-02-14 04:23:34'),
(22, 17, 4, 0, 3, '2026-2027', '2026-02-14 04:23:34'),
(23, 20, 1, 3, 4, '2026-2027', '2026-02-14 04:23:34'),
(24, 20, 2, 2, 3, '2026-2027', '2026-02-14 04:23:34'),
(25, 20, 3, 4, 5, '2026-2027', '2026-02-14 04:23:34'),
(26, 20, 4, 3, 4, '2026-2027', '2026-02-14 04:23:34'),
(27, 24, 1, 1, 2, '2026-2027', '2026-02-14 04:23:34'),
(28, 24, 2, 2, 1, '2026-2027', '2026-02-14 04:23:34'),
(29, 24, 3, 1, 3, '2026-2027', '2026-02-14 04:23:34');

-- --------------------------------------------------------

--
-- Table structure for table `sections`
--

CREATE TABLE `sections` (
  `id` int NOT NULL,
  `section_code` varchar(5) NOT NULL,
  `section_name` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `sections`
--

INSERT INTO `sections` (`id`, `section_code`, `section_name`) VALUES
(1, 'A', 'CAR'),
(2, 'B', 'MENTAL HEALTH'),
(3, 'C', 'BULLYING'),
(4, 'D', 'POOR ACADEMIC PERFORMANCE'),
(5, 'E', 'Difficulty in Adapting to Environment'),
(6, 'F', 'Family Related');

-- --------------------------------------------------------

--
-- Table structure for table `sibling`
--

CREATE TABLE `sibling` (
  `SiblingId` int NOT NULL,
  `FirstName` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `LastName` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MiddleName` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NickName` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Age` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SchoolId` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `BirthOrder` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `StudentId` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_table`
--

CREATE TABLE `student_table` (
  `StudentId` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `LRN` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `FirstName` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `LastName` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MiddleName` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NickName` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Sex` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Age` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `DateOfBirth` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `PlaceOfBirth` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ReligionFromBirth` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CurrentReligion` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CurrentAddress` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PermanentAddress` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CellphoneNumber` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grade_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_table`
--

INSERT INTO `student_table` (`StudentId`, `LRN`, `FirstName`, `LastName`, `MiddleName`, `NickName`, `Sex`, `Age`, `DateOfBirth`, `PlaceOfBirth`, `ReligionFromBirth`, `CurrentReligion`, `CurrentAddress`, `PermanentAddress`, `CellphoneNumber`, `grade_id`) VALUES
('9', '123456789111', 'Renier ', 'Manongsong', 'T', 'rener', 'Male', '21', '2004-01-12', 'calapan', 'catholic', 'catholic', 'Lumangbayan ', 'lumangbayan', '+6396622060205', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `teacher`
--

CREATE TABLE `teacher` (
  `TeacherID` varchar(45) NOT NULL,
  `FirstName` varchar(45) DEFAULT NULL,
  `LastName` varchar(45) DEFAULT NULL,
  `MiddleName` varchar(45) DEFAULT NULL,
  `GradeLevel` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `unique_email` (`email`),
  ADD KEY `idx_email` (`email`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `section_id` (`section_id`);

--
-- Indexes for table `document_library`
--
ALTER TABLE `document_library`
  ADD PRIMARY KEY (`document_id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_document_type` (`document_type`),
  ADD KEY `idx_school` (`school_attended`),
  ADD KEY `idx_uploaded_by` (`uploaded_by`),
  ADD KEY `idx_uploaded_at` (`uploaded_at`);

--
-- Indexes for table `educational_background`
--
ALTER TABLE `educational_background`
  ADD PRIMARY KEY (`EducationalBgId`),
  ADD KEY `idx_edubg_student` (`StudentId`);

--
-- Indexes for table `family_status`
--
ALTER TABLE `family_status`
  ADD PRIMARY KEY (`FamilyStatusID`),
  ADD KEY `idx_family_student` (`StudentId`);

--
-- Indexes for table `follow_up`
--
ALTER TABLE `follow_up`
  ADD PRIMARY KEY (`Follow_id`),
  ADD KEY `StudentID` (`StudentID`);

--
-- Indexes for table `friends_table`
--
ALTER TABLE `friends_table`
  ADD PRIMARY KEY (`FriendID`),
  ADD KEY `idx_friend_student` (`StudentId`);

--
-- Indexes for table `grades`
--
ALTER TABLE `grades`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `guardian`
--
ALTER TABLE `guardian`
  ADD PRIMARY KEY (`GuardianID`),
  ADD KEY `idx_guardian_student` (`StudentId`);

--
-- Indexes for table `oraganization`
--
ALTER TABLE `oraganization`
  ADD PRIMARY KEY (`OrganizationId`),
  ADD KEY `idx_org_student` (`StudentId`);

--
-- Indexes for table `parent_table`
--
ALTER TABLE `parent_table`
  ADD PRIMARY KEY (`ParentId`),
  ADD KEY `idx_parent_student` (`StudentId`);

--
-- Indexes for table `referral`
--
ALTER TABLE `referral`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `referral_code` (`referral_code`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `teacher_id` (`teacher_id`),
  ADD KEY `school_attended` (`school_attended`),
  ADD KEY `date_submitted` (`date_submitted`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `grade_id` (`grade_id`);

--
-- Indexes for table `sections`
--
ALTER TABLE `sections`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sibling`
--
ALTER TABLE `sibling`
  ADD PRIMARY KEY (`SiblingId`),
  ADD KEY `idx_sibling_student` (`StudentId`);

--
-- Indexes for table `student_table`
--
ALTER TABLE `student_table`
  ADD PRIMARY KEY (`StudentId`),
  ADD UNIQUE KEY `idx_student_lrn` (`LRN`),
  ADD KEY `idx_student_name` (`LastName`,`FirstName`),
  ADD KEY `idx_student_grade` (`grade_id`);

--
-- Indexes for table `teacher`
--
ALTER TABLE `teacher`
  ADD PRIMARY KEY (`TeacherID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `document_library`
--
ALTER TABLE `document_library`
  MODIFY `document_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `educational_background`
--
ALTER TABLE `educational_background`
  MODIFY `EducationalBgId` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `family_status`
--
ALTER TABLE `family_status`
  MODIFY `FamilyStatusID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `follow_up`
--
ALTER TABLE `follow_up`
  MODIFY `Follow_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `friends_table`
--
ALTER TABLE `friends_table`
  MODIFY `FriendID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `grades`
--
ALTER TABLE `grades`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `guardian`
--
ALTER TABLE `guardian`
  MODIFY `GuardianID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `referral`
--
ALTER TABLE `referral`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `sections`
--
ALTER TABLE `sections`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `sibling`
--
ALTER TABLE `sibling`
  MODIFY `SiblingId` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `document_library`
--
ALTER TABLE `document_library`
  ADD CONSTRAINT `fk_doc_student` FOREIGN KEY (`student_id`) REFERENCES `student_table` (`StudentId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_doc_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `accounts` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `follow_up`
--
ALTER TABLE `follow_up`
  ADD CONSTRAINT `follow_up_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `student_table` (`StudentId`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `student_table`
--
SET FOREIGN_KEY_CHECKS=0;
ALTER TABLE `student_table`
  ADD CONSTRAINT `student_table_ibfk_1` FOREIGN KEY (`grade_id`) REFERENCES `grades` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
SET FOREIGN_KEY_CHECKS=1;

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`grade_id`) REFERENCES `grades` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
