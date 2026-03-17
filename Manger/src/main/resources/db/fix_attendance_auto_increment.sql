-- Fix the attendance table 'id' column to use AUTO_INCREMENT.
-- This is required because GenerationType.IDENTITY needs AUTO_INCREMENT in MySQL.
-- Previous GenerationType.AUTO may have created the column without it.

ALTER TABLE attendance MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;
