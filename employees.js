
/**
 * @swagger
 * /employees:
 *   get:
 *     summary: Get all employees
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: List of employees
 */
app.get("/employees", async (req, res) => {
  const result = await pool.query("SELECT * FROM employees");
  res.json(result.rows);
});

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     summary: Get Employee by ID
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee found
 *       404:
 *         description: Employee not found
 */
app.get("/employees/:id", async (req, res) => {
  const result = await pool.query("SELECT * FROM employees WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Employee not found" });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               doj:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Employee created
 */
app.post("/employees", async (req, res) => {
  const { name, email, phone, doj } = req.body;
  const result = await pool.query(
    "INSERT INTO employees (name, email, phone, doj) VALUES ($1, $2, $3, $4) RETURNING *",
    [name, email, phone, doj]
  );
  res.status(201).json(result.rows[0]);
});

/**
 * @swagger
 * /employees/{id}:
 *   put:
 *     summary: Update employee
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee updated
 */
app.put("/employees/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;
  const result = await pool.query(
    "UPDATE employees SET name = $1, phone = $2 WHERE id = $3 RETURNING *",
    [name, phone, id]
  );
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     summary: Delete employee
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleted successfully
 */
app.delete("/employees/:id", async (req, res) => {
  await pool.query("DELETE FROM employees WHERE id = $1", [req.params.id]);
  res.status(204).send();
});