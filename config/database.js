const mysql = require("mysql2/promise");

let pool;

function getPool() {
	if(!pool) pool = mysql.createPool({
		host: "",
		port: 0,
		user: "",
		password: "",
		database: ""
	});
	return pool;
}

module.exports = getPool;
