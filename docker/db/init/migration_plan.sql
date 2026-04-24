SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `migration_plan`
--

-- --------------------------------------------------------
-- Table structure for table `attachments`
-- --------------------------------------------------------
CREATE TABLE `attachments` (
  `attachment_id` int(11) NOT NULL AUTO_INCREMENT,
  `ref_type` varchar(50) DEFAULT NULL,
  `ref_id` int(11) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `file_type` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `uploaded_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`attachment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `departments`
-- --------------------------------------------------------
CREATE TABLE `departments` (
  `department_id` int(11) NOT NULL AUTO_INCREMENT,
  `department_name` varchar(255) NOT NULL,
  PRIMARY KEY (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `status`
-- --------------------------------------------------------
CREATE TABLE `status` (
  `status_id` int(11) NOT NULL AUTO_INCREMENT,
  `status_code` varchar(50) NOT NULL,
  `status_label` varchar(100) DEFAULT NULL,
  `is_success` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`status_id`),
  UNIQUE KEY `status_code` (`status_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `status` (`status_id`, `status_code`, `status_label`, `is_success`) VALUES
(1, 'processing_gap', 'กำลังดำเนินการ', 0),
(2, 'complete_gap', 'ดำเนินการเสร็จสิ้น', 1),
(3, 'acceptable_gap', 'ไม่สามารถปิด GAP แต่ยอมรับได้', 1);

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `role` enum('admin','coordinator','user','viewer') DEFAULT 'user',
  `department_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `scopes`
-- --------------------------------------------------------
CREATE TABLE `scopes` (
  `scope_id` int(11) NOT NULL AUTO_INCREMENT,
  `scope_name` varchar(255) NOT NULL,
  `department_id` int(11) NOT NULL,
  `coordinator_id` int(11) DEFAULT NULL,
  `status_id` int(11) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `progress_percent` decimal(5,2) DEFAULT 0.00,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`scope_id`),
  KEY `department_id` (`department_id`),
  KEY `coordinator_id` (`coordinator_id`),
  KEY `status_id` (`status_id`),
  CONSTRAINT `scopes_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`),
  CONSTRAINT `scopes_ibfk_2` FOREIGN KEY (`coordinator_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `scopes_ibfk_3` FOREIGN KEY (`status_id`) REFERENCES `status` (`status_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `project_plans`
-- --------------------------------------------------------
CREATE TABLE `project_plans` (
  `project_plan_id` int(11) NOT NULL AUTO_INCREMENT,
  `scope_id` int(11) NOT NULL,
  `project_plan_name` varchar(255) NOT NULL,
  `status_id` int(11) NOT NULL,
  `progress_percent` float(5,2) DEFAULT 0.00,
  `details` text DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`project_plan_id`),
  KEY `scope_id` (`scope_id`),
  KEY `status_id` (`status_id`),
  CONSTRAINT `project_plans_ibfk_1` FOREIGN KEY (`scope_id`) REFERENCES `scopes` (`scope_id`),
  CONSTRAINT `project_plans_ibfk_2` FOREIGN KEY (`status_id`) REFERENCES `status` (`status_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `operational_details`
-- --------------------------------------------------------
CREATE TABLE `operational_details` (
  `operation_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_plan_id` int(11) NOT NULL,
  `detail` text DEFAULT NULL,
  `weight_percent` decimal(5,2) NOT NULL,
  `progress_percent` decimal(5,2) DEFAULT 0.00,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`operation_id`),
  KEY `project_plan_id` (`project_plan_id`),
  KEY `status_id` (`status_id`),
  CONSTRAINT `operational_details_ibfk_1` FOREIGN KEY (`project_plan_id`) REFERENCES `project_plans` (`project_plan_id`) ON DELETE CASCADE,
  CONSTRAINT `operational_details_ibfk_2` FOREIGN KEY (`status_id`) REFERENCES `status` (`status_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `plan_evaluations`
-- --------------------------------------------------------
CREATE TABLE `plan_evaluations` (
  `evaluation_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_plan_id` int(11) DEFAULT NULL,
  `scope_id` int(11) NOT NULL,
  `objective` text DEFAULT NULL,
  `before_plan` text DEFAULT NULL,
  `expected_outcome` text DEFAULT NULL,
  `actual_outcome` text DEFAULT NULL,
  `recommendation` text DEFAULT NULL,
  `project_status` enum('processing','finish') DEFAULT NULL,
  `evaluation_status` enum('pass','fail') DEFAULT NULL,
  PRIMARY KEY (`evaluation_id`),
  KEY `scope_id` (`scope_id`),
  KEY `fk_eval_project` (`project_plan_id`),
  CONSTRAINT `fk_eval_project` FOREIGN KEY (`project_plan_id`) REFERENCES `project_plans` (`project_plan_id`) ON DELETE CASCADE,
  CONSTRAINT `plan_evaluations_ibfk_1` FOREIGN KEY (`scope_id`) REFERENCES `scopes` (`scope_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `change_logs`
-- --------------------------------------------------------
CREATE TABLE `change_logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `scope_id` int(11) DEFAULT NULL,
  `project_plan_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `change_type` enum('scope','project_plan','operation','evaluation','profile') DEFAULT NULL,
  `change_date` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`),
  KEY `user_id` (`user_id`),
  KEY `scope_id` (`scope_id`),
  KEY `project_plan_id` (`project_plan_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `change_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `change_logs_ibfk_2` FOREIGN KEY (`scope_id`) REFERENCES `scopes` (`scope_id`),
  CONSTRAINT `change_logs_ibfk_3` FOREIGN KEY (`project_plan_id`) REFERENCES `project_plans` (`project_plan_id`),
  CONSTRAINT `change_logs_ibfk_4` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `change_log_details`
-- --------------------------------------------------------
CREATE TABLE `change_log_details` (
  `detail_id` int(11) NOT NULL AUTO_INCREMENT,
  `log_id` int(11) NOT NULL,
  `field_name` varchar(100) DEFAULT NULL,
  `before_value` text DEFAULT NULL,
  `after_value` text DEFAULT NULL,
  PRIMARY KEY (`detail_id`),
  KEY `log_id` (`log_id`),
  CONSTRAINT `change_log_details_ibfk_1` FOREIGN KEY (`log_id`) REFERENCES `change_logs` (`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `edit_reasons`
-- --------------------------------------------------------
CREATE TABLE `edit_reasons` (
  `reason_id` int(11) NOT NULL AUTO_INCREMENT,
  `ref_type` varchar(50) DEFAULT NULL,
  `ref_id` int(11) DEFAULT NULL,
  `reason_text` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`reason_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `problems`
-- --------------------------------------------------------
CREATE TABLE `problems` (
  `problem_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_plan_id` int(11) NOT NULL,
  `problem_detail` text DEFAULT NULL,
  PRIMARY KEY (`problem_id`),
  KEY `project_plan_id` (`project_plan_id`),
  CONSTRAINT `problems_ibfk_1` FOREIGN KEY (`project_plan_id`) REFERENCES `project_plans` (`project_plan_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `solutions`
-- --------------------------------------------------------
CREATE TABLE `solutions` (
  `solution_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_plan_id` int(11) NOT NULL,
  `solution_detail` text DEFAULT NULL,
  PRIMARY KEY (`solution_id`),
  KEY `project_plan_id` (`project_plan_id`),
  CONSTRAINT `solutions_ibfk_1` FOREIGN KEY (`project_plan_id`) REFERENCES `project_plans` (`project_plan_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `working_groups`
-- --------------------------------------------------------
CREATE TABLE `working_groups` (
  `working_group_id` int(11) NOT NULL AUTO_INCREMENT,
  `scope_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`working_group_id`),
  KEY `scope_id` (`scope_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `working_groups_ibfk_1` FOREIGN KEY (`scope_id`) REFERENCES `scopes` (`scope_id`),
  CONSTRAINT `working_groups_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;