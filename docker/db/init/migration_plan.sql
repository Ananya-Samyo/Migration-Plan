-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 01, 2026 at 05:16 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

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

--
-- Table structure for table `attachments`
--

CREATE TABLE `attachments` (
  `attachment_id` int(11) NOT NULL,
  `ref_type` varchar(50) DEFAULT NULL,
  `ref_id` int(11) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `file_type` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `uploaded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attachments`
--

INSERT INTO `attachments` (`attachment_id`, `ref_type`, `ref_id`, `file_path`, `file_type`, `is_active`, `uploaded_at`) VALUES
(1, 'evaluation', 16, 'c6d58e95320b8b23a1fd52d164808b71', 'image/png', 1, '2026-03-24 10:39:55'),
(2, 'project_plan', 2, 'uploads\\evidence\\1774337314174-Screenshot 2024-12-21 114405.png', 'image/png', 1, '2026-03-24 14:28:34'),
(3, 'project_plan', 2, 'uploads\\evidence\\1774339570420-Screenshot 2024-12-25 203113.png', 'image/png', 1, '2026-03-24 15:06:10'),
(4, 'project_plan', 1, 'uploads\\evidence\\1774422925951-Screenshot 2024-12-25 203113.png', 'image/png', 1, '2026-03-25 14:15:25'),
(5, 'evaluation', 17, 'dc6617112b53d17d7fc4ea86fabb4649', 'image/png', 1, '2026-03-26 09:33:41'),
(6, 'evaluation', 18, '295069753e48b74731254b3544add23d', 'image/png', 1, '2026-03-26 09:35:11'),
(7, 'evaluation', 19, '76fd7db4f42965c2cd4bd666f3df3ab9', 'image/png', 1, '2026-03-26 09:41:35'),
(8, 'evaluation', 20, '36baacc551a72a6a94d23cc068582b43', 'image/png', 1, '2026-03-26 10:07:46'),
(9, 'evaluation', 21, '0fbac7cd54009e0d374445907f43117e', 'image/png', 1, '2026-03-26 10:19:12'),
(10, 'evaluation', 22, '025342a24c313ffcc11273ea0dd0df74', 'image/png', 1, '2026-03-26 10:31:00'),
(11, 'evaluation', 23, '0aed29c12563a17dcb68acec0eb4a0f0', 'image/png', 1, '2026-03-26 10:42:54'),
(12, 'evaluation', 24, '1ed67fd861677534695cebac9f7b2266', 'image/png', 1, '2026-03-26 10:51:42'),
(13, 'evaluation', 25, 'ab4f175126dde9a6ea21d80f8255fb55', 'image/png', 1, '2026-03-26 10:54:17'),
(14, 'evaluation', 26, '495f6c75c8757bf795ab23ed6af1cd0a', 'image/png', 1, '2026-03-26 13:29:48'),
(15, 'evaluation', 27, '9b80f4532662f5aed94582a6942b453d', 'image/png', 1, '2026-03-26 16:00:09'),
(16, 'evaluation', 28, '54a2dcf0d8996af3bc68d11d99fd6f54', 'image/png', 1, '2026-03-27 14:04:57'),
(17, 'evaluation', 30, '804a8bd3eb3231ea8cd036112e206ed1', 'application/pdf', 1, '2026-03-27 15:43:28'),
(18, 'evaluation', 31, '39a81f62cf2c14e79f353c979690558d', 'image/png', 1, '2026-03-31 13:25:32');

-- --------------------------------------------------------

--
-- Table structure for table `change_logs`
--

CREATE TABLE `change_logs` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `scope_id` int(11) DEFAULT NULL,
  `project_plan_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `change_type` enum('scope','project_plan','operation','evaluation','profile') DEFAULT NULL,
  `change_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `change_logs`
--

INSERT INTO `change_logs` (`log_id`, `user_id`, `scope_id`, `project_plan_id`, `department_id`, `change_type`, `change_date`) VALUES
(18, 18, 2, 2, 1, 'project_plan', '2026-03-24 15:06:10'),
(19, 18, 1, 1, 1, 'project_plan', '2026-03-25 14:15:25');

-- --------------------------------------------------------

--
-- Table structure for table `change_log_details`
--

CREATE TABLE `change_log_details` (
  `detail_id` int(11) NOT NULL,
  `log_id` int(11) NOT NULL,
  `field_name` varchar(100) DEFAULT NULL,
  `before_value` text DEFAULT NULL,
  `after_value` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `change_log_details`
--

INSERT INTO `change_log_details` (`detail_id`, `log_id`, `field_name`, `before_value`, `after_value`) VALUES
(33, 18, 'plan_name', 'dgc', 'tdh'),
(34, 18, 'scope_name', 'การวางแผนเพิ่มประสิทธิภาพdgzngd', 'การวางแผนเพิ่มประสิทธิภาพdgzngdfshdfc'),
(35, 18, 'department_id', '2', '1'),
(36, 18, 'end_date', '2026-03-30', '2026-03-26');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `department_id` int(11) NOT NULL,
  `department_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`department_id`, `department_name`) VALUES
(1, 'กองนโยบายและแผน'),
(2, 'กองเทคโนโลยีสารสนเทศ'),
(3, 'กองการเงิน'),
(4, 'กองทรัพยากรบุคคล');

-- --------------------------------------------------------

--
-- Table structure for table `divisions`
--

CREATE TABLE `divisions` (
  `division_id` int(11) NOT NULL,
  `division_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `divisions`
--

INSERT INTO `divisions` (`division_id`, `division_name`) VALUES
(1, 'ฝ่ายบริหาร'),
(2, 'ฝ่ายพัฒนา'),
(3, 'ฝ่ายสนับสนุน');

-- --------------------------------------------------------

--
-- Table structure for table `edit_reasons`
--

CREATE TABLE `edit_reasons` (
  `reason_id` int(11) NOT NULL,
  `ref_type` varchar(50) DEFAULT NULL,
  `ref_id` int(11) DEFAULT NULL,
  `reason_text` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `edit_reasons`
--

INSERT INTO `edit_reasons` (`reason_id`, `ref_type`, `ref_id`, `reason_text`, `created_at`) VALUES
(26, 'project_plan', 2, 'แก้ไขตามระเบียบ', '2026-03-24 14:28:34'),
(27, 'project_plan', 2, 'ตามแผน', '2026-03-24 15:06:10'),
(28, 'project_plan', 1, 'kydjg', '2026-03-25 14:15:25');

-- --------------------------------------------------------

--
-- Table structure for table `operational_details`
--

CREATE TABLE `operational_details` (
  `operation_id` int(11) NOT NULL,
  `project_plan_id` int(11) NOT NULL,
  `detail` text DEFAULT NULL,
  `weight_percent` decimal(5,2) NOT NULL,
  `progress_percent` decimal(5,2) DEFAULT 0.00,
  `status_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `operational_details`
--

INSERT INTO `operational_details` (`operation_id`, `project_plan_id`, `detail`, `weight_percent`, `progress_percent`, `status_id`) VALUES
(68, 2, 'SCXV', 10.00, 0.00, 1),
(69, 2, 'ndsgj', 10.00, 0.00, 1),
(70, 2, 'dgx', 20.00, 0.00, 1),
(71, 1, ',hfmv', 10.00, 0.00, 1),
(72, 3, 'dxg', 10.00, 0.00, 1),
(73, 4, 'xnvx', 20.00, 0.00, 1),
(74, 5, 'cb c', 10.00, 0.00, 1),
(75, 39, 'sfnh', 20.00, 0.00, 1),
(76, 40, 'dvsbfdgnf', 20.00, 0.00, 1),
(77, 40, 'bfgnfh', 30.00, 0.00, 1),
(78, 41, 'zvxf', 10.00, 0.00, 1),
(79, 42, 'vdzbfx', 10.00, 0.00, 1),
(80, 43, 'dvbf', 10.00, 0.00, 1),
(81, 43, ' zcbgnd', 10.00, 0.00, 1),
(83, 44, 'ลดขั้นตอนที่ซํ้าซ้อนลง', 20.00, 0.00, 1),
(85, 45, 'การวิเคราะห์ข้อมูล', 10.00, 0.00, 1),
(86, 46, '้่รนีรย', 10.00, 0.00, 1),
(87, 46, 'รีัรน', 15.00, 0.00, 1),
(88, 47, '้นร่', 15.00, 0.00, 1);

-- --------------------------------------------------------

--
-- Table structure for table `plan_evaluations`
--

CREATE TABLE `plan_evaluations` (
  `evaluation_id` int(11) NOT NULL,
  `project_plan_id` int(11) DEFAULT NULL,
  `scope_id` int(11) NOT NULL,
  `objective` text DEFAULT NULL,
  `before_plan` text DEFAULT NULL,
  `expected_outcome` text DEFAULT NULL,
  `actual_outcome` text DEFAULT NULL,
  `recommendation` text DEFAULT NULL,
  `project_status` enum('processing','finish') DEFAULT NULL,
  `evaluation_status` enum('pass','fail') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `plan_evaluations`
--

INSERT INTO `plan_evaluations` (`evaluation_id`, `project_plan_id`, `scope_id`, `objective`, `before_plan`, `expected_outcome`, `actual_outcome`, `recommendation`, `project_status`, `evaluation_status`) VALUES
(16, 2, 2, '[dgcc]', '[fvmbv]', '[tdjgcvj]', NULL, NULL, 'processing', NULL),
(17, 3, 3, '[yf]', '[ftj]', '[yfhm]', NULL, NULL, 'processing', NULL),
(18, 4, 3, '[yfy9i]', '[liluky]', '[oiy]', NULL, NULL, 'processing', NULL),
(19, 5, 4, '[erdt]', '[ty]', '[5et]', NULL, NULL, 'processing', NULL),
(20, 7, 5, '[7tuk]', '[etd]', '[7ryfk]', NULL, NULL, 'processing', NULL),
(21, 8, 5, '[yu]', '[iyl]', '[iy;;u]', NULL, NULL, 'processing', NULL),
(22, 9, 6, '[\"nazsb\"]', '[\"bvmz\"]', '[\"zvmb  c\"]', NULL, NULL, 'processing', NULL),
(23, 10, 6, '[\"xnb dfh\",\"ejdth rfsg \"]', '[\"srhr dgj\",\"etd rdg\"]', '[\"sx fxg\",\"rhyrwsg\"]', NULL, NULL, 'processing', NULL),
(24, 11, 7, '[\"stjh\"]', '[\"sfn\"]', '[\"t,gmh\"]', NULL, NULL, 'processing', NULL),
(25, 12, 7, '[\"dmyr,mf\"]', '[\"stxhfbn h,\"]', '[\"sngdmfjmhn\"]', NULL, NULL, 'processing', NULL),
(26, 14, 8, '[\"dzfxvx\",\"fgnh\"]', '[\" vs\",\"bcnv\"]', '[\"fsdgf\",\"hgg\"]', NULL, NULL, 'processing', NULL),
(27, 21, 12, '[\"vfbgh\",\"v ng\"]', '[\"dvfh\",\"vgdn\"]', '[\"fbdh\",\"gnd\"]', NULL, NULL, 'processing', NULL),
(28, 22, 12, '[\"bfxngd\"]', '[\"gn\"]', '[\"gn\"]', NULL, NULL, 'processing', NULL),
(29, 23, 13, '[\"vdbfdh\"]', '[\"gnd\"]', '[\"vbf\"]', NULL, NULL, 'processing', NULL),
(30, 24, 13, '[\"ลดขั้นตอนทำงาน\"]', '[\"มีขั้นตอน 10 ขั้นตอน\"]', '[\"มีขั้นตอน 7 ขั้นตอน\"]', NULL, NULL, 'processing', NULL),
(31, 30, 16, '[\"โครงสร้างเพิ่มขึ้น\"]', '[\"โครงสร้างน้อย\"]', '[\"โครงสร้างเยอะขึ้น\"]', NULL, NULL, 'processing', NULL),
(32, 45, 30, '[\"\"]', '[\"||10||||\"]', '[\"||8||||\"]', '||15', NULL, 'processing', 'fail');

-- --------------------------------------------------------

--
-- Table structure for table `problems`
--

CREATE TABLE `problems` (
  `problem_id` int(11) NOT NULL,
  `project_plan_id` int(11) NOT NULL,
  `problem_detail` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_plans`
--

CREATE TABLE `project_plans` (
  `project_plan_id` int(11) NOT NULL,
  `scope_id` int(11) NOT NULL,
  `project_plan_name` varchar(255) NOT NULL,
  `status_id` int(11) NOT NULL,
  `progress_percent` float(5,2) DEFAULT 0.00,
  `details` text DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_plans`
--

INSERT INTO `project_plans` (`project_plan_id`, `scope_id`, `project_plan_name`, `status_id`, `progress_percent`, `details`, `start_date`, `end_date`, `created_at`) VALUES
(1, 1, 'การปรับปรุงระเบียบหลักเกณฑ์, วิธีปฏิบัติงานและคู่มือที่เกี่ยวข้อง', 1, 0.00, NULL, '2026-03-17', '2027-03-17', '2026-03-13 16:17:01'),
(2, 2, 'tdh', 1, 0.00, NULL, '2026-03-17', '2026-03-26', '2026-03-24 10:18:03'),
(3, 3, 'tuk', 1, 0.00, NULL, '2026-03-26', '2026-04-08', '2026-03-26 09:30:27'),
(4, 3, 'mfhvn', 1, 0.00, NULL, '2026-03-26', '2026-03-26', '2026-03-26 09:30:27'),
(5, 4, 'dgn', 1, 0.00, NULL, '2026-03-26', '2026-03-27', '2026-03-26 09:34:16'),
(6, 4, 'bf', 1, 0.00, NULL, NULL, NULL, '2026-03-26 09:34:16'),
(7, 5, 'fbxc', 1, 0.00, NULL, NULL, NULL, '2026-03-26 09:41:04'),
(8, 5, 'dvc', 1, 0.00, NULL, NULL, NULL, '2026-03-26 09:41:04'),
(9, 6, 'gc', 1, 0.00, NULL, NULL, NULL, '2026-03-26 10:02:04'),
(10, 6, 'dgn', 1, 0.00, NULL, NULL, NULL, '2026-03-26 10:02:04'),
(11, 7, 'fs', 1, 0.00, NULL, NULL, NULL, '2026-03-26 10:07:12'),
(12, 7, 'xngtuglulh,j ', 1, 0.00, NULL, NULL, NULL, '2026-03-26 10:07:12'),
(13, 8, 'gfn', 1, 0.00, NULL, NULL, NULL, '2026-03-26 10:18:27'),
(14, 8, 'hdsrth', 1, 0.00, NULL, NULL, NULL, '2026-03-26 10:18:27'),
(15, 9, 'ngdn', 1, 0.00, NULL, NULL, NULL, '2026-03-26 10:30:13'),
(16, 9, 'abrhgrswr', 1, 0.00, NULL, NULL, NULL, '2026-03-26 10:30:13'),
(17, 10, 'srfx', 1, 0.00, NULL, NULL, NULL, '2026-03-26 10:39:21'),
(18, 10, 'sntbfx', 1, 0.00, NULL, NULL, NULL, '2026-03-26 10:39:21'),
(19, 11, 'fsdxb', 1, 0.00, NULL, NULL, NULL, '2026-03-26 10:48:06'),
(20, 11, 'tjsdg', 1, 0.00, NULL, NULL, NULL, '2026-03-26 10:48:06'),
(21, 12, 'ndsgxn', 1, 0.00, NULL, NULL, NULL, '2026-03-26 10:53:23'),
(22, 12, 'xg', 1, 0.00, NULL, NULL, NULL, '2026-03-26 10:53:23'),
(23, 13, 'yjucg', 1, 0.00, NULL, NULL, NULL, '2026-03-26 13:21:49'),
(24, 13, 'x', 1, 0.00, NULL, NULL, NULL, '2026-03-26 13:21:49'),
(25, 14, 'dgxng', 1, 0.00, NULL, NULL, NULL, '2026-03-26 13:28:55'),
(26, 14, 'gc', 1, 0.00, NULL, NULL, NULL, '2026-03-26 13:28:55'),
(27, 15, 'zbf', 1, 0.00, NULL, NULL, NULL, '2026-03-26 14:20:51'),
(28, 15, 'fg', 1, 0.00, NULL, NULL, NULL, '2026-03-26 14:20:51'),
(29, 16, 'cvxbcv', 1, 0.00, NULL, NULL, NULL, '2026-03-26 14:32:41'),
(30, 16, 'fbg', 1, 0.00, NULL, NULL, NULL, '2026-03-26 14:32:41'),
(31, 17, 'bcbv', 1, 0.00, NULL, NULL, NULL, '2026-03-26 14:48:56'),
(32, 17, 'fgiyluk.,mhng', 1, 0.00, NULL, NULL, NULL, '2026-03-26 14:48:56'),
(33, 18, 'vbv', 1, 0.00, NULL, NULL, NULL, '2026-03-26 14:54:34'),
(34, 18, 'gsdhfghh', 1, 0.00, NULL, NULL, NULL, '2026-03-26 14:54:34'),
(35, 19, 'bf', 1, 0.00, NULL, NULL, NULL, '2026-03-26 15:13:01'),
(36, 19, 'bfgn', 1, 0.00, NULL, NULL, NULL, '2026-03-26 15:13:01'),
(37, 20, 'dgsdgf', 1, 0.00, NULL, NULL, NULL, '2026-03-26 15:35:51'),
(38, 20, 'dvsfdgf', 1, 0.00, NULL, NULL, NULL, '2026-03-26 15:35:51'),
(39, 21, 'hjj', 1, 0.00, NULL, '2026-03-26', '2026-04-08', '2026-03-26 15:59:18'),
(40, 21, 'gsrdhfg', 1, 0.00, NULL, '2026-03-27', '2026-04-07', '2026-03-26 15:59:18'),
(41, 22, 'thy', 1, 0.00, NULL, '2026-03-27', '2026-04-07', '2026-03-27 14:04:22'),
(42, 22, 'dfg', 1, 0.00, NULL, '2026-03-27', '2026-03-30', '2026-03-27 14:04:22'),
(43, 23, 'fbgnfh', 1, 0.00, NULL, NULL, NULL, '2026-03-27 14:37:22'),
(44, 24, 'ลดขั้นตอนการปฏิบัติงาน', 1, 0.00, NULL, '2026-03-31', '2026-04-30', '2026-03-27 15:38:48'),
(45, 30, 'การเพิ่มขั้นตอนการทำงาน', 1, 0.00, NULL, NULL, NULL, '2026-03-31 13:24:30'),
(46, 31, 'ดห', 1, 0.00, NULL, '2026-03-31', '2026-04-07', '2026-03-31 15:31:35'),
(47, 31, 'อป ', 1, 0.00, NULL, '2026-03-31', '2026-04-06', '2026-03-31 15:31:35');

-- --------------------------------------------------------

--
-- Table structure for table `scopes`
--

CREATE TABLE `scopes` (
  `scope_id` int(11) NOT NULL,
  `scope_name` varchar(255) NOT NULL,
  `department_id` int(11) NOT NULL,
  `coordinator_id` int(11) DEFAULT NULL,
  `status_id` int(11) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `progress_percent` decimal(5,2) DEFAULT 0.00,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `scopes`
--

INSERT INTO `scopes` (`scope_id`, `scope_name`, `department_id`, `coordinator_id`, `status_id`, `start_date`, `end_date`, `progress_percent`, `created_at`) VALUES
(1, 'การปรับปรุงกระบวนการที่เกี่ยวข้องกับการเพิ่มประสิทธิภาพการให้บริการ e-Bill (e-Receipt, e-Invoice)', 1, 19, 1, '2026-03-18', '2027-03-18', 0.00, '2026-03-13 16:17:01'),
(2, 'การวางแผนเพิ่มประสิทธิภาพdgzngdfshdfc', 1, 24, 1, '2026-03-24', '2026-03-25', 0.00, '2026-03-24 10:18:03'),
(3, 'fmcfn', 3, 26, 1, '2026-03-26', '2026-03-26', 0.00, '2026-03-26 09:30:27'),
(4, 'rshdf', 4, 28, 1, '2026-03-26', '2026-03-27', 0.00, '2026-03-26 09:34:16'),
(5, 'sfb', 3, 30, 1, NULL, NULL, 0.00, '2026-03-26 09:41:04'),
(6, 'dymcg', 4, 32, 1, NULL, NULL, 0.00, '2026-03-26 10:02:04'),
(7, 'sr50', 3, 34, 1, NULL, NULL, 0.00, '2026-03-26 10:07:12'),
(8, 'dsgzv10', 3, 36, 1, NULL, NULL, 0.00, '2026-03-26 10:18:27'),
(9, 'ndcgn20', 3, 38, 1, NULL, NULL, 0.00, '2026-03-26 10:30:13'),
(10, 'ersdhdf30', 3, 39, 1, NULL, NULL, 0.00, '2026-03-26 10:39:21'),
(11, 'rsgxdb40', 3, 41, 1, NULL, NULL, 0.00, '2026-03-26 10:48:06'),
(12, 'gndxx50', 4, 42, 1, NULL, NULL, 0.00, '2026-03-26 10:53:23'),
(13, 'sfgdxff60', 4, 44, 1, NULL, NULL, 0.00, '2026-03-26 13:21:49'),
(14, 'ndgx60', 3, 46, 1, NULL, NULL, 0.00, '2026-03-26 13:28:55'),
(15, 'rsgsvd70', 4, 48, 1, NULL, NULL, 0.00, '2026-03-26 14:20:51'),
(16, 'sfaghgfjh80', 3, 50, 1, NULL, NULL, 0.00, '2026-03-26 14:32:41'),
(17, 'shg90', 3, 51, 1, NULL, NULL, 0.00, '2026-03-26 14:48:56'),
(18, 'dsgfdgfh90', 3, 53, 1, NULL, NULL, 0.00, '2026-03-26 14:54:34'),
(19, 'gg100', 3, 55, 1, NULL, NULL, 0.00, '2026-03-26 15:13:01'),
(20, 'dgsfdh200', 2, 57, 1, NULL, NULL, 0.00, '2026-03-26 15:35:51'),
(21, 'gtwr', 3, 59, 1, NULL, NULL, 0.00, '2026-03-26 15:59:18'),
(22, 'erdt', 3, 61, 1, NULL, NULL, 0.00, '2026-03-27 14:04:22'),
(23, 'dfgn', 3, 63, 1, NULL, NULL, 0.00, '2026-03-27 14:37:22'),
(24, 'การวางแผนเพิ่มประสิทธิภาพการดำเนินงาน', 4, 65, 1, '2026-04-03', '2026-04-07', 0.00, '2026-03-27 15:38:48'),
(30, 'การเพิ่มโครงสร้างองค์กร', 1, 67, 1, '2026-03-31', '2026-04-06', 0.00, '2026-03-31 13:24:30'),
(31, 'ปอ ', 4, 69, 1, '2026-03-31', '2026-04-06', 0.00, '2026-03-31 15:31:35');

-- --------------------------------------------------------

--
-- Table structure for table `solutions`
--

CREATE TABLE `solutions` (
  `solution_id` int(11) NOT NULL,
  `project_plan_id` int(11) NOT NULL,
  `solution_detail` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `status`
--

CREATE TABLE `status` (
  `status_id` int(11) NOT NULL,
  `status_code` varchar(50) NOT NULL,
  `status_label` varchar(100) DEFAULT NULL,
  `is_success` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `status`
--

INSERT INTO `status` (`status_id`, `status_code`, `status_label`, `is_success`) VALUES
(1, 'processing_gap', 'กำลังดำเนินการ', 0),
(2, 'complete_gap', 'ดำเนินการเสร็จสิ้น', 1),
(3, 'acceptable_gap', 'ไม่สามารถปิด GAP แต่ยอมรับได้', 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `role` enum('admin','coordinator','user','viewer') DEFAULT 'user',
  `department_id` int(11) DEFAULT NULL COMMENT 'รหัสแผนก',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `user_name`, `email`, `phone_number`, `role`, `department_id`, `created_at`) VALUES
(18, 'สมใจ สุขศรี', 'somjai@gmail.com', '1234', 'admin', 1, '2026-03-13 15:23:28'),
(19, 'สุภัทร ปัทมะทิน', '6531501132@lamd', '6727', 'coordinator', 1, '2026-03-13 16:17:01'),
(20, 'อนัญญา สัมโย', 'ananya.sam', '2759', 'user', 1, '2026-03-13 16:17:01'),
(21, 'สมชาย สุขจันทร์', 'ss@gmail.com', '4569', 'viewer', 1, '2026-03-15 14:25:38'),
(22, 'สมศรี สุขจันทร์', 'soms@gmail.com', '1578', 'viewer', 3, '2026-03-18 11:16:42'),
(23, 'สม หวัง', 's@gmail.com', '1578', 'viewer', 2, '2026-03-18 11:22:54'),
(24, 'gfhnn', '653150a', '1546', 'coordinator', 4, '2026-03-24 10:18:03'),
(25, 'fij', 'ananya.samyo@gm', '1567', 'user', 4, '2026-03-24 10:18:03'),
(26, 'ghvj', 'hjvn', 'hm', 'coordinator', 3, '2026-03-26 09:30:27'),
(27, 'hvm', 'hm', 'ghmv', 'user', 3, '2026-03-26 09:30:27'),
(28, 'fg', 'fdg', 'fb', 'coordinator', 4, '2026-03-26 09:34:16'),
(29, 'fbx', 'bv', 'bx', 'user', 4, '2026-03-26 09:34:16'),
(30, 'dfxb', 'fxb', 'x', 'coordinator', 3, '2026-03-26 09:41:04'),
(31, 'xcb', 'bfx', 'bx', 'user', 3, '2026-03-26 09:41:04'),
(32, 'dgb', 'c', 'c', 'coordinator', 4, '2026-03-26 10:02:04'),
(33, 'f', 'f', 'fj', 'user', 4, '2026-03-26 10:02:04'),
(34, 'iyl', 'ghj', 'vh', 'coordinator', 3, '2026-03-26 10:07:12'),
(35, 'jg', 'mv', 'm', 'user', 3, '2026-03-26 10:07:12'),
(36, 'dnz', 'cvxb', 'vdz', 'coordinator', 3, '2026-03-26 10:18:27'),
(37, 'cn', 'fgn', 'ghdt', 'user', 3, '2026-03-26 10:18:27'),
(38, 'etndnh', 'dhb', 'df', 'coordinator', 3, '2026-03-26 10:30:13'),
(39, 'fsdx', 'bdx', 'sf', 'coordinator', 3, '2026-03-26 10:39:21'),
(40, 'gnsddh', 'fsb', 'sfx', 'user', 3, '2026-03-26 10:39:21'),
(41, 'zb', 'z', 'mry', 'coordinator', 3, '2026-03-26 10:48:06'),
(42, 'snx', 'dfx', 'x f', 'coordinator', 4, '2026-03-26 10:53:23'),
(43, 'dgc', 'nfvx', 'cb ', 'user', 4, '2026-03-26 10:53:23'),
(44, 'cg, ', 'g', 'gh', 'coordinator', 4, '2026-03-26 13:21:49'),
(45, 'sf', 'fsxsb', 'v', 'user', 4, '2026-03-26 13:21:49'),
(46, 'cxb', 'cx', 'zbf', 'coordinator', 3, '2026-03-26 13:28:55'),
(47, 'x', 'dn', 'hm', 'user', 3, '2026-03-26 13:28:55'),
(48, 'bfsdgfh', 'cxvcb', 'bvcb', 'coordinator', 4, '2026-03-26 14:20:51'),
(49, 'cvxbc', 'sdg', 'fsdgn', 'user', 4, '2026-03-26 14:20:51'),
(50, 'fsgdf', 'bcv', 'vfbnb', 'coordinator', 3, '2026-03-26 14:32:41'),
(51, 'cvbvbv', 'vcbv', 'bvnb', 'coordinator', 3, '2026-03-26 14:48:56'),
(52, 'vb', 'hgh', 'cbvc', 'user', 3, '2026-03-26 14:48:56'),
(53, 'dgfdgf', 'gfg', 'bnbv', 'coordinator', 3, '2026-03-26 14:54:34'),
(54, 'dgf', 'lkjh', 'mnbv', 'user', 3, '2026-03-26 14:54:34'),
(55, 'jh', 'bfb', 'f', 'coordinator', 3, '2026-03-26 15:13:01'),
(56, 'bfbnm', 'yjth', 'vbnn', 'user', 3, '2026-03-26 15:13:01'),
(57, 'dvsfdgfh', 'grthg', 'sfdgf', 'coordinator', 2, '2026-03-26 15:35:51'),
(58, 'bsfdgnh', 'dvsfdg', 'cbvb', 'user', 2, '2026-03-26 15:35:51'),
(59, 'bfg', 'fgd', 'bfgn', 'coordinator', 3, '2026-03-26 15:59:18'),
(60, 'bfg', 'fg', 'cvxb', 'user', 3, '2026-03-26 15:59:18'),
(61, 'dgfdg', 'fbgn', '8899', 'coordinator', 3, '2026-03-27 14:04:22'),
(62, 'rbf', 'yedg', '1236', 'user', 3, '2026-03-27 14:04:22'),
(63, 'vbfgn', 'bxgnf', '1569', 'coordinator', 3, '2026-03-27 14:37:22'),
(64, 'xdzvfb', 'cbfs', '1458', 'user', 3, '2026-03-27 14:37:22'),
(65, 'สมพร สุขดี', '6531501132@lamduan.mfu.ac', '1793', 'coordinator', 4, '2026-03-27 15:38:48'),
(66, 'สมพุทธ สุขดี', 'ananya.samyo@gmail', '3971', 'user', 4, '2026-03-27 15:38:48'),
(67, 'อนัญญา สัมโย', 'ananya.samyo@gmail.com', '4554', 'coordinator', 1, '2026-03-31 13:24:30'),
(68, 'อนัน เมตตา', '6531501132@lamduan.mfu.ac.th', '1221', 'user', 1, '2026-03-31 13:24:30'),
(69, 'กเ', 'ิอ', '12', 'coordinator', 4, '2026-03-31 15:31:35'),
(70, '้ด', 'ิท', '159', 'user', 4, '2026-03-31 15:31:35');

-- --------------------------------------------------------

--
-- Table structure for table `working_groups`
--

CREATE TABLE `working_groups` (
  `working_group_id` int(11) NOT NULL,
  `scope_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `working_groups`
--

INSERT INTO `working_groups` (`working_group_id`, `scope_id`, `user_id`, `role`) VALUES
(59, 1, 19, 'Coordinator'),
(60, 1, 20, 'Member'),
(61, 2, 24, 'Coordinator'),
(62, 2, 25, 'Member'),
(63, 3, 26, 'Coordinator'),
(64, 3, 27, 'Member'),
(65, 3, 26, 'Coordinator'),
(66, 3, 27, 'Member'),
(67, 4, 28, 'Coordinator'),
(68, 4, 29, 'Member'),
(69, 4, 28, 'Coordinator'),
(70, 4, 29, 'Member'),
(71, 5, 30, 'Coordinator'),
(72, 5, 31, 'Member'),
(73, 5, 30, 'Coordinator'),
(74, 5, 31, 'Member'),
(75, 6, 32, 'Coordinator'),
(76, 6, 33, 'Member'),
(77, 6, 32, 'Coordinator'),
(78, 6, 33, 'Member'),
(79, 7, 34, 'Coordinator'),
(80, 7, 35, 'Member'),
(81, 7, 34, 'Coordinator'),
(82, 7, 35, 'Member'),
(83, 8, 36, 'Coordinator'),
(84, 8, 37, 'Member'),
(85, 8, 36, 'Coordinator'),
(86, 8, 37, 'Member'),
(87, 9, 38, 'Coordinator'),
(88, 9, 30, 'Member'),
(89, 9, 38, 'Coordinator'),
(90, 9, 30, 'Member'),
(91, 10, 39, 'Coordinator'),
(92, 10, 40, 'Member'),
(93, 10, 39, 'Coordinator'),
(94, 10, 40, 'Member'),
(95, 11, 41, 'Coordinator'),
(96, 11, 41, 'Member'),
(97, 11, 41, 'Coordinator'),
(98, 11, 41, 'Member'),
(99, 12, 42, 'Coordinator'),
(100, 12, 43, 'Member'),
(101, 12, 42, 'Coordinator'),
(102, 12, 43, 'Member'),
(103, 13, 44, 'Coordinator'),
(104, 13, 45, 'Member'),
(105, 13, 44, 'Coordinator'),
(106, 13, 45, 'Member'),
(107, 14, 46, 'Coordinator'),
(108, 14, 47, 'Member'),
(109, 14, 46, 'Coordinator'),
(110, 14, 47, 'Member'),
(111, 15, 48, 'Coordinator'),
(112, 15, 49, 'Member'),
(113, 15, 48, 'Coordinator'),
(114, 15, 49, 'Member'),
(115, 16, 50, 'Coordinator'),
(116, 16, 29, 'Member'),
(117, 16, 50, 'Coordinator'),
(118, 16, 29, 'Member'),
(119, 17, 51, 'Coordinator'),
(120, 17, 52, 'Member'),
(121, 17, 51, 'Coordinator'),
(122, 17, 52, 'Member'),
(123, 18, 53, 'Coordinator'),
(124, 18, 54, 'Member'),
(125, 18, 53, 'Coordinator'),
(126, 18, 54, 'Member'),
(127, 19, 55, 'Coordinator'),
(128, 19, 56, 'Member'),
(129, 19, 55, 'Coordinator'),
(130, 19, 56, 'Member'),
(131, 20, 57, 'Coordinator'),
(132, 20, 58, 'Member'),
(133, 20, 57, 'Coordinator'),
(134, 20, 58, 'Member'),
(135, 21, 59, 'Coordinator'),
(136, 21, 60, 'Member'),
(137, 21, 59, 'Coordinator'),
(138, 21, 60, 'Member'),
(139, 22, 61, 'Coordinator'),
(140, 22, 62, 'Member'),
(141, 22, 61, 'Coordinator'),
(142, 22, 62, 'Member'),
(143, 23, 63, 'Coordinator'),
(144, 23, 64, 'Member'),
(145, 24, 65, 'Coordinator'),
(146, 24, 66, 'Member'),
(147, 30, 67, 'Coordinator'),
(148, 30, 68, 'Member'),
(149, 31, 69, 'Coordinator'),
(150, 31, 70, 'Member'),
(151, 31, 69, 'Coordinator'),
(152, 31, 70, 'Member');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attachments`
--
ALTER TABLE `attachments`
  ADD PRIMARY KEY (`attachment_id`);

--
-- Indexes for table `change_logs`
--
ALTER TABLE `change_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `scope_id` (`scope_id`),
  ADD KEY `project_plan_id` (`project_plan_id`),
  ADD KEY `department_id` (`department_id`);

--
-- Indexes for table `change_log_details`
--
ALTER TABLE `change_log_details`
  ADD PRIMARY KEY (`detail_id`),
  ADD KEY `log_id` (`log_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`department_id`);

--
-- Indexes for table `divisions`
--
ALTER TABLE `divisions`
  ADD PRIMARY KEY (`division_id`);

--
-- Indexes for table `edit_reasons`
--
ALTER TABLE `edit_reasons`
  ADD PRIMARY KEY (`reason_id`);

--
-- Indexes for table `operational_details`
--
ALTER TABLE `operational_details`
  ADD PRIMARY KEY (`operation_id`),
  ADD KEY `project_plan_id` (`project_plan_id`),
  ADD KEY `status_id` (`status_id`);

--
-- Indexes for table `plan_evaluations`
--
ALTER TABLE `plan_evaluations`
  ADD PRIMARY KEY (`evaluation_id`),
  ADD KEY `scope_id` (`scope_id`),
  ADD KEY `fk_eval_project` (`project_plan_id`);

--
-- Indexes for table `problems`
--
ALTER TABLE `problems`
  ADD PRIMARY KEY (`problem_id`),
  ADD KEY `project_plan_id` (`project_plan_id`);

--
-- Indexes for table `project_plans`
--
ALTER TABLE `project_plans`
  ADD PRIMARY KEY (`project_plan_id`),
  ADD KEY `scope_id` (`scope_id`),
  ADD KEY `status_id` (`status_id`);

--
-- Indexes for table `scopes`
--
ALTER TABLE `scopes`
  ADD PRIMARY KEY (`scope_id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `coordinator_id` (`coordinator_id`),
  ADD KEY `status_id` (`status_id`);

--
-- Indexes for table `solutions`
--
ALTER TABLE `solutions`
  ADD PRIMARY KEY (`solution_id`),
  ADD KEY `project_plan_id` (`project_plan_id`);

--
-- Indexes for table `status`
--
ALTER TABLE `status`
  ADD PRIMARY KEY (`status_id`),
  ADD UNIQUE KEY `status_code` (`status_code`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `working_groups`
--
ALTER TABLE `working_groups`
  ADD PRIMARY KEY (`working_group_id`),
  ADD KEY `scope_id` (`scope_id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attachments`
--
ALTER TABLE `attachments`
  MODIFY `attachment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `change_logs`
--
ALTER TABLE `change_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `change_log_details`
--
ALTER TABLE `change_log_details`
  MODIFY `detail_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `department_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `divisions`
--
ALTER TABLE `divisions`
  MODIFY `division_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `edit_reasons`
--
ALTER TABLE `edit_reasons`
  MODIFY `reason_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `operational_details`
--
ALTER TABLE `operational_details`
  MODIFY `operation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=89;

--
-- AUTO_INCREMENT for table `plan_evaluations`
--
ALTER TABLE `plan_evaluations`
  MODIFY `evaluation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `problems`
--
ALTER TABLE `problems`
  MODIFY `problem_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `project_plans`
--
ALTER TABLE `project_plans`
  MODIFY `project_plan_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `scopes`
--
ALTER TABLE `scopes`
  MODIFY `scope_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `solutions`
--
ALTER TABLE `solutions`
  MODIFY `solution_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `status`
--
ALTER TABLE `status`
  MODIFY `status_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT for table `working_groups`
--
ALTER TABLE `working_groups`
  MODIFY `working_group_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=153;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `change_logs`
--
ALTER TABLE `change_logs`
  ADD CONSTRAINT `change_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `change_logs_ibfk_2` FOREIGN KEY (`scope_id`) REFERENCES `scopes` (`scope_id`),
  ADD CONSTRAINT `change_logs_ibfk_3` FOREIGN KEY (`project_plan_id`) REFERENCES `project_plans` (`project_plan_id`),
  ADD CONSTRAINT `change_logs_ibfk_4` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`);

--
-- Constraints for table `change_log_details`
--
ALTER TABLE `change_log_details`
  ADD CONSTRAINT `change_log_details_ibfk_1` FOREIGN KEY (`log_id`) REFERENCES `change_logs` (`log_id`);

--
-- Constraints for table `operational_details`
--
ALTER TABLE `operational_details`
  ADD CONSTRAINT `operational_details_ibfk_1` FOREIGN KEY (`project_plan_id`) REFERENCES `project_plans` (`project_plan_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `operational_details_ibfk_2` FOREIGN KEY (`status_id`) REFERENCES `status` (`status_id`);

--
-- Constraints for table `plan_evaluations`
--
ALTER TABLE `plan_evaluations`
  ADD CONSTRAINT `fk_eval_project` FOREIGN KEY (`project_plan_id`) REFERENCES `project_plans` (`project_plan_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `plan_evaluations_ibfk_1` FOREIGN KEY (`scope_id`) REFERENCES `scopes` (`scope_id`);

--
-- Constraints for table `problems`
--
ALTER TABLE `problems`
  ADD CONSTRAINT `problems_ibfk_1` FOREIGN KEY (`project_plan_id`) REFERENCES `project_plans` (`project_plan_id`) ON DELETE CASCADE;

--
-- Constraints for table `project_plans`
--
ALTER TABLE `project_plans`
  ADD CONSTRAINT `project_plans_ibfk_1` FOREIGN KEY (`scope_id`) REFERENCES `scopes` (`scope_id`),
  ADD CONSTRAINT `project_plans_ibfk_2` FOREIGN KEY (`status_id`) REFERENCES `status` (`status_id`);

--
-- Constraints for table `scopes`
--
ALTER TABLE `scopes`
  ADD CONSTRAINT `scopes_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`),
  ADD CONSTRAINT `scopes_ibfk_2` FOREIGN KEY (`coordinator_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `scopes_ibfk_3` FOREIGN KEY (`status_id`) REFERENCES `status` (`status_id`);

--
-- Constraints for table `solutions`
--
ALTER TABLE `solutions`
  ADD CONSTRAINT `solutions_ibfk_1` FOREIGN KEY (`project_plan_id`) REFERENCES `project_plans` (`project_plan_id`) ON DELETE CASCADE;

--
-- Constraints for table `working_groups`
--
ALTER TABLE `working_groups`
  ADD CONSTRAINT `working_groups_ibfk_1` FOREIGN KEY (`scope_id`) REFERENCES `scopes` (`scope_id`),
  ADD CONSTRAINT `working_groups_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);


COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
