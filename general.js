/**
 * @swagger
 * /departments/{id}/employees:
 *   get:
 *     summary: Get employees by department ID
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department ID
 *     responses:
 *       200:
 *         description: List of employees in the department
 */
app.get("/departments/:id/employees", async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    "SELECT * FROM employees WHERE department_id = $1",
    [id]
  );
  res.json(result.rows);
});

/**
 * @swagger
 * /employees/{id}/leave-balances:
 *   get:
 *     summary: Get leave balances for an employee
 *     tags: [Leave Balances]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Leave balance data
 */
app.get("/employees/:id/leave-balances", async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    "SELECT * FROM leave_balances WHERE employee_id = $1",
    [id]
  );
  res.json(result.rows);
});


/**
 * @swagger
 * /employees/{id}/attendance:
 *   get:
 *     summary: Get attendance logs for an employee within a date range
 *     tags: [Attendance Logs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Attendance logs
 */
app.get("/employees/:id/attendance", async (req, res) => {
  const { id } = req.params;
  const { start, end } = req.query;
  const result = await pool.query(
    "SELECT * FROM attendance_logs WHERE employee_id = $1 AND date BETWEEN $2 AND $3",
    [id, start, end]
  );
  res.json(result.rows);
});

/**
 * @swagger
 * /employees/{id}/leaves:
 *   get:
 *     summary: Get all leaves taken by an employee
 *     tags: [Leaves]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: List of leaves
 */
app.get("/employees/:id/leaves", async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    "SELECT * FROM leaves WHERE employee_id = $1",
    [id]
  );
  res.json(result.rows);
});

/**
 * @swagger
 * /employees/{id}/feedbacks:
 *   get:
 *     summary: Get feedback given and received by an employee
 *     tags: [Feedbacks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Feedback data
 */
app.get("/employees/:id/feedbacks", async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    `SELECT * FROM feedbacks WHERE from_employee = $1 OR to_employee = $1`,
    [id]
  );
  res.json(result.rows);
});

/**
 * @swagger
 * /employees/{id}/timesheets:
 *   get:
 *     summary: Get timesheets by employee
 *     tags: [Timesheets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Timesheet entries
 */
app.get("/employees/:id/timesheets", async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    "SELECT * FROM timesheets WHERE employee_id = $1",
    [id]
  );
  res.json(result.rows);
});


/**
 * @swagger
 * /attendance/missing/{date}:
 *   get:
 *     summary: Get employees without attendance log on a specific date
 *     tags: [Attendance Logs]
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check attendance
 *     responses:
 *       200:
 *         description: List of absent employees
 */
app.get("/attendance/missing/:date", async (req, res) => {
  const { date } = req.params;
  const result = await pool.query(`
    SELECT * FROM employees WHERE id NOT IN (
      SELECT employee_id FROM attendance_logs WHERE date = $1
    )
  `, [date]);
  res.json(result.rows);
});
