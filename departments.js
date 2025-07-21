/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: API for managing departments
 */

/**
 * @swagger
 * /departments:
 *   get:
 *     summary: Get all departments
 *     tags: [Departments]
 *     responses:
 *       200:
 *         description: List of departments
 */
app.get("/departments", async (req, res) => {
  const result = await pool.query("SELECT * FROM departments");
  res.status(200).json(result.rows);
});

/**
 * @swagger
 * /departments/{id}:
 *   get:
 *     summary: Get department by ID
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Department found
 *       404:
 *         description: Department not found
 */
app.get("/departments/:id", async (req, res) => {
  const result = await pool.query("SELECT * FROM departments WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Department not found" });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /departments:
 *   post:
 *     summary: Create a new department
 *     tags: [Departments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Department created
 */
app.post("/departments", async (req, res) => {
  const { name } = req.body;
  const result = await pool.query(
    "INSERT INTO departments (name) VALUES ($1) RETURNING *",
    [name]
  );
  res.status(201).json(result.rows[0]);
});

/**
 * @swagger
 * /departments/{id}:
 *   put:
 *     summary: Update department
 *     tags: [Departments]
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
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Department updated
 *       404:
 *         description: Department not found
 */
app.put("/departments/:id", async (req, res) => {
  const { name } = req.body;
  const result = await pool.query(
    "UPDATE departments SET name = $1 WHERE id = $2 RETURNING *",
    [name, req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Department not found" });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /departments/{id}:
 *   delete:
 *     summary: Delete a department
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Department deleted
 *       404:
 *         description: Department not found
 */
app.delete("/departments/:id", async (req, res) => {
  const result = await pool.query("DELETE FROM departments WHERE id = $1 RETURNING *", [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: "Department not found" });
  res.json({ message: "Deleted successfully" });
});