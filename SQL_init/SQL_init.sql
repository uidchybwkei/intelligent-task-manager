-- Task Manager Application Database Schema
-- Created for Task Management System

-- Table: tasks
-- Stores main task information
CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    due_at TIMESTAMP NULL,
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at),
    INDEX idx_due_at (due_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: task_tags
-- Stores tags associated with tasks (many-to-many relationship)
CREATE TABLE IF NOT EXISTS task_tags (
    task_id BIGINT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    PRIMARY KEY (task_id, tag),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    INDEX idx_tag_task (tag, task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data (optional)
INSERT INTO tasks (title, description, status, priority, due_at) VALUES
('设计系统 V2', '完成新设计系统的色彩调色板和排版设计', 'IN_PROGRESS', 'HIGH', DATE_ADD(NOW(), INTERVAL 7 DAY)),
('Q4 营销策略', '起草 Q4 营销活动初步计划，包括社交媒体和电子邮件', 'PENDING', 'MEDIUM', NULL),
('修复导航栏 Bug', 'iOS 设备上点击外部时移动端菜单无法关闭', 'PENDING', 'HIGH', DATE_ADD(NOW(), INTERVAL 3 DAY));

-- Insert sample tags
INSERT INTO task_tags (task_id, tag) VALUES
(1, 'Design'),
(1, 'UI/UX'),
(2, 'Marketing'),
(2, 'Planning'),
(3, 'Development'),
(3, 'Bug');
