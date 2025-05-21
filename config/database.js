const mysql = require("mysql2/promise");

module.exports = mysql.createPool({
	host: "",
	port: 0,
	user: "",
	password: "",
	database: ""
});

