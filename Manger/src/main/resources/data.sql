-- Fix attendance table id column to use AUTO_INCREMENT
-- This script runs automatically when the application starts (via Spring's data.sql feature)
-- It fixes the issue where the attendance.id column doesn't have a default value

ALTER TABLE attendance MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;
