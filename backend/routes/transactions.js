const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, type, amount, category_id AS \"catId\", tx_date AS date, note FROM transactions WHERE user_id = $1 ORDER BY tx_date DESC, created_at DESC",
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("List transactions error:", err);
    res.status(500).json({ error: "Gagal mengambil data transaksi." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { type, amount, catId, date, note } = req.body || {};
    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ error: "Tipe transaksi harus income atau expense." });
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) return res.status(400).json({ error: "Nominal harus lebih dari 0." });
    if (!catId) return res.status(400).json({ error: "Kategori wajib diisi." });
    if (!date) return res.status(400).json({ error: "Tanggal wajib diisi." });

    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, amount, category_id, tx_date, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, type, amount, category_id AS "catId", tx_date AS date, note`,
      [req.userId, type, amt, catId, date, (note || "").trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create transaction error:", err);
    res.status(500).json({ error: "Gagal menyimpan transaksi." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Transaksi tidak ditemukan." });
    res.status(204).send();
  } catch (err) {
    console.error("Delete transaction error:", err);
    res.status(500).json({ error: "Gagal menghapus transaksi." });
  }
});

module.exports = router;
