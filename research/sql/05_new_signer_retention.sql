-- Monthly signer cohorts and how many return in later months. Separates one-time farm
-- accounts from people who stay. Long date ranges scan more data, so keep the range short.
WITH monthly AS (
  SELECT DISTINCT signer_account_id, DATE_TRUNC(block_date, MONTH) AS month
  FROM `bigquery-public-data.crypto_near_mainnet_us.transactions`
  WHERE block_date BETWEEN @start_date AND @end_date
),
first_seen AS (
  SELECT signer_account_id, MIN(month) AS cohort FROM monthly GROUP BY signer_account_id
)
SELECT
  f.cohort,
  DATE_DIFF(m.month, f.cohort, MONTH) AS months_after,
  COUNT(*) AS signers
FROM monthly m
JOIN first_seen f USING (signer_account_id)
GROUP BY f.cohort, months_after
ORDER BY f.cohort, months_after;
