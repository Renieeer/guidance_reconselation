-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 24, 2026 at 03:08 PM
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
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'student',
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school_attended` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `accounts`
--

INSERT INTO `accounts` (`id`, `email`, `password`, `user_type`, `first_name`, `last_name`, `school_attended`, `phone`, `created_at`, `updated_at`) VALUES
(1, 'raizahmae@gmail.com', '$2y$10$f1XuVATmY3nyVsFkjnxHWOHjq0QodDCINrx3P4uoW216FsnJmw6lG', 'student', 'Raizah Mae', 'Lupig', 'Butucan National High School', '096622060205', '2026-03-01 13:21:27', '2026-03-01 13:21:27'),
(2, 'coordinator@gmail.com', '$2y$10$iswxQqTJaugwQOxCgiNJAeudR2to4QOI/ztSpnQjLn.QCn4ANaOJy', 'coordinator', 'Maam', 'Donna', 'Butucan National High School', '12345678911', '2026-03-01 13:38:11', '2026-03-01 13:39:28'),
(3, 'counsilor@gmail.com', '$2y$10$27Y7yJIetnT/LtAMeIKwz.ZK9kuJmDbPrLdxMw5nddVxNkEEGbdTC', 'counselor', 'counselor', 'consi', 'Butucan National High School', '12345678910', '2026-03-01 13:39:15', '2026-03-01 13:39:15');

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

--
-- Dumping data for table `educational_background`
--

INSERT INTO `educational_background` (`EducationalBgId`, `StudentId`, `GradeLevel`, `SchoolAttended`, `InclusiveYes`, `PlaceAndSchool`) VALUES
(1, 'STU001', 'Grade 8', 'Butucan National High School', 'No', 'Butucan NHS'),
(2, 'STU002', 'Grade 9', 'Valencia National High School', 'Yes', 'Valencia NHS');

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
  `FatherDie` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MotherDie` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FatherWithPartner` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MotherWithPartner` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `family_status`
--

INSERT INTO `family_status` (`FamilyStatusID`, `StudentId`, `LivingTogether`, `MarriedYet`, `MarriedChurch`, `TemporarilySepered`, `PermanentlySepered`, `FatherDie`, `MotherDie`, `FatherWithPartner`, `MotherWithPartner`) VALUES
(1, '23414', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, '2341', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, '2341', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, '2341', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 'STU001', 'Yes', 'Yes', 'Yes', 'No', 'No', 'No', 'No', 'No', 'No'),
(6, 'STU002', 'No', 'Yes', 'No', 'Yes', 'No', 'No', 'No', 'Yes', 'No');

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

--
-- Dumping data for table `follow_up`
--

INSERT INTO `follow_up` (`Follow_id`, `StudentID`, `Status`, `CategoryID`, `Title`, `Counselor`, `TimeCreated`, `TimeUpdated`) VALUES
(1, 'STU002', 'Pending', '', 'Counseling ', 'maam donna', '2026-02-21 23:26:28', '2026-02-21 23:26:28'),
(2, 'STU001', 'Pending', '1', 'CAR (Children at Risk) - Alcohol', 'maam donna', '2026-02-21 23:37:14', '2026-02-21 23:37:14');

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

--
-- Dumping data for table `friends_table`
--

INSERT INTO `friends_table` (`FriendID`, `StudentId`, `In_school`, `FirstName`, `MiddleName`, `LastName`) VALUES
(1, 'STU001', 'Yes', 'Mark', 'Lee', 'Reyes'),
(2, 'STU002', 'Yes', 'Angela', 'Marie', 'Santos');

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

--
-- Dumping data for table `oraganization`
--

INSERT INTO `oraganization` (`OrganizationId`, `OrganizationName`, `PositionTitle`, `inCampus`, `StudentId`) VALUES
('ORG001', 'Supreme Student Government', 'Member', 'Yes', 'STU001'),
('ORG002', 'Science Club', 'Secretary', 'Yes', 'STU002');

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

--
-- Dumping data for table `parent_table`
--

INSERT INTO `parent_table` (`ParentId`, `StudentId`, `FirstName`, `LastName`, `MiddleName`, `NickName`, `BirthDate`, `PlaceOfBirth`, `Address`, `ContactNumber`, `HighestEducationalAttainment`, `Occupation`, `isDeceased`) VALUES
('PAR001', 'STU001', 'Jose', 'Dela Cruz', 'Ramos', 'Joe', '1980-03-15', 'Bukidnon', 'Butucan Proper', '09111111111', 'College Graduate', 'Farmer', 'No'),
('PAR002', 'STU002', 'Elena', 'Garcia', 'Mendoza', 'Len', '1982-11-25', 'Cagayan de Oro', 'Valencia City', '09444444444', 'High School Graduate', 'Vendor', 'No');

-- --------------------------------------------------------

--
-- Table structure for table `referral`
--

CREATE TABLE `referral` (
  `id` int NOT NULL AUTO_INCREMENT,
  `referral_code` varchar(100) UNIQUE NOT NULL,
  `student_id` varchar(45) DEFAULT NULL,
  `student_name` varchar(255) NOT NULL,
  `grade` varchar(45) DEFAULT NULL,
  `section` varchar(45) DEFAULT NULL,
  `age` int DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `referral_reason` text,
  `description` text,
  `intervention_attempts` text,
  `observed_behaviors` text,
  `parent_guardian` varchar(255) DEFAULT NULL,
  `parent_contact` varchar(20) DEFAULT NULL,
  `parent_email` varchar(100) DEFAULT NULL,
  `family_background` text,
  `teacher_id` int DEFAULT NULL,
  `teacher_name` varchar(255) DEFAULT NULL,
  `school_attended` varchar(255) NOT NULL,
  `student_school` varchar(255) NOT NULL,
  `urgency` varchar(20) DEFAULT 'normal',
  `stage` int DEFAULT 1,
  `status` varchar(20) DEFAULT 'pending',
  `date_submitted` timestamp DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `school_attended` (`school_attended`),
  KEY `date_submitted` (`date_submitted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

--
-- Dumping data for table `sibling`
--

INSERT INTO `sibling` (`SiblingId`, `FirstName`, `LastName`, `MiddleName`, `NickName`, `Age`, `SchoolId`, `BirthOrder`, `StudentId`) VALUES
(1, 'Anna', 'Dela Cruz', 'Santos', 'Ann', '10', 'Elementary School', '2nd', 'STU001'),
(2, 'Joshua', 'Garcia', 'Mendoza', 'Josh', '12', 'Junior High', '1st', 'STU002');

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
  `CellphoneNumber` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_table`
--

INSERT INTO `student_table` (`StudentId`, `LRN`, `FirstName`, `LastName`, `MiddleName`, `NickName`, `Sex`, `Age`, `DateOfBirth`, `PlaceOfBirth`, `ReligionFromBirth`, `CurrentReligion`, `CurrentAddress`, `PermanentAddress`, `CellphoneNumber`) VALUES
('STU001', '202600000001', 'John', 'Dela Cruz', 'Santos', 'Johnny', 'Male', '14', '2011-05-12', 'Butucan', 'Catholic', 'Catholic', 'Butucan Proper', 'Butucan Proper', '09123456789'),
('STU002', '202600000002', 'Maria', 'Lopez', 'Garcia', 'Mia', 'Female', '15', '2010-08-20', 'Valencia City', 'Catholic', 'Catholic', 'Valencia City', 'Valencia City', '09223334444');

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
  ADD KEY `idx_email` (`email`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `section_id` (`section_id`);

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
  ADD KEY `idx_student_name` (`LastName`,`FirstName`);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

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
-- AUTO_INCREMENT for table `referral`
--
ALTER TABLE `referral`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

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
-- Constraints for table `follow_up`
--
ALTER TABLE `follow_up`
  ADD CONSTRAINT `follow_up_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `student_table` (`StudentId`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `referral`
--
ALTER TABLE `referral`
  ADD CONSTRAINT `referral_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teacher` (`TeacherID`);

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
