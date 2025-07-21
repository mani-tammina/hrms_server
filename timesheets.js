/**
 * @swagger
 * tags:
 *   name: Timesheets
 *   description: API for tracking employee timesheets
 */

/**
 * @swagger
 * /timesheets:
 *   get:
 *     summary: Get all timesheet entries
 *     tags: [Timesheets]
 *     responses:
 *       200:
 *         description: List of timesheets
 */
app.get("/timesheets", async (req, res) => {
  const result = await pool.query("SELECT * FROM timesheets");
  res.status(200).json(result.rows);
});

/**
 * @swagger
 * /timesheets/{id}:
 *   get:
 *     summary: Get a timesheet by ID
 *     tags: [Timesheets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Timesheet found
 *       404:
 *         description: Timesheet not found
 */
app.get("/timesheets/:id", async (req, res) => {
  const result = await pool.query("SELECT * FROM timesheets WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Timesheet not found" });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /timesheets:
 *   post:
 *     summary: Create a new timesheet entry
 *     tags: [Timesheets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_id, project_id, log_date, hours]
 *             properties:
 *               employee_id:
 *                 type: integer
 *               project_id:
 *                 type: integer
 *               log_date:
 *                 type: string
 *                 format: date
 *               hours:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Timesheet created
 */
app.post("/timesheets", async (req, res) => {
  const { employee_id, project_id, log_date, hours, notes } = req.body;
  const result = await pool.query(
    "INSERT INTO timesheets (employee_id, project_id, log_date, hours, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [employee_id, project_id, log_date, hours, notes]
  );
  res.status(201).json(result.rows[0]);
});

/**
 * @swagger
 * /timesheets/{id}:
 *   put:
 *     summary: Update a timesheet entry
 *     tags: [Timesheets]
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
 *               employee_id:
 *                 type: integer
 *               project_id:
 *                 type: integer
 *               log_date:
 *                 type: string
 *                 format: date
 *               hours:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Timesheet updated
 *       404:
 *         description: Timesheet not found
 */
app.put("/timesheets/:id", async (req, res) => {
  const { employee_id, project_id, log_date, hours, notes } = req.body;
  const result = await pool.query(
    "UPDATE timesheets SET employee_id = $1, project_id = $2, log_date = $3, hours = $4, notes = $5 WHERE id = $6 RETURNING *",
    [employee_id, project_id, log_date, hours, notes, req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Timesheet not found" });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /timesheets/{id}:
 *   delete:
 *     summary: Delete a timesheet entry
 *     tags: [Timesheets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Timesheet deleted
 *       404:
 *         description: Timesheet not found
 */
app.delete("/timesheets/:id", async (req, res) => {
  const result = await pool.query("DELETE FROM timesheets WHERE id = $1 RETURNING *", [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: "Timesheet not found" });
  res.json({ message: "Timesheet deleted successfully" });
});
