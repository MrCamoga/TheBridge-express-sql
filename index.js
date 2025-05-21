const mysql = require("mysql2/promise");
const express = require("express");

const PORT = 3000;

const app = express();
app.use(express.json());

const db = require("./config/database.js");

app.use("/users", require("./routes/users"));
app.use("/orders", require("./routes/orders"));
app.use("/categories", require("./routes/categories"));
app.use("/products", require("./routes/products"));

app.get("/createTables", async (req,res) => {
	const queries = [
		"CREATE TABLE IF NOT EXISTS categories (id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL)",
		"CREATE TABLE IF NOT EXISTS products (id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL, 5Cdescription VARCHAR(150), category_id TINYINT UNSIGNED, price INT UNSIGNED NOT NULL, CONSTRAINT category_ibfk_1 FOREIGN KEY (category_5Cid) REFERENCES categories(id), KEY name (name))",
		"CREATE TABLE IF NOT EXISTS users (id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, first_name VARCHAR(50) NOT NULL, last_name VARCHAR(50), email VARCHAR(200) NOT NULL, salt CHAR(32) NOT NULL, password CHAR(128) NOT NULL, creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY (email))",
		"CREATE TABLE IF NOT EXISTS orders (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, userid INT UNSIGNED NOT NULL, date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT userid_ibfk_1 FOREIGN KEY (userid) REFERENCES users(id))",
		"CREATE TABLE IF NOT EXISTS orderproducts (orderid BIGINT UNSIGNED NOT NULL, productid INT UNSIGNED NOT NULL, quantity SMALLINT UNSIGNED NOT NULL, unit_price INT UNSIGNED NOT NULL, PRIMARY KEY (orderid,productid))"
	];
	try {
		for(query of queries) {
			await db.execute(query);
		}
		res.send({message: "Tables created successfully"});
	} catch(err) {
		console.error(err);
		res.status(500).send({message: err.code});
	}
});

app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
})
