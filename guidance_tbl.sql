-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 24, 2026 at 04:12 AM
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
-- Table structure for table `appointment`
--

CREATE TABLE `appointment` (
  `Appointment_ID` int NOT NULL,
  `Counseling_ID` int DEFAULT NULL,
  `Notes` varchar(45) DEFAULT NULL,
  `Dates` varchar(45) DEFAULT NULL,
  `Status` varchar(45) DEFAULT NULL,
  `Student_Involvement_ID` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `case_category`
--

CREATE TABLE `case_category` (
  `CaseId` varchar(45) NOT NULL,
  `SectionID` int DEFAULT NULL,
  `CategoryName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `case_category`
--

INSERT INTO `case_category` (`CaseId`, `SectionID`, `CategoryName`) VALUES
('1', 1, 'Alcohol'),
('10', 2, 'Suicide Completed'),
('11', 2, 'Abused'),
('12', 3, 'Physical'),
('13', 3, 'Verbal'),
('14', 3, 'Emotional'),
('15', 4, 'Underachievement'),
('16', 5, 'Early Marriage'),
('17', 5, 'Teenage Pregnancy'),
('18', 5, 'Learning Disability'),
('19', 5, 'Transfers w/ difficulty adjusting'),
('2', 1, 'Membership of any Gang / Fraternity / Unsolicited Group'),
('20', 6, 'Family Problem'),
('21', 6, 'Unfavorable family set up'),
('22', 6, 'Loss of loved one'),
('23', 6, 'All forms of abuse'),
('24', 6, 'Physical'),
('25', 6, 'Verbal'),
('26', 6, 'Sexual'),
('27', 6, 'Psychological'),
('3', 1, 'Smoking'),
('4', 1, 'Drinking'),
('5', 1, 'Gambling'),
('6', 1, 'Carrying Deadly Weapon'),
('7', 2, 'Non-diagnosed'),
('8', 2, 'Depression'),
('9', 2, 'Suicide Attempt');

-- --------------------------------------------------------

--
-- Table structure for table `case_table`
--

CREATE TABLE `case_table` (
  `Case_table_Id` int NOT NULL,
  `CaseId` varchar(45) DEFAULT NULL,
  `GradeId` varchar(45) DEFAULT NULL,
  `Schoolyear` varchar(45) DEFAULT NULL,
  `CreatedAt` varchar(45) DEFAULT NULL,
  `CaseReport` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `case_type`
--

CREATE TABLE `case_type` (
  `CaseTypeID` int NOT NULL,
  `Appointment` int DEFAULT NULL,
  `Referral` int DEFAULT NULL,
  `Follow_up` int DEFAULT NULL,
  `counseling` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `counseling_table`
--

CREATE TABLE `counseling_table` (
  `Counseling_Id` int NOT NULL,
  `Feedback` varchar(80) DEFAULT NULL,
  `Status` varchar(45) DEFAULT NULL,
  `Counseling_Tablecol` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `document_library`
--

CREATE TABLE `document_library` (
  `document_id` int NOT NULL,
  `Document_type` varchar(45) DEFAULT NULL,
  `School_attended` varchar(45) DEFAULT NULL,
  `Teacher` varchar(45) DEFAULT NULL,
  `counselor_coordinator` int DEFAULT NULL,
  `Case_Type` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `educational_background`
--

CREATE TABLE `educational_background` (
  `EducationalBgId` int NOT NULL,
  `GradeLevel` varchar(45) DEFAULT NULL,
  `SchoolAttended` varchar(45) DEFAULT NULL,
  `InclusiveYear` varchar(45) DEFAULT NULL,
  `PlanAfterSchool` varchar(45) DEFAULT NULL,
  `PlanCourseInCollege` varchar(45) DEFAULT NULL,
  `FavoriteSubject` varchar(45) DEFAULT NULL,
  `DifficultSub` varchar(45) DEFAULT NULL,
  `AcademicTrackToTake` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `follow_up`
--

CREATE TABLE `follow_up` (
  `Follow_id` int NOT NULL,
  `Status` varchar(45) DEFAULT NULL,
  `Title` varchar(45) DEFAULT NULL,
  `Counselor` varchar(45) DEFAULT NULL,
  `TimeCreated` varchar(45) DEFAULT NULL,
  `TimeUpdated` varchar(45) DEFAULT NULL,
  `Case_table_Id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `friends_table`
--

CREATE TABLE `friends_table` (
  `FriendID` int NOT NULL,
  `StudentId` varchar(45) DEFAULT NULL,
  `In_school` varchar(45) DEFAULT NULL,
  `FirstName` varchar(45) DEFAULT NULL,
  `MiddleName` varchar(45) DEFAULT NULL,
  `LastName` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `guardian`
--

CREATE TABLE `guardian` (
  `GuardianID` int NOT NULL,
  `StudentId` varchar(45) DEFAULT NULL,
  `FirstName` varchar(45) DEFAULT NULL,
  `MiddleName` varchar(45) DEFAULT NULL,
  `LastName` varchar(45) DEFAULT NULL,
  `Address` varchar(45) DEFAULT NULL,
  `Landline` varchar(45) DEFAULT NULL,
  `MobileNumber` varchar(45) DEFAULT NULL,
  `Relationship` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `family_status`
--

CREATE TABLE `family_status` (
  `FamilyStatusId` int NOT NULL,
  `StudentId` varchar(45) DEFAULT NULL,
  `LivingTogether` varchar(45) DEFAULT NULL,
  `MarriedYet` varchar(45) DEFAULT NULL,
  `MarriedChurch` varchar(45) DEFAULT NULL,
  `TemporarilySepered` varchar(45) DEFAULT NULL,
  `PermanentlySepered` varchar(45) DEFAULT NULL,
  `FatherWithPartner` varchar(45) DEFAULT NULL,
  `MotherWithPartner` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `online_appointment`
--

CREATE TABLE `online_appointment` (
  `AppointmentID` int NOT NULL,
  `StudentId` varchar(45) DEFAULT NULL,
  `Reason` varchar(45) DEFAULT NULL,
  `Date_Created` varchar(45) DEFAULT NULL,
  `Case_Table` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `organization`
--

CREATE TABLE `organization` (
  `OrganizationId` varchar(45) NOT NULL,
  `OrganizationName` varchar(45) DEFAULT NULL,
  `PositionTitle` varchar(45) DEFAULT NULL,
  `IsCampus` varchar(45) DEFAULT NULL,
  `StudentId` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `parent_table`
--

CREATE TABLE `parent_table` (
  `ParentId` varchar(45) NOT NULL,
  `StudentId` varchar(45) DEFAULT NULL,
  `FirstName` varchar(45) DEFAULT NULL,
  `LastName` varchar(45) DEFAULT NULL,
  `MiddleName` varchar(45) DEFAULT NULL,
  `NickName` varchar(45) DEFAULT NULL,
  `BirthDate` varchar(45) DEFAULT NULL,
  `PlaceOfBirth` varchar(45) DEFAULT NULL,
  `Address` varchar(45) DEFAULT NULL,
  `ContactNumber` varchar(45) DEFAULT NULL,
  `HighestEducationAttained` varchar(45) DEFAULT NULL,
  `Occupation` varchar(45) DEFAULT NULL,
  `IsDeceased` varchar(45) DEFAULT NULL,
  `MonthlyIncome` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `referral`
--

CREATE TABLE `referral` (
  `ReferralID` int NOT NULL,
  `StudentID` varchar(45) DEFAULT NULL,
  `Grade` varchar(45) DEFAULT NULL,
  `Schedule` varchar(45) DEFAULT NULL,
  `Reason` text,
  `TeacherID` varchar(45) DEFAULT NULL,
  `case_table` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `section`
--

CREATE TABLE `section` (
  `SectionID` int NOT NULL,
  `SectionCode` varchar(45) DEFAULT NULL,
  `SectionName` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `section`
--

INSERT INTO `section` (`SectionID`, `SectionCode`, `SectionName`) VALUES
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
  `FirstName` varchar(45) DEFAULT NULL,
  `LastName` varchar(45) DEFAULT NULL,
  `MiddleName` varchar(45) DEFAULT NULL,
  `NickName` varchar(45) DEFAULT NULL,
  `Age` varchar(45) DEFAULT NULL,
  `IsSchool` varchar(45) DEFAULT NULL,
  `BirthOrder` varchar(45) DEFAULT NULL,
  `StudentId` varchar(45) DEFAULT NULL,
  `Work` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_involvement`
--

CREATE TABLE `student_involvement` (
  `InvolvedID` int NOT NULL,
  `StudentID` varchar(45) DEFAULT NULL,
  `Case_Type` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_table`
--

CREATE TABLE `student_table` (
  `StudentId` varchar(45) NOT NULL,
  `LRN` varchar(45) DEFAULT NULL,
  `FirstName` varchar(45) DEFAULT NULL,
  `LastName` varchar(45) DEFAULT NULL,
  `MiddleName` varchar(45) DEFAULT NULL,
  `Nickname` varchar(45) DEFAULT NULL,
  `Sex` varchar(45) DEFAULT NULL,
  `Age` varchar(45) DEFAULT NULL,
  `DateOfBirth` varchar(45) DEFAULT NULL,
  `PlaceOfBirth` varchar(45) DEFAULT NULL,
  `ReligionFromBirth` varchar(45) DEFAULT NULL,
  `CurrentReligion` varchar(45) DEFAULT NULL,
  `CurrentAddress` varchar(255) DEFAULT NULL,
  `CurrentAddressData` longtext DEFAULT NULL,
  `CurrentAddressRegionCode` varchar(20) DEFAULT NULL,
  `CurrentAddressRegionName` varchar(255) DEFAULT NULL,
  `CurrentAddressProvinceCode` varchar(20) DEFAULT NULL,
  `CurrentAddressProvinceName` varchar(255) DEFAULT NULL,
  `CurrentAddressCityCode` varchar(20) DEFAULT NULL,
  `CurrentAddressCityName` varchar(255) DEFAULT NULL,
  `CurrentAddressBarangayCode` varchar(20) DEFAULT NULL,
  `CurrentAddressBarangayName` varchar(255) DEFAULT NULL,
  `PermanentAddress` varchar(255) DEFAULT NULL,
  `PermanentAddressData` longtext DEFAULT NULL,
  `PermanentAddressRegionCode` varchar(20) DEFAULT NULL,
  `PermanentAddressRegionName` varchar(255) DEFAULT NULL,
  `PermanentAddressProvinceCode` varchar(20) DEFAULT NULL,
  `PermanentAddressProvinceName` varchar(255) DEFAULT NULL,
  `PermanentAddressCityCode` varchar(20) DEFAULT NULL,
  `PermanentAddressCityName` varchar(255) DEFAULT NULL,
  `PermanentAddressBarangayCode` varchar(20) DEFAULT NULL,
  `PermanentAddressBarangayName` varchar(255) DEFAULT NULL,
  `CellphoneNumber` varchar(45) DEFAULT NULL,
  `Grade` varchar(45) DEFAULT NULL,
  `AccountID` int DEFAULT NULL,
  `EmailAccount` varchar(45) DEFAULT NULL,
  `Section` varchar(45) DEFAULT NULL,
  `EducationalBackground_EducationalBgId` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `address_regions`
--

CREATE TABLE `address_regions` (
  `code` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `region_name` varchar(255) DEFAULT NULL,
  `island_group_code` varchar(30) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`code`),
  KEY `idx_address_regions_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `address_provinces`
--

CREATE TABLE `address_provinces` (
  `code` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `region_code` varchar(20) DEFAULT NULL,
  `island_group_code` varchar(30) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`code`),
  KEY `idx_address_provinces_region` (`region_code`),
  KEY `idx_address_provinces_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `address_cities`
--

CREATE TABLE `address_cities` (
  `code` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `old_name` varchar(255) DEFAULT NULL,
  `is_capital` tinyint(1) DEFAULT NULL,
  `is_city` tinyint(1) DEFAULT NULL,
  `is_municipality` tinyint(1) DEFAULT NULL,
  `district_code` varchar(20) DEFAULT NULL,
  `province_code` varchar(20) DEFAULT NULL,
  `region_code` varchar(20) DEFAULT NULL,
  `island_group_code` varchar(30) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`code`),
  KEY `idx_address_cities_province` (`province_code`),
  KEY `idx_address_cities_region` (`region_code`),
  KEY `idx_address_cities_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `address_barangays`
--

CREATE TABLE `address_barangays` (
  `code` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `old_name` varchar(255) DEFAULT NULL,
  `sub_municipality_code` varchar(20) DEFAULT NULL,
  `city_code` varchar(20) DEFAULT NULL,
  `municipality_code` varchar(20) DEFAULT NULL,
  `district_code` varchar(20) DEFAULT NULL,
  `province_code` varchar(20) DEFAULT NULL,
  `region_code` varchar(20) DEFAULT NULL,
  `island_group_code` varchar(30) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`code`),
  KEY `idx_address_barangays_city` (`city_code`),
  KEY `idx_address_barangays_municipality` (`municipality_code`),
  KEY `idx_address_barangays_province` (`province_code`),
  KEY `idx_address_barangays_region` (`region_code`),
  KEY `idx_address_barangays_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `schools`
--

CREATE TABLE `schools` (
  `school_code` varchar(120) NOT NULL,
  `school_name` varchar(255) NOT NULL,
  `assignment_type` enum('coordinator','counselor','both') NOT NULL DEFAULT 'both',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`school_code`),
  UNIQUE KEY `unique_school_name` (`school_name`),
  KEY `idx_school_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `schools`
--

INSERT INTO `schools` (`school_code`, `school_name`, `assignment_type`, `is_active`) VALUES
('personas', 'Personas National High School', 'both', 1),
('community-vocational', 'Community Vocational High Schools', 'both', 1),
('oriental-mindoro', 'Oriental Mindoro National High School', 'both', 1),
('ceriaco-abes', 'Ceriaco A. Abes Memorial National High School', 'both', 1),
('nag-iba', 'Nag-iba National High School', 'both', 1),
('pedro-panaligan', 'Pedro V Panaligan National High School', 'both', 1),
('parang', 'Parang National High School', 'both', 1),
('managpi', 'Managpi National High School', 'both', 1),
('buvayao', 'Buvayao National High School', 'both', 1),
('canubing', 'Canubing National High School', 'both', 1);

-- --------------------------------------------------------

--
-- Table structure for table `users_tables`
--

CREATE TABLE `users_tables` (
  `AccountID` int NOT NULL AUTO_INCREMENT,
  `Password` varchar(255) NOT NULL,
  `Grade` varchar(45) DEFAULT NULL,
  `First_name` varchar(45) NOT NULL,
  `Middle_name` varchar(45) DEFAULT NULL,
  `Last_name` varchar(45) NOT NULL,
  `Type` varchar(45) NOT NULL,
  `email` varchar(255) UNIQUE NOT NULL,
  `school_attended` varchar(100) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`AccountID`),
  UNIQUE KEY `unique_email` (`email`),
  INDEX `idx_email` (`email`),
  INDEX `idx_school` (`school_attended`),
  INDEX `idx_type` (`Type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointment`
--
ALTER TABLE `appointment`
  ADD PRIMARY KEY (`Appointment_ID`),
  ADD KEY `Student_Involvement_ID` (`Student_Involvement_ID`);

--
-- Indexes for table `case_category`
--
ALTER TABLE `case_category`
  ADD PRIMARY KEY (`CaseId`),
  ADD KEY `SectionID` (`SectionID`);

--
-- Indexes for table `case_table`
--
ALTER TABLE `case_table`
  ADD PRIMARY KEY (`Case_table_Id`);

--
-- Indexes for table `case_type`
--
ALTER TABLE `case_type`
  ADD PRIMARY KEY (`CaseTypeID`);

--
-- Indexes for table `counseling_table`
--
ALTER TABLE `counseling_table`
  ADD PRIMARY KEY (`Counseling_Id`);

--
-- Indexes for table `document_library`
--
ALTER TABLE `document_library`
  ADD PRIMARY KEY (`document_id`);

--
-- Indexes for table `educational_background`
--
ALTER TABLE `educational_background`
  ADD PRIMARY KEY (`EducationalBgId`);

--
-- Indexes for table `follow_up`
--
ALTER TABLE `follow_up`
  ADD PRIMARY KEY (`Follow_id`),
  ADD KEY `Case_table_Id` (`Case_table_Id`);

--
-- Indexes for table `friends_table`
--
ALTER TABLE `friends_table`
  ADD PRIMARY KEY (`FriendID`),
  ADD KEY `StudentId` (`StudentId`);

--
-- Indexes for table `guardian`
--
ALTER TABLE `guardian`
  ADD PRIMARY KEY (`GuardianID`),
  ADD KEY `StudentId` (`StudentId`);

--
-- Indexes for table `online_appointment`
--
ALTER TABLE `online_appointment`
  ADD PRIMARY KEY (`AppointmentID`),
  ADD KEY `StudentId` (`StudentId`);

--
-- Indexes for table `organization`
--
ALTER TABLE `organization`
  ADD PRIMARY KEY (`OrganizationId`),
  ADD KEY `StudentId` (`StudentId`);

--
-- Indexes for table `parent_table`
--
ALTER TABLE `parent_table`
  ADD PRIMARY KEY (`ParentId`),
  ADD KEY `StudentId` (`StudentId`);

--
-- Indexes for table `referral`
--
ALTER TABLE `referral`
  ADD PRIMARY KEY (`ReferralID`),
  ADD KEY `StudentID` (`StudentID`),
  ADD KEY `case_table` (`case_table`);

--
-- Indexes for table `section`
--
ALTER TABLE `section`
  ADD PRIMARY KEY (`SectionID`);

--
-- Indexes for table `sibling`
--
ALTER TABLE `sibling`
  ADD PRIMARY KEY (`SiblingId`),
  ADD KEY `StudentId` (`StudentId`);

--
-- Indexes for table `student_involvement`
--
ALTER TABLE `student_involvement`
  ADD PRIMARY KEY (`InvolvedID`),
  ADD KEY `StudentID` (`StudentID`);

--
-- Indexes for table `student_table`
--
ALTER TABLE `student_table`
  ADD PRIMARY KEY (`StudentId`),
  ADD KEY `AccountID` (`AccountID`);

--
-- Indexes for table `users_tables`
-- (PRIMARY KEY already defined in CREATE TABLE statement)
--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointment`
--
ALTER TABLE `appointment`
  MODIFY `Appointment_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `case_table`
--
ALTER TABLE `case_table`
  MODIFY `Case_table_Id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `case_type`
--
ALTER TABLE `case_type`
  MODIFY `CaseTypeID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `counseling_table`
--
ALTER TABLE `counseling_table`
  MODIFY `Counseling_Id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `document_library`
--
ALTER TABLE `document_library`
  MODIFY `document_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `educational_background`
--
ALTER TABLE `educational_background`
  MODIFY `EducationalBgId` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `follow_up`
--
ALTER TABLE `follow_up`
  MODIFY `Follow_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `friends_table`
--
ALTER TABLE `friends_table`
  MODIFY `FriendID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `guardian`
--
ALTER TABLE `guardian`
  MODIFY `GuardianID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `online_appointment`
--
ALTER TABLE `online_appointment`
  MODIFY `AppointmentID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `referral`
--
ALTER TABLE `referral`
  MODIFY `ReferralID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sibling`
--
ALTER TABLE `sibling`
  MODIFY `SiblingId` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `student_involvement`
--
ALTER TABLE `student_involvement`
  MODIFY `InvolvedID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users_tables`
--
ALTER TABLE `users_tables`
  MODIFY `AccountID` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointment`
--
ALTER TABLE `appointment`
  ADD CONSTRAINT `appointment_ibfk_1` FOREIGN KEY (`Student_Involvement_ID`) REFERENCES `student_involvement` (`InvolvedID`);

--
-- Constraints for table `case_category`
--
ALTER TABLE `case_category`
  ADD CONSTRAINT `case_category_ibfk_1` FOREIGN KEY (`SectionID`) REFERENCES `section` (`SectionID`);

--
-- Constraints for table `follow_up`
--
ALTER TABLE `follow_up`
  ADD CONSTRAINT `follow_up_ibfk_1` FOREIGN KEY (`Case_table_Id`) REFERENCES `case_table` (`Case_table_Id`);

--
-- Constraints for table `friends_table`
--
ALTER TABLE `friends_table`
  ADD CONSTRAINT `friends_table_ibfk_1` FOREIGN KEY (`StudentId`) REFERENCES `student_table` (`StudentId`);

--
-- Constraints for table `guardian`
--
ALTER TABLE `guardian`
  ADD CONSTRAINT `guardian_ibfk_1` FOREIGN KEY (`StudentId`) REFERENCES `student_table` (`StudentId`);

--
-- Constraints for table `online_appointment`
--
ALTER TABLE `online_appointment`
  ADD CONSTRAINT `online_appointment_ibfk_1` FOREIGN KEY (`StudentId`) REFERENCES `student_table` (`StudentId`);

--
-- Constraints for table `organization`
--
ALTER TABLE `organization`
  ADD CONSTRAINT `organization_ibfk_1` FOREIGN KEY (`StudentId`) REFERENCES `student_table` (`StudentId`);

--
-- Constraints for table `parent_table`
--
ALTER TABLE `parent_table`
  ADD CONSTRAINT `parent_table_ibfk_1` FOREIGN KEY (`StudentId`) REFERENCES `student_table` (`StudentId`);

--
-- Constraints for table `referral`
--
ALTER TABLE `referral`
  ADD CONSTRAINT `referral_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `student_table` (`StudentId`),
  ADD CONSTRAINT `referral_ibfk_2` FOREIGN KEY (`case_table`) REFERENCES `case_table` (`Case_table_Id`);

--
-- Constraints for table `sibling`
--
ALTER TABLE `sibling`
  ADD CONSTRAINT `sibling_ibfk_1` FOREIGN KEY (`StudentId`) REFERENCES `student_table` (`StudentId`);

--
-- Constraints for table `student_involvement`
--
ALTER TABLE `student_involvement`
  ADD CONSTRAINT `student_involvement_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `student_table` (`StudentId`);

--
-- Constraints for table `student_table`
--
ALTER TABLE `student_table`
  ADD CONSTRAINT `student_table_ibfk_1` FOREIGN KEY (`AccountID`) REFERENCES `users_tables` (`AccountID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
