/**
 * @swagger
 * tags:
 *   name: LeaveBalances
 *   description: API for managing employee leave balances
 */

/**
 * @swagger
 * /leave_balances:
 *   get:
 *     summary: Get all leave balances
 *     tags: [LeaveBalances]
 *     responses:
 *       200:
 *         description: List of leave balances
 */
app.get("/leave_balances", async (req, res) => {
  const result = await pool.query("SELECT * FROM leave_balances");
  res.status(200).json(result.rows);
});

/**
 * @swagger
 * /leave_balances/{id}:
 *   get:
 *     summary: Get leave balance by ID
 *     tags: [LeaveBalances]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave balance found
 *       404:
 *         description: Leave balance not found
 */
app.get("/leave_balances/:id", async (req, res) => {
  const result = await pool.query("SELECT * FROM leave_balances WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Leave balance not found" });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /leave_balances:
 *   post:
 *     summary: Add new leave balance
 *     tags: [LeaveBalances]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_id, leave_type, balance]
 *             properties:
 *               employee_id:
 *                 type: integer
 *               leave_type:
 *                 type: string
 *               balance:
 *                 type: number
 *     responses:
 *       201:
 *         description: Leave balance created
 */
app.post("/leave_balances", async (req, res) => {
  const { employee_id, leave_type, balance } = req.body;
  const result = await pool.query(
    `INSERT INTO leave_balances (employee_id, leave_type, balance)
     VALUES ($1, $2, $3) RETURNING *`,
    [employee_id, leave_type, balance]
  );
  res.status(201).json(result.rows[0]);
});

/**
 * @swagger
 * /leave_balances/{id}:
 *   put:
 *     summary: Update a leave balance
 *     tags: [LeaveBalances]
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
 *               leave_type:
 *                 type: string
 *               balance:
 *                 type: number
 *     responses:
 *       200:
 *         description: Leave balance updated
 *       404:
 *         description: Leave balance not found
 */
app.put("/leave_balances/:id", async (req, res) => {
  const { leave_type, balance } = req.body;
  const result = await pool.query(
    `UPDATE leave_balances
     SET leave_type = $1, balance = $2
     WHERE id = $3 RETURNING *`,
    [leave_type, balance, req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Leave balance not found" });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /leave_balances/{id}:
 *   delete:
 *     summary: Delete a leave balance
 *     tags: [LeaveBalances]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave balance deleted
 *       404:
 *         description: Leave balance not found
 */
app.delete("/leave_balances/:id", async (req, res) => {
  const result = await pool.query("DELETE FROM leave_balances WHERE id = $1 RETURNING *", [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: "Leave balance not found" });
  res.json({ message: "Leave balance deleted successfully" });
});
