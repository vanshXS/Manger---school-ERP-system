package com.vansh.manger.Manger.common.util;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class DatabaseFixRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseFixRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            log.info("Attempting to clean up legacy unique constraint on subjects table...");
            jdbcTemplate.execute("ALTER TABLE subjects DROP INDEX UKaodt3utnw0lsov4k9ta88dbpr");
            log.info("Successfully dropped legacy unique constraint UKaodt3utnw0lsov4k9ta88dbpr.");
        } catch (Exception e) {
            // It's perfectly normal for this to fail if the constraint is already dropped.
            log.debug("Legacy constraint already dropped or does not exist. Safe to ignore.");
        }
    }
}
