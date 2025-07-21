/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: API for managing company projects
 */

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: List of projects
 */
app.get("/projects", async (req, res) => {
  const result = await pool.query("SELECT * FROM projects");
  res.status(200).json(result.rows);
});

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project found
 *       404:
 *         description: Project not found
 */
app.get("/projects/:id", async (req, res) => {
  const result = await pool.query("SELECT * FROM projects WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Project not found" });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, client]
 *             properties:
 *               name:
 *                 type: string
 *               client:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created
 */
app.post("/projects", async (req, res) => {
  const { name, client } = req.body;
  const result = await pool.query(
    "INSERT INTO projects (name, client) VALUES ($1, $2) RETURNING *",
    [name, client]
  );
  res.status(201).json(result.rows[0]);
});

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
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
 *               client:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated
 *       404:
 *         description: Project not found
 */
app.put("/projects/:id", async (req, res) => {
  const { name, client } = req.body;
  const result = await pool.query(
    "UPDATE projects SET name = $1, client = $2 WHERE id = $3 RETURNING *",
    [name, client, req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Project not found" });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project deleted
 *       404:
 *         description: Project not found
 */
app.delete("/projects/:id", async (req, res) => {
  const result = await pool.query("DELETE FROM projects WHERE id = $1 RETURNING *", [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: "Project not found" });
  res.json({ message: "Project deleted successfully" });
});
