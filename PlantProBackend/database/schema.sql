-- Zijja Plantation Management System Database Schema
-- MySQL 8.0+ Required

-- Create database
CREATE DATABASE IF NOT EXISTS plantation_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE plantation_db;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    role ENUM('manager', 'field_staff', 'analytics') DEFAULT 'field_staff',
    phoneNumber VARCHAR(20),
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (isActive)
);

-- Plant species table
CREATE TABLE plant_species (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    scientificName VARCHAR(255) NOT NULL,
    description TEXT,
    growthPeriodDays INT NOT NULL,
    harvestPeriodDays INT NOT NULL,
    expectedYieldPerPlant DECIMAL(5,2) NOT NULL,
    yieldUnit VARCHAR(20) NOT NULL,
    optimalConditions JSON,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Zones table
CREATE TABLE zones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    areaHectares DECIMAL(10,2) NOT NULL,
    coordinates JSON,
    soilData JSON,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_active (isActive)
);

-- Plant lots table
CREATE TABLE plant_lots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lotNumber VARCHAR(50) UNIQUE NOT NULL,
    qrCode VARCHAR(255) UNIQUE NOT NULL,
    plantCount INT NOT NULL,
    plantedDate DATE NOT NULL,
    expectedHarvestDate DATE,
    actualHarvestDate DATE,
    status ENUM('seedling', 'growing', 'mature', 'harvesting', 'harvested', 'diseased', 'dead') DEFAULT 'seedling',
    currentYield DECIMAL(10,2),
    location JSON,
    notes TEXT,
    speciesId INT NOT NULL,
    zoneId INT NOT NULL,
    assignedToId INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (speciesId) REFERENCES plant_species(id) ON DELETE RESTRICT,
    FOREIGN KEY (zoneId) REFERENCES zones(id) ON DELETE RESTRICT,
    FOREIGN KEY (assignedToId) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_lot_number (lotNumber),
    INDEX idx_qr_code (qrCode),
    INDEX idx_status (status),
    INDEX idx_planted_date (plantedDate),
    INDEX idx_species (speciesId),
    INDEX idx_zone (zoneId),
    INDEX idx_assigned (assignedToId)
);

-- Health logs table
CREATE TABLE health_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    healthStatus ENUM('excellent', 'good', 'fair', 'poor', 'critical') NOT NULL,
    observations TEXT,
    symptoms JSON,
    treatments JSON,
    measurements JSON,
    environmentalConditions JSON,
    imageUrls TEXT, -- Comma-separated URLs
    aiAnalysis JSON,
    plantLotId INT NOT NULL,
    recordedById INT NOT NULL,
    recordedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plantLotId) REFERENCES plant_lots(id) ON DELETE CASCADE,
    FOREIGN KEY (recordedById) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_health_status (healthStatus),
    INDEX idx_plant_lot (plantLotId),
    INDEX idx_recorded_by (recordedById),
    INDEX idx_recorded_at (recordedAt)
);

-- Reports table
CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type ENUM('daily_summary', 'weekly_summary', 'monthly_summary', 'harvest_report', 'health_analysis', 'custom') NOT NULL,
    status ENUM('generating', 'completed', 'failed') DEFAULT 'generating',
    parameters JSON NOT NULL,
    data JSON,
    fileUrl VARCHAR(500),
    downloadCount INT DEFAULT 0,
    errorMessage TEXT,
    generatedById INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completedAt TIMESTAMP NULL,
    FOREIGN KEY (generatedById) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_generated_by (generatedById),
    INDEX idx_created_at (createdAt)
);

-- Insert sample data
INSERT INTO users (email, password, firstName, lastName, role) VALUES
('admin@plantation.com', '$2b$10$example_hash', 'Admin', 'User', 'manager'),
('field@plantation.com', '$2b$10$example_hash', 'Field', 'Worker', 'field_staff'),
('analyst@plantation.com', '$2b$10$example_hash', 'Data', 'Analyst', 'analytics');

INSERT INTO plant_species (name, scientificName, growthPeriodDays, harvestPeriodDays, expectedYieldPerPlant, yieldUnit) VALUES
('Tomato', 'Solanum lycopersicum', 120, 90, 5.50, 'kg'),
('Corn', 'Zea mays', 90, 30, 0.75, 'kg'),
('Rice', 'Oryza sativa', 150, 45, 0.25, 'kg');

INSERT INTO zones (name, areaHectares, coordinates) VALUES
('North Field', 10.50, '{"latitude": 6.9271, "longitude": 79.8612}'),
('South Field', 8.25, '{"latitude": 6.9171, "longitude": 79.8512}'),
('East Greenhouse', 2.00, '{"latitude": 6.9371, "longitude": 79.8712}');
