const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT monthly_limit AS monthly FROM budgets WHERE user_id = $1",
      [req.userId]
    );
    if (result.rows.length === 0) {
      await pool.query("INSERT INTO budgets (user_id, monthly_limit) VALUES ($1, 0)", [req.userId]);
      return res.json({ monthly: 0 });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get budget error:", err);
    res.status(500).json({ error: "Gagal mengambil data anggaran." });
  }
});

router.put("/", async (req, res) => {
  try {
    const monthly = Number((req.body || {}).monthly);
    if (Number.isNaN(monthly) || monthly < 0) {
      return res.status(400).json({ error: "Nominal anggaran tidak valid." });
    }
    await pool.query(
      `INSERT INTO budgets (user_id, monthly_limit, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (user_id) DO UPDATE SET monthly_limit = $2, updated_at = now()`,
      [req.userId, monthly]
    );
    res.json({ monthly });
  } catch (err) {
    console.error("Update budget error:", err);
    res.status(500).json({ error: "Gagal menyimpan anggaran." });
  }
});

module.exports = router;
