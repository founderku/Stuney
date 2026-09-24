const { Pool, types } = require("pg");

// Keep DATE columns as plain "YYYY-MM-DD" strings instead of letting node-postgres
// convert them to JS Date objects (which then serialize through the server's local
// timezone and can shift the date by a day). OID 1082 = date.
types.setTypeParser(1082, (val) => val);

// NUMERIC columns come back as strings by default (to avoid float precision loss).
// Our amounts are plain Rupiah integers/decimals well within JS safe-integer range,
// so convert to a real number for a friendlier API response. OID 1700 = numeric.
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});

module.exports = pool;
