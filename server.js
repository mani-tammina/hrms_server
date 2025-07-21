require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const app = express();

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Swagger definition
 */
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "HRMS API",
      version: "1.0.0",
      description: "API for HRMS system with employees, departments, payroll, etc.",
    },
  },
  apis: ["./server.js"], // Point to this file itself
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * 🧱 Table Setup
 */
async function setupTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        doj DATE,
        department_id INTEGER REFERENCES departments(id),
        designation VARCHAR(100),
        basic_salary NUMERIC,
        pf_applicable BOOLEAN DEFAULT true,
        esi_applicable BOOLEAN DEFAULT true,
        pan_number VARCHAR(20),
        aadhaar_number VARCHAR(20),
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS attendance_logs (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER REFERENCES employees(id),
      date DATE,
      check_in TIME,
      check_out TIME,
      status VARCHAR(20)
    );

    CREATE TABLE IF NOT EXISTS leave_policies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      days_per_year INTEGER,
      carry_forward BOOLEAN DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS leaves (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER REFERENCES employees(id),
      type VARCHAR(50),
      start_date DATE,
      end_date DATE,
      status VARCHAR(20) DEFAULT 'Pending',
      applied_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_balances (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER REFERENCES employees(id),
      leave_type VARCHAR(50),
      balance NUMERIC
    );

    CREATE TABLE IF NOT EXISTS feedbacks (
      id SERIAL PRIMARY KEY,
      from_employee INTEGER REFERENCES employees(id),
      to_employee INTEGER REFERENCES employees(id),
      message TEXT,
      submitted_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      client VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS timesheets (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER REFERENCES employees(id),
      project_id INTEGER REFERENCES projects(id),
      log_date DATE,
      hours NUMERIC,
      notes TEXT
    );
    `);
    console.log("✅ Tables ensured");
  } finally {
    client.release();
  }
}


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

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: API for managing Employees
 */

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

/**
 * @swagger
 * tags:
 *   name: Feedbacks
 *   description: API for managing employee feedbacks
 */

/**
 * @swagger
 * /feedbacks:
 *   get:
 *     summary: Get all feedbacks
 *     tags: [Feedbacks]
 *     responses:
 *       200:
 *         description: List of all feedbacks
 */
app.get("/feedbacks", async (req, res) => {
  const result = await pool.query("SELECT * FROM feedbacks");
  res.status(200).json(result.rows);
});

/**
 * @swagger
 * /feedbacks/{id}:
 *   get:
 *     summary: Get feedback by ID
 *     tags: [Feedbacks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Feedback found
 *       404:
 *         description: Feedback not found
 */
app.get("/feedbacks/:id", async (req, res) => {
  const result = await pool.query("SELECT * FROM feedbacks WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Feedback not found" });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /feedbacks:
 *   post:
 *     summary: Create a new feedback
 *     tags: [Feedbacks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [from_employee, to_employee, message]
 *             properties:
 *               from_employee:
 *                 type: integer
 *               to_employee:
 *                 type: integer
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feedback created
 */
app.post("/feedbacks", async (req, res) => {
  const { from_employee, to_employee, message } = req.body;
  const result = await pool.query(
    `INSERT INTO feedbacks (from_employee, to_employee, message)
     VALUES ($1, $2, $3) RETURNING *`,
    [from_employee, to_employee, message]
  );
  res.status(201).json(result.rows[0]);
});

/**
 * @swagger
 * /feedbacks/{id}:
 *   put:
 *     summary: Update feedback by ID
 *     tags: [Feedbacks]
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
 *               from_employee:
 *                 type: integer
 *               to_employee:
 *                 type: integer
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback updated
 *       404:
 *         description: Feedback not found
 */
app.put("/feedbacks/:id", async (req, res) => {
  const { from_employee, to_employee, message } = req.body;
  const result = await pool.query(
    `UPDATE feedbacks SET from_employee = $1, to_employee = $2, message = $3
     WHERE id = $4 RETURNING *`,
    [from_employee, to_employee, message, req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Feedback not found" });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /feedbacks/{id}:
 *   delete:
 *     summary: Delete feedback by ID
 *     tags: [Feedbacks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Feedback deleted
 *       404:
 *         description: Feedback not found
 */
app.delete("/feedbacks/:id", async (req, res) => {
  const result = await pool.query("DELETE FROM feedbacks WHERE id = $1 RETURNING *", [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: "Feedback not found" });
  res.json({ message: "Feedback deleted successfully" });
});

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


// Start

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

// End

app.get("/", (req, res) => {
  res.send("HRMS API is running. Visit /api-docs");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await setupTables();
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
