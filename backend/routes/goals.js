const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, target_amount AS target, current_amount AS current, deadline
       FROM goals WHERE user_id = $1 ORDER BY created_at ASC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("List goals error:", err);
    res.status(500).json({ error: "Gagal mengambil data target tabungan." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, target, deadline } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: "Nama target wajib diisi." });
    const tgt = Number(target);
    if (!tgt || tgt <= 0) return res.status(400).json({ error: "Nominal target harus lebih dari 0." });
    if (!deadline) return res.status(400).json({ error: "Tenggat wajib diisi." });

    const result = await pool.query(
      `INSERT INTO goals (user_id, name, target_amount, current_amount, deadline)
       VALUES ($1, $2, $3, 0, $4)
       RETURNING id, name, target_amount AS target, current_amount AS current, deadline`,
      [req.userId, name.trim(), tgt, deadline]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create goal error:", err);
    res.status(500).json({ error: "Gagal membuat target tabungan." });
  }
});

router.post("/:id/contribute", async (req, res) => {
  try {
    const amt = Number((req.body || {}).amount);
    if (!amt || amt <= 0) return res.status(400).json({ error: "Nominal harus lebih dari 0." });

    const result = await pool.query(
      `UPDATE goals SET current_amount = current_amount + $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, name, target_amount AS target, current_amount AS current, deadline`,
      [amt, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Target tidak ditemukan." });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Contribute goal error:", err);
    res.status(500).json({ error: "Gagal menambah dana target." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Target tidak ditemukan." });
    res.status(204).send();
  } catch (err) {
    console.error("Delete goal error:", err);
    res.status(500).json({ error: "Gagal menghapus target." });
  }
});

module.exports = router;
