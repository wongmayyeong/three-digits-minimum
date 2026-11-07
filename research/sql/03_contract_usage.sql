-- Most-called contracts per month. Shows how concentrated base-layer activity is,
-- which helps separate real use from a few high-volume apps.
SELECT
  DATE_TRUNC(block_date, MONTH) AS month,
  receipt_receiver_account_id AS contract,
  COUNT(*) AS function_calls,
  COUNT(DISTINCT receipt_predecessor_account_id) AS distinct_callers
FROM `bigquery-public-data.crypto_near_mainnet_us.receipt_actions`
WHERE block_date BETWEEN @start_date AND @end_date
  AND action_kind = 'FUNCTION_CALL'
GROUP BY month, contract
QUALIFY ROW_NUMBER() OVER (PARTITION BY month ORDER BY function_calls DESC) <= 25
ORDER BY month, function_calls DESC;
