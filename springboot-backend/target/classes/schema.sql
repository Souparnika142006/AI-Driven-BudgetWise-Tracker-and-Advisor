-- ========================================================
-- AI-Driven BudgetWise Tracker Database Schema (MySQL)
-- Enterprise-grade schema configuration for CSE Interview
-- ========================================================

CREATE DATABASE IF NOT EXISTS budgetwise_db;
USE budgetwise_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    currency_symbol VARCHAR(5) DEFAULT '₹',
    monthly_salary_goal DOUBLE DEFAULT 40000.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Roles Table for JWT Auth Context
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

-- 3. User Roles Mapping Table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 4. Income Ledger
CREATE TABLE IF NOT EXISTS income (
    id VARCHAR(50) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    amount DOUBLE NOT NULL,
    source VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Expenses Ledger with AI Anomaly Flags
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(50) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    amount DOUBLE NOT NULL,
    category VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Category Budgets
CREATE TABLE IF NOT EXISTS monthly_budget (
    id VARCHAR(50) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    amount DOUBLE NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g., 'Food', 'Transport', 'all'
    month VARCHAR(7) NOT NULL, -- e.g., '2026-07'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_cat_month (user_id, category, month),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Savings Goals with velocity tracking
CREATE TABLE IF NOT EXISTS savings_goals (
    id VARCHAR(50) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    target_amount DOUBLE NOT NULL,
    current_amount DOUBLE NOT NULL DEFAULT 0.0,
    deadline DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Notifications / Alerts history logs
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'success', 'warning', 'info'
    message VARCHAR(500) NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Insert Default Roles & System Configurations
INSERT INTO roles(name) VALUES('ROLE_USER') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO roles(name) VALUES('ROLE_ADMIN') ON DUPLICATE KEY UPDATE name=name;
