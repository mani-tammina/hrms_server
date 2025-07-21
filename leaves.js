/**
 * @swagger
 * tags:
 *   name: Leaves
 *   description: API for managing employee leaves
 */

/**
 * @swagger
 * /leaves:
 *   get:
 *     summary: Get all leave records
 *     tags: [Leaves]
 *     responses:
 *       200:
 *         description: List of leave records
 */
app.get("/leaves", async (req, res) => {
  const result = await pool.query("SELECT * FROM leaves");
  res.status(200).json(result.rows);
});

/**
 * @swagger
 * /leaves/{id}:
 *   get:
 *     summary: Get a leave record by ID
 *     tags: [Leaves]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave record found
 *       404:
 *         description: Leave record not found
 */
app.get("/leaves/:id", async (req, res) => {
  const result = await pool.query("SELECT * FROM leaves WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Leave not found" });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /leaves:
 *   post:
 *     summary: Apply for a leave
 *     tags: [Leaves]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_id, type, start_date, end_date]
 *             properties:
 *               employee_id:
 *                 type: integer
 *               type:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Leave applied successfully
 */
app.post("/leaves", async (req, res) => {
  const { employee_id, type, start_date, end_date, status } = req.body;
  const result = await pool.query(
    `INSERT INTO leaves (employee_id, type, start_date, end_date, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [employee_id, type, start_date, end_date, status || 'Pending']
  );
  res.status(201).json(result.rows[0]);
});

/**
 * @swagger
 * /leaves/{id}:
 *   put:
 *     summary: Update a leave record
 *     tags: [Leaves]
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
 *               type:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Leave updated
 *       404:
 *         description: Leave not found
 */
app.put("/leaves/:id", async (req, res) => {
  const { type, start_date, end_date, status } = req.body;
  const result = await pool.query(
    `UPDATE leaves
     SET type = $1, start_date = $2, end_date = $3, status = $4
     WHERE id = $5 RETURNING *`,
    [type, start_date, end_date, status, req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Leave not found" });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /leaves/{id}:
 *   delete:
 *     summary: Delete a leave record
 *     tags: [Leaves]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave deleted
 *       404:
 *         description: Leave not found
 */
app.delete("/leaves/:id", async (req, res) => {
  const result = await pool.query("DELETE FROM leaves WHERE id = $1 RETURNING *", [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: "Leave not found" });
  res.json({ message: "Leave deleted successfully" });
});
