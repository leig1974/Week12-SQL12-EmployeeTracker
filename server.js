
const mysql = require("mysql2");
const inquirer = require("inquirer");
const cTable = require("console.table");
// const db = require("./db/connection");
// let managers =[];
// let roles = [];
// let employees =[];

//connection information for sql database
const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "Dtrus2022!!!!",
  database: "employee_tracker"
});


//connect to mysql server and database
connection.connect(function (err) {
  if (err) throw err;
  console.log("SQL connected");

  //add start function here
  start();
});

//basic functions 
function start() {
  inquirer
    .prompt([
      {
        type: "list",
        name: "start",
        message: "Information available on employees, departments, employee roles.What would you like to do?",
        choices: ["View All Departments", "View All Roles", "View All Employees", "Add  Departments", "Add Role", "Add Employees", "Update Employees", "Exit"]
      }

    ]).then((res) => {
      switch (res.start) {
        case "View All Departments":
          viewAllDepartments();
          break;
        case "View All Roles":
          viewAllRoles();
          break;
        case "View All Employees":
          viewAllEmployees();
          break;
        case "Add Departments":
          addDepartments();
          break;
        case "Add Role":
          addRoles();
          break;
        case "Add Employees":
          addEmployees();
          break;
        case "Update Employees":
          updateEmployeeRole();
          break;
        case "Exit":
          console.log("All done");
          break;
        default:
          console.log("Invalid choice");
      }
    });
}

//showing employee data, including employee ids, first names, last names, 
//job titles, departments, salaries, and managers that the employees report to


//CREATE TABLE employee (
//id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
// first_name VARCHAR(30),
// last_name VARCHAR(30),

// role_id INT NOT NULL,
// FOREIGN KEY (role_id)
// REFERENCES role(id),

// manager_id INT NOT NULL,
// FOREIGN KEY (manager_id)
// REFERENCES employee(id)

function viewAllEmployees() {
  const query = `
    SELECT
      e.id AS 'Employee ID',
      e.first_name AS 'First Name',
      e.last_name AS 'Last Name',
      r.title AS 'Job Title',
      r.salary AS 'Salary',
      CONCAT(m.first_name, ' ', m.last_name) AS 'Manager',
      d.name AS 'Department'
    FROM employee e
    LEFT JOIN employee m ON e.manager_id = m.id
    LEFT JOIN role r ON e.role_id = r.id
    LEFT JOIN department d ON r.department_id = d.id
  `;
  connection.query(query, function (err, results) {
    if (err) throw err;
    console.table(results);
    start();
  });
}

function viewAllDepartments() {
  // get departments from database

  connection.query('SELECT * FROM department', function (err, results) {
    if (err) throw err;
    console.table(results);
    start();
  })
}

// THEN I am presented with the job title, role id, 
// the department that role belongs to, and the salary for that role

// CREATE TABLE role (
// id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
// title VARCHAR(30),
// salary DECIMAL,
// department_id INT NOT NULL,
// FOREIGN KEY (department_id)
// REFERENCES department(id)

function viewAllRoles() {
  const query = `
    SELECT r.id, r.title, r.salary, d.name AS department
    FROM role r
    JOIN department d ON r.department_id = d.id
  `;
  connection.query(query, function (err, results) {
    if (err) {
      console.error(err);
    } else {
      console.table(results);
    }
    start();
  });
}



// Once roles are available, prompt user for which they chose
// inquirer.prompt([
//   {
//     name: "role",
//     type: "rawlist",
//     choices: function() {
//       var choiceArr = [];
//       for (i=0; i<results.length; i++) {
//         choiceArr.push(results[i].title);
//       }
//       return choiceArr;



function addDepartments() {
  inquirer.prompt([
    {
      name: 'department',
      type: 'input',
      message: 'What is name of your department?',
    },

  ]).then(function (answers) {
    connection.query(
      'INSERT INTO department SET ?',
      {
        name: answers.department
      },(err, results) => {
        if (err) throw err;
        console.table(results);
        start();
      })
  })
};

// THEN I am prompted to enter the name, salary, 
// and department for the role and that role is added to the database

//prompt info for role
function addRoles() {
  // Get department names from database
  connection.query('SELECT name FROM department', function (err, results) {
    if (err) {
      console.error(err);
      return;
    }
    // Extract department names from the results
    const departmentNamesArr = results.map(result => result.name);

    // Prompt for role details
    inquirer.prompt([
      {
        name: "title",
        type: "input",
        message: "What is the title of the new role?",
      },
      {
        name: "salary",
        type: "input",
        message: "What is the salary for this role?",
        validate: function (input) {
          return /^\d+$/.test(input) || "Salary must be a positive number";
        }
      },
      {
        name: "department",
        type: "list",
        message: "Which department does this role belong to?",
        choices: departmentNamesArr
      }
    ])
      .then(function (answers) {
        // Get the ID of the chosen department from the database
        connection.query(
          "SELECT id FROM department WHERE name = ?",
          [answers.department],
          function (err, results) {
            if (err) {
              console.error(err);
              return;
            }
            // Insert the new role into the database
            connection.query(
              "INSERT INTO role SET ?",
              {
                title: answers.title,
                salary: answers.salary,
                department_id: results[0].id
              },
              function (err) {
                if (err) throw err;
                console.log("--------------");
                console.log(`New role "${answers.title}" added to department ${answers.department}`);
                console.log("--------------");
                start();
              }
            );
          }
        );
      });
  });
}


//add employee
function addEmployees() {
  // Query for all roles
  connection.query('SELECT * FROM role', function (err, roles) {
    if (err) {
      console.error(err);
      return;
    }

    inquirer
      .prompt([
        {
          name: "firstName",
          type: "input",
          message: "Enter employee first name",
        },
        {
          name: "lastName",
          type: "input",
          message: "Enter employee last name",
        },
        {
          name: "roleId",
          type: "rawlist",
          choices: roles.map(role => ({ name: role.title, value: role.id })),
          message: "Select employee role",
        },
      ])
      .then(function (answers) {
        // Insert new employee into database
        connection.query(
          "INSERT INTO employee SET ?",
          {
            first_name: answers.firstName,
            last_name: answers.lastName,
            role_id: answers.roleId,
          },
          function (err) {
            if (err) {
              console.error(err);
              return;
            }
            console.log("Employee added successfully!");
            start();
          }
        );
      });
  });
}


function updateEmployeeRole() {
  // Query for all roles
  connection.query('SELECT id, first_name, last_name, role_id FROM employee', function (err, results) {
    if (err) {
      console.error(err);
      return;
    }

    const employees = results.map(employee => ({
			name: `${employee.first_name} ${employee.last_name}`,
			value: employee.id,
		}));
		employees.unshift({
			name: 'None',
			value: null,
		});

    inquirer
      .prompt([
        {
					type: 'list',
					name: 'id',
					message: "Which employee's role do you want to update?",
					choices: employees,
        },
        
      ])
      .then(function ({id}) {
        const roleQuery = 'SELECT * FROM role';
				connection.query(roleQuery, function (error, results) {
					if (error) throw error;
					console.log(results);
					const roles = results.map(result => ({
						name: result.title,
						value: result.id,
					}));
          inquirer
          .prompt([
            {
              type: 'list',
              name: 'role_id',
              message: 'Which is the new role for this employee employee?',
              choices: roles,
            },
          ])
          .then(({ role_id }) => {
            const updateQuery = `UPDATE employee SET ? WHERE id = ${id}`;
            connection.query(updateQuery, { role_id }, function (error, results) {
              if (error) throw error;
              console.log("Updated employee's role");
              connection.end();
            });
          });
       });
  });
})}