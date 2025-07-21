/**
 * @swagger
 * tags:
 *   name: Feedbacks
 *   description: API for managing employee feedbacks
 */

/**
 * @swagger
 * /feedbacks:
 *   get:
 *     summary: Get all feedbacks
 *     tags: [Feedbacks]
 *     responses:
 *       200:
 *         description: List of all feedbacks
 */
app.get("/feedbacks", async (req, res) => {
  const result = await pool.query("SELECT * FROM feedbacks");
  res.status(200).json(result.rows);
});

/**
 * @swagger
 * /feedbacks/{id}:
 *   get:
 *     summary: Get feedback by ID
 *     tags: [Feedbacks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Feedback found
 *       404:
 *         description: Feedback not found
 */
app.get("/feedbacks/:id", async (req, res) => {
  const result = await pool.query("SELECT * FROM feedbacks WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Feedback not found" });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /feedbacks:
 *   post:
 *     summary: Create a new feedback
 *     tags: [Feedbacks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [from_employee, to_employee, message]
 *             properties:
 *               from_employee:
 *                 type: integer
 *               to_employee:
 *                 type: integer
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feedback created
 */
app.post("/feedbacks", async (req, res) => {
  const { from_employee, to_employee, message } = req.body;
  const result = await pool.query(
    `INSERT INTO feedbacks (from_employee, to_employee, message)
     VALUES ($1, $2, $3) RETURNING *`,
    [from_employee, to_employee, message]
  );
  res.status(201).json(result.rows[0]);
});

/**
 * @swagger
 * /feedbacks/{id}:
 *   put:
 *     summary: Update feedback by ID
 *     tags: [Feedbacks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from_employee:
 *                 type: integer
 *               to_employee:
 *                 type: integer
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback updated
 *       404:
 *         description: Feedback not found
 */
app.put("/feedbacks/:id", async (req, res) => {
  const { from_employee, to_employee, message } = req.body;
  const result = await pool.query(
    `UPDATE feedbacks SET from_employee = $1, to_employee = $2, message = $3
     WHERE id = $4 RETURNING *`,
    [from_employee, to_employee, message, req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Feedback not found" });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /feedbacks/{id}:
 *   delete:
 *     summary: Delete feedback by ID
 *     tags: [Feedbacks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Feedback deleted
 *       404:
 *         description: Feedback not found
 */
app.delete("/feedbacks/:id", async (req, res) => {
  const result = await pool.query("DELETE FROM feedbacks WHERE id = $1 RETURNING *", [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: "Feedback not found" });
  res.json({ message: "Feedback deleted successfully" });
});
