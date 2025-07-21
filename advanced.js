/**
 * @swagger
 * /leave/requests/{employeeId}:
 *   get:
 *     summary: Get all leave requests for employee
 *     tags: [Leaves]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave requests list
 */
app.get("/leave/requests/:employeeId", async (req, res) => {
  const result = await pool.query("SELECT * FROM leaves WHERE employee_id = $1", [req.params.employeeId]);
  res.json(result.rows);
});

/**
 * @swagger
 * /leave/cancel/{leaveId}:
 *   delete:
 *     summary: Cancel a leave request
 *     tags: [Leaves]
 *     parameters:
 *       - in: path
 *         name: leaveId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave request cancelled
 */
app.delete("/leave/cancel/:leaveId", async (req, res) => {
  await pool.query("DELETE FROM leaves WHERE id = $1", [req.params.leaveId]);
  res.sendStatus(200);
});

/**
 * @swagger
 * /leave/approve/{leaveId}:
 *   put:
 *     summary: Approve a leave request
 *     tags: [Leaves]
 *     parameters:
 *       - in: path
 *         name: leaveId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave approved
 */
app.put("/leave/approve/:leaveId", async (req, res) => {
  await pool.query("UPDATE leaves SET status = 'Approved' WHERE id = $1", [req.params.leaveId]);
  res.sendStatus(200);
});

/**
 * @swagger
 * /leave/reject/{leaveId}:
 *   put:
 *     summary: Reject a leave request
 *     tags: [Leaves]
 *     parameters:
 *       - in: path
 *         name: leaveId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave rejected
 */
app.put("/leave/reject/:leaveId", async (req, res) => {
  await pool.query("UPDATE leaves SET status = 'Rejected' WHERE id = $1", [req.params.leaveId]);
  res.sendStatus(200);
});

/**
 * @swagger
 * /timesheets/week/{employeeId}:
 *   get:
 *     summary: Get weekly timesheet entries
 *     tags: [Timesheets]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Weekly timesheet entries fetched
 */
app.get("/timesheets/week/:employeeId", async (req, res) => {
  const { employeeId } = req.params;
  const { start } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM timesheets
       WHERE employee_id = $1 AND log_date BETWEEN $2::date AND ($2::date + interval '6 day')`,
      [employeeId, start]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /timesheets/day/{employeeId}:
 *   get:
 *     summary: Get daily timesheet entry
 *     tags: [Timesheets]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Timesheet entry for the day
 */
app.get("/timesheets/day/:employeeId", async (req, res) => {
  const { employeeId } = req.params;
  const { date } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM timesheets WHERE employee_id = $1 AND log_date = $2`,
      [employeeId, date]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /projects/assigned/{employeeId}:
 *   get:
 *     summary: Get assigned projects for an employee
 *     tags: [Timesheets]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of assigned projects
 */
app.get("/projects/assigned/:employeeId", async (req, res) => {
  const { employeeId } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.* FROM projects p
       JOIN project_assignments pa ON pa.project_id = p.id
       WHERE pa.employee_id = $1`,
      [employeeId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});