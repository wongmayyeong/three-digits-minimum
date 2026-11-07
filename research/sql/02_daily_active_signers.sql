-- Daily distinct signers and transactions. Compare with NearBlocks active_accounts.
SELECT
  block_date,
  COUNT(DISTINCT signer_account_id) AS active_signers,
  COUNT(*) AS transactions
FROM `bigquery-public-data.crypto_near_mainnet_us.transactions`
WHERE block_date BETWEEN @start_date AND @end_date
GROUP BY block_date
ORDER BY block_date;
