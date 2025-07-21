/**
 * @swagger
 * tags:
 *   name: LeavePolicies
 *   description: API for managing leave policies
 */

/**
 * @swagger
 * /leave_policies:
 *   get:
 *     summary: Get all leave policies
 *     tags: [LeavePolicies]
 *     responses:
 *       200:
 *         description: List of leave policies
 */
app.get("/leave_policies", async (req, res) => {
  const result = await pool.query("SELECT * FROM leave_policies");
  res.status(200).json(result.rows);
});

/**
 * @swagger
 * /leave_policies/{id}:
 *   get:
 *     summary: Get leave policy by ID
 *     tags: [LeavePolicies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave policy found
 *       404:
 *         description: Leave policy not found
 */
app.get("/leave_policies/:id", async (req, res) => {
  const result = await pool.query("SELECT * FROM leave_policies WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Leave policy not found" });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /leave_policies:
 *   post:
 *     summary: Create a new leave policy
 *     tags: [LeavePolicies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [policy_name, max_leaves]
 *             properties:
 *               policy_name:
 *                 type: string
 *               description:
 *                 type: string
 *               max_leaves:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Leave policy created
 */
app.post("/leave_policies", async (req, res) => {
  const { policy_name, description, max_leaves } = req.body;
  const result = await pool.query(
    `INSERT INTO leave_policies (policy_name, description, max_leaves)
     VALUES ($1, $2, $3) RETURNING *`,
    [policy_name, description, max_leaves]
  );
  res.status(201).json(result.rows[0]);
});

/**
 * @swagger
 * /leave_policies/{id}:
 *   put:
 *     summary: Update a leave policy
 *     tags: [LeavePolicies]
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
 *               policy_name:
 *                 type: string
 *               description:
 *                 type: string
 *               max_leaves:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Leave policy updated
 *       404:
 *         description: Leave policy not found
 */
app.put("/leave_policies/:id", async (req, res) => {
  const { policy_name, description, max_leaves } = req.body;
  const result = await pool.query(
    `UPDATE leave_policies
     SET policy_name = $1, description = $2, max_leaves = $3
     WHERE id = $4 RETURNING *`,
    [policy_name, description, max_leaves, req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Leave policy not found" });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /leave_policies/{id}:
 *   delete:
 *     summary: Delete a leave policy
 *     tags: [LeavePolicies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave policy deleted
 *       404:
 *         description: Leave policy not found
 */
app.delete("/leave_policies/:id", async (req, res) => {
  const result = await pool.query("DELETE FROM leave_policies WHERE id = $1 RETURNING *", [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: "Leave policy not found" });
  res.json({ message: "Leave policy deleted successfully" });
});
