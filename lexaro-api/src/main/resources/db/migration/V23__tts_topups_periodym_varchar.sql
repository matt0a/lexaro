-- Convert from CHAR(7) to VARCHAR(7) safely
ALTER TABLE tts_topups
    ALTER COLUMN period_ym TYPE varchar(7)
        USING trim(period_ym);
