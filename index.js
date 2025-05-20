const mysql = require("mysql2/promise");
const express = require("express");

const PORT = 25565;

const app = express();
app.use(express.json());

let db;

(async () => {
	db = await mysql.createConnection({
		host: "localhost",
		port: 3306,
		user: "thebridge",
		password: "",
		database: "tb_express"
	});
})();

app.get("/createTables", async (req,res) => {
	const queries = [
		"CREATE TABLE IF NOT EXISTS categories (id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL)",
		"CREATE TABLE IF NOT EXISTS products (id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL, description VARCHAR(150), category_id TINYINT UNSIGNED, CONSTRAINT category_ibfk_1 FOREIGN KEY (category_id) REFERENCES categories(id), KEY name (name))",
		"CREATE TABLE IF NOT EXISTS users (id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, first_name VARCHAR(50) NOT NULL, last_name VARCHAR(50), email VARCHAR(200) NOT NULL, salt CHAR(32) NOT NULL, password CHAR(128) NOT NULL, creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY (email))",
		"CREATE TABLE IF NOT EXISTS orders (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, userid INT UNSIGNED NOT NULL, date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT userid_ibfk_1 FOREIGN KEY (userid) REFERENCES users(id))",
		"CREATE TABLE IF NOT EXISTS orderproducts (orderid BIGINT UNSIGNED NOT NULL, productid INT UNSIGNED NOT NULL, quantity SMALLINT UNSIGNED NOT NULL, individual_price INT UNSIGNED NOT NULL, PRIMARY KEY (orderid,productid))"
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

app.post("/products", async (req,res) => {
        const {name = null, description = null, category_id = null} = req.body;
        if(!name) {
                return res.status(400).send("Name cannot be null");
        }
        const sql = `INSERT INTO products (name,description,category_id) VALUES (?,?,?)`;
        try {
		const [result,_] = await db.execute(sql, [name,description,category_id]);
		res.send({
			id: result.insertId,
			name, // TODO parse name to string
			description,
			category_id
		});
	} catch(err) {
		console.error(err)
	}
});

app.post("/categories", async (req,res) => {
        const name = req.body.name;
        if(!name) {
                return res.status(400).send("Name cannot be null");
        }
        const sql = `INSERT INTO categories (name) VALUES (?)`;
        try {
		const [result,_] = await db.execute(sql, [name]);
		res.send({
                        id: result.insertId,
                        name // TODO parse name to string
                });
	} catch(err) {
		console.error(err)
	}
});

app.put("/products/:id", async (req,res) => {
	const id = +req.params.id;
	if(isNaN(id)) {
		return res.status(400).send("Id must be numeric");
	}
        const { name = null, description = null, category_id = null } = req.body;
        if(name === "") {
		return res.status(400).send("Name cannot be null");
	}
	const sql = `UPDATE products SET name = COALESCE(?,name), description = COALESCE(?,description), category_id = COALESCE(?,category_id) WHERE id = ?`;
        try {
		const [result,_] = await db.execute(sql, [name,description,category_id,id]);
		res.send(result);
        } catch(err) {
		console.error(err);
	}
});

app.put("/categories/:id", async (req,res) => {
	const id = +req.params.id;
	if(isNaN(id)) {
		return res.status(400).send("Id must be numeric");
	}
        const { name = null } = req.body;
        if(name === "") {
		return res.status(400).send("Name cannot be null");
	}
	const sql = `UPDATE categories SET name = COALESCE(?,name) WHERE id = ?`;
        try {
		const [result,_] = await db.execute(sql, [name,id]);
		res.send(result);
        } catch(err) {
		console.error(err);
	}
});

app.get("/products", async (req, res) => {
	const sql = `SELECT * FROM products`;
	try {
		const [result,fields] = await db.execute(sql);
		res.send(result);
	} catch(err) {
		console.error(err);
	}
});

app.get("/categories", async (req, res) => {
	const sql = `SELECT * FROM categories`;
	try {
		const [result,fields] = await db.execute(sql);
		res.send(result);
	} catch(err) {
		console.error(err);
	}
});

app.get("/productsAll", async (req, res) => {
	const sql = `SELECT A.name, A.description, B.name AS category FROM products A LEFT JOIN categories B ON A.category_id = B.id`;
	try {
		const [result,fields] = await db.execute(sql);
		res.send(result);
	} catch(err) {
		console.error(err);
	}
});

app.get("/products/:idOrName", async (req,res) => {
	const id = req.params.idOrName;
	const param = isNaN(+id) ? "name":"id";
        const sql = `SELECT * FROM products WHERE ${param} = ?`;
	try {
		const [result,fields] = await db.execute(sql,[id]);
		if(result.length > 0) res.send(result);
		else res.status(404).send({message:"Not Found"});
	} catch(err) {
		console.error(err);
	}
});

app.get("/productsSorted", async (req, res) => {
	const sql = `SELECT * FROM products ORDER BY id DESC`;
        try {
		const [result,fields] = await db.execute(sql);
		res.send(result);
	} catch(err) {
		console.error(err);
	}
});

app.get("/categories/:id", async (req,res) => {
	const id = +req.params.id;
	if(isNaN(id)) {
		return res.status(400).send("Id must be numeric");
	}
        const sql = `SELECT * FROM categories WHERE id = ?`;
        try {
		const [result,fields] = await db.execute(sql,[id]);
		if(result.length > 0) res.send(result[0]);
		else res.status(404).send({message:"Not Found"});
	} catch(err) {
		console.error(err);
	}
});

app.delete("/products/:id", async (req,res) => {
        const id = +req.params.id;
        const sql = "DELETE FROM products WHERE id = ?";
        try {
		const [result,fields] = await db.execute(sql,[id]);
		if(result.affectedRows > 0) res.send({message:"OK"});
		else res.status(404).send({message:"Not Found"});
	} catch(err) {
		console.error(err);
	}
});

app.post("/users", async (req,res) => {
        const {first_name = null, last_name = null, email = null, password = null } = req.body;
        if(!email || !password || !first_name) {
                return res.status(400).send("Invalid body");
        }
	// TODO email and password validation and hashing
        const sql = `INSERT INTO users (first_name,last_name,email,password,salt) VALUES (?,?,?,?,?)`;
        const [result,_] = await db.execute(sql, [first_name,last_name,email,password,"e"]);
	res.send({
		id: result.insertId,
		first_name,
		last_name,
		email
	});
});
