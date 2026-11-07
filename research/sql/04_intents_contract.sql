-- Daily activity on the Intents contract. If many swaps come from few predecessors,
-- that supports the explanation that Intents volume does not show up as many signers.
SELECT
  block_date,
  COUNT(*) AS function_calls,
  COUNT(DISTINCT receipt_predecessor_account_id) AS distinct_callers
FROM `bigquery-public-data.crypto_near_mainnet_us.receipt_actions`
WHERE block_date BETWEEN @start_date AND @end_date
  AND action_kind = 'FUNCTION_CALL'
  AND receipt_receiver_account_id = 'intents.near'
GROUP BY block_date
ORDER BY block_date;
