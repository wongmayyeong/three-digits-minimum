-- Monthly cohorts of NEW signers and how many return in later months. Separates one-time farm
-- accounts from accounts that stay.
--
-- "New" means: first signs a transaction inside [@start_date, @end_date] AND signed nothing in the
-- lookback period [@lookback_start, @start_date). Without the lookback, an account created in 2022
-- that first appears in the window would be miscounted as new. Set @lookback_start to the earliest
-- date you can afford to scan (the full history from mainnet genesis, 2020-04-22, is the strict
-- definition); report the lookback you used, because a shorter one overstates "new".
--
-- Right edge: a cohort that started near @end_date cannot show retention for months that have not
-- happened yet. Rows are only returned for months_after values that are fully observable, and
-- observable_months says how far each cohort can be followed.
--
-- Long date ranges scan more data (you pay normal BigQuery costs); always filter on block_date.
WITH monthly AS (
  SELECT DISTINCT signer_account_id, DATE_TRUNC(block_date, MONTH) AS month
  FROM `bigquery-public-data.crypto_near_mainnet_us.transactions`
  WHERE block_date BETWEEN @start_date AND @end_date
),
seen_before AS (
  SELECT DISTINCT signer_account_id
  FROM `bigquery-public-data.crypto_near_mainnet_us.transactions`
  WHERE block_date >= @lookback_start AND block_date < @start_date
),
first_seen AS (
  SELECT m.signer_account_id, MIN(m.month) AS cohort
  FROM monthly m
  LEFT JOIN seen_before b USING (signer_account_id)
  WHERE b.signer_account_id IS NULL
  GROUP BY m.signer_account_id
)
SELECT
  f.cohort,
  DATE_DIFF(m.month, f.cohort, MONTH) AS months_after,
  DATE_DIFF(DATE_TRUNC(@end_date, MONTH), f.cohort, MONTH) AS observable_months,
  COUNT(*) AS signers
FROM monthly m
JOIN first_seen f USING (signer_account_id)
WHERE DATE_DIFF(m.month, f.cohort, MONTH) <= DATE_DIFF(DATE_TRUNC(@end_date, MONTH), f.cohort, MONTH)
GROUP BY f.cohort, months_after, observable_months
ORDER BY f.cohort, months_after;
