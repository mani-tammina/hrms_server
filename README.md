🧑‍💼 Advanced HRMS API
This is a simple, full-featured HRMS (Human Resource Management System) API, built using Node.js, Express, PostgreSQL, and documented via Swagger.
It includes modules for:

✅ Employee Management

🗓️ Leave Management

⏱️ Timesheets

📅 Attendance Tracking

🧑‍💼 Manager Approvals

📊 Project & Task Assignments

🚀 Getting Started
Prerequisites
Node.js >= 16

PostgreSQL >= 13

npm (or yarn)

Optional: Swagger UI, Postman, or Talend API Tester

📦 Installation
bash
Copy
Edit
[git clone https://github.com/your-username/hrms-api.git](https://github.com/mani-tammina/hrms_server.git)
cd hrms-api
npm install
⚙️ Configuration
Update your PostgreSQL connection in the code:

js
Copy
Edit
const pool = new Pool({
  user: 'your_db_user',
  host: 'localhost',
  database: 'your_db_name',
  password: 'your_db_password',
  port: 5432
});
🔧 Running the Project
bash
Copy
Edit
node app.js
App will run by default on:

arduino
Copy
Edit
http://localhost:3000
Swagger UI (API Docs):

bash
Copy
Edit
http://localhost:3000/api-docs
📁 API Modules
🔹 Employees
GET /employees – List all employees

GET /employees/:id – Get employee by ID

POST /employees – Create employee

PUT /employees/:id – Update employee

DELETE /employees/:id – Delete employee

🔹 Departments, Roles, Locations, etc.
All CRUD endpoints for reference tables like departments, roles, locations, etc.

🔹 Leaves
GET /leave/policies – View leave policies

GET /leave/balance/:employeeId – Check balance

POST /leave/apply – Apply for leave

GET /leave/requests/:employeeId – List leave requests

DELETE /leave/cancel/:leaveId – Cancel leave

GET /leave/team-requests – Manager views

PUT /leave/approve/:leaveId – Approve

PUT /leave/reject/:leaveId – Reject

🔹 Timesheets
POST /timesheets/entry – Add timesheet

PUT /timesheets/update/:entryId – Update entry

GET /timesheets/week/:employeeId?start=YYYY-MM-DD

GET /timesheets/day/:employeeId?date=YYYY-MM-DD

GET /projects/assigned/:employeeId

GET /projects/:projectId/tasks

🔹 Attendance
POST /attendance/mark – Mark check-in/out

GET /attendance/logs/:employeeId?date=YYYY-MM-DD

GET /attendance/monthly/:employeeId?month=YYYY-MM

GET /attendance/status/:employeeId – Clock-in status

🧪 Testing APIs
Use:

Swagger UI → /api-docs

Postman Collection (optional)

Talend API Tester

📚 Tech Stack
Node.js + Express

PostgreSQL

Swagger (OpenAPI Spec)

Optional: React Native / Flutter frontend, Docker

📌 Future Scope
JWT Auth Integration

Role-based access

Performance reports

Barcode scanning

AI-based compliance alerts

🤝 Contributing
Want to improve this HRMS system? Contributions are welcome!
Just fork, commit and raise a PR 🚀
