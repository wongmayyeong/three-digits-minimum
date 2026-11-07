-- Run this first. NEAR Lake, the upstream source, was deprecated on 2026-03-24, so the
-- dataset may have stopped updating or moved to a new source. Do not assume it is current.
SELECT MAX(block_date) AS latest_block_date
FROM `bigquery-public-data.crypto_near_mainnet_us.blocks`
WHERE block_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 400 DAY);
