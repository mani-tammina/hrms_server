/**
 * @swagger
 * tags:
 *   name: AttendanceLogs
 *   description: API for tracking employee attendance logs
 */

/**
 * @swagger
 * /attendance_logs:
 *   get:
 *     summary: Get all attendance logs
 *     tags: [AttendanceLogs]
 *     responses:
 *       200:
 *         description: List of attendance logs
 */
app.get("/attendance_logs", async (req, res) => {
  const result = await pool.query("SELECT * FROM attendance_logs");
  res.status(200).json(result.rows);
});

/**
 * @swagger
 * /attendance_logs/{id}:
 *   get:
 *     summary: Get attendance log by ID
 *     tags: [AttendanceLogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Attendance log found
 *       404:
 *         description: Attendance log not found
 */
app.get("/attendance_logs/:id", async (req, res) => {
  const result = await pool.query("SELECT * FROM attendance_logs WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Attendance log not found" });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /attendance_logs:
 *   post:
 *     summary: Add new attendance log
 *     tags: [AttendanceLogs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_id, date, check_in]
 *             properties:
 *               employee_id:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *               check_in:
 *                 type: string
 *                 format: date-time
 *               check_out:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Attendance log created
 */
app.post("/attendance_logs", async (req, res) => {
  const { employee_id, date, check_in, check_out } = req.body;
  const result = await pool.query(
    `INSERT INTO attendance_logs (employee_id, date, check_in, check_out)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [employee_id, date, check_in, check_out]
  );
  res.status(201).json(result.rows[0]);
});

/**
 * @swagger
 * /attendance_logs/{id}:
 *   put:
 *     summary: Update an attendance log
 *     tags: [AttendanceLogs]
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
 *               check_in:
 *                 type: string
 *                 format: date-time
 *               check_out:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Attendance log updated
 *       404:
 *         description: Attendance log not found
 */
app.put("/attendance_logs/:id", async (req, res) => {
  const { check_in, check_out } = req.body;
  const result = await pool.query(
    `UPDATE attendance_logs
     SET check_in = $1, check_out = $2
     WHERE id = $3 RETURNING *`,
    [check_in, check_out, req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Attendance log not found" });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /attendance_logs/{id}:
 *   delete:
 *     summary: Delete an attendance log
 *     tags: [AttendanceLogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Attendance log deleted
 *       404:
 *         description: Attendance log not found
 */
app.delete("/attendance_logs/:id", async (req, res) => {
  const result = await pool.query("DELETE FROM attendance_logs WHERE id = $1 RETURNING *", [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: "Attendance log not found" });
  res.json({ message: "Attendance log deleted successfully" });
});
