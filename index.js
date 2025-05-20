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

async function simpleSelect(sql,res) {
	try {
		const [result,fields] = await db.execute(sql);
		res.send(result);
	} catch(err) {
		console.error(err);
	}
}

app.get("/createTables", async (req,res) => {
	const queries = [
		"CREATE TABLE IF NOT EXISTS categories (id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL)",
		"CREATE TABLE IF NOT EXISTS products (id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL, description VARCHAR(150), category_id TINYINT UNSIGNED, price INT UNSIGNED NOT NULL, CONSTRAINT category_ibfk_1 FOREIGN KEY (category_id) REFERENCES categories(id), KEY name (name))",
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

app.post("/products", async (req,res) => {
        const {name, price, description = null, category_id = null} = req.body;
        if(!name || !price) {
                return res.status(400).send("Name cannot be null");
        }
        const sql = `INSERT INTO products (name,description,category_id,price) VALUES (?,?,?,?)`;
        try {
		const [result,_] = await db.execute(sql, [name,description,category_id,price]);
		res.send({
			id: result.insertId,
			name: name.toString(),
			description,
			price: +price,
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
                        name: name.toString()
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
		if(result.affectedRows > 0) res.send({message:"OK"});
		else res.status(404).send({message: "Not Found"});
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
		return res.status(400).send("Name cannot be empty");
	}
	const sql = `UPDATE categories SET name = COALESCE(?,name) WHERE id = ?`;
        try {
		const [result,_] = await db.execute(sql, [name,id]);
		if(result.affectedRows > 0) res.send({message:"OK"});
		else res.status(404).send({message: "Not Found"});
        } catch(err) {
		console.error(err);
	}
});

app.get("/products", async (req, res) => {
	const sql = `SELECT * FROM products`;
	await simpleSelect(sql,res);
});

app.get("/categories", async (req, res) => {
	const sql = `SELECT * FROM categories`;
	await simpleSelect(sql,res);
});

app.get("/productsAll", async (req, res) => {
	const sql = `SELECT A.name, A.description, B.name AS category FROM products A LEFT JOIN categories B ON A.category_id = B.id`;
	await simpleSelect(sql,res);
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
	await simpleSelect(sql,res);
});

app.get("/categories/:id", async (req,res) => {
	const id = +req.params.id;
	if(isNaN(id)) {
		return res.status(400).send("Id must be numeric");
	}
        const sql = `SELECT * FROM categories WHERE id = ?`;
        try {
		const [result,fields] = await db.execute(sql,[id]);
		if(result.length > 0) res.send(result);
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
        const {first_name, last_name = null, email, password } = req.body;
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

app.post("/orders", async (req,res) => {
        const {userid, items = [] } = req.body; // items: [[product_id, quantity],...]
        if(!userid || items.length == 0) {
                return res.status(400).send("Invalid body");
        }
        const sql_order = `INSERT INTO orders (userid) VALUES (?)`;
	const sql_items = `
		INSERT INTO orderproducts (orderid, productid, quantity, individual_price)
		WITH items (productid,quantity) AS (
			SELECT * FROM (VALUES ?) AS C
		)
		SELECT ?, A.productid, A.quantity, B.price FROM items A
		INNER JOIN products B ON A.productid = B.id
	`;
	try {
		await db.query("START TRANSACTION");
		const [result,_] = await db.execute(sql_order, [userid]);
		const orderid = result.insertId;
		const [result2,__] = await db.query(sql_items, [items, orderid]);
		res.send({
			id: orderid,
			userid,
			date: new Date()
		});

		await db.query("COMMIT");
	} catch(err) {
		await db.query("ROLLBACK");
		console.error(err)
	}
});

app.put("/users/:id", async (req,res) => {
	const id = +req.params.id;
	if(isNaN(id)) {
		return res.status(400).send("Id must be numeric");
	}
        const {first_name = null, last_name = null, email = null, password = null } = req.body;
        if(first_name === "" || email === "" || password === "") {
		return res.status(400).send("Invalid body");
	}
	const sql = `UPDATE users SET first_name = COALESCE(?,first_name), last_name = COALESCE(?,last_name), email = COALESCE(?,email) WHERE id = ?`;
        try {
		const [result,_] = await db.execute(sql, [first_name, last_name, email, id]); // TODO add password
		res.send(result);
        } catch(err) {
		console.error(err);
	}
});

app.get("/users", async (req,res) => {
	const sql = `SELECT id, first_name, last_name, email, creation_date FROM users`;
	simpleSelect(sql,res);
});

app.get("/users/:id", async (req,res) => {
	const id = +req.params.id;
	if(isNaN(id)) {
		return res.status(400).send("Id must be numeric");
	}
	const sql = `SELECT id, first_name, last_name, email, creation_date FROM users WHERE id = ?`;
	try {
		const [result,fields] = await db.execute(sql,[id]);
		if(result.length > 0) res.send(result);
		else res.status(404).send({message:"Not Found"});
	} catch(err) {
		console.error(err);
	}
});

app.delete("/users/:id", async (req,res) => {
	const id = +req.params.id;
	const sql = "DELETE FROM users WHERE id = ?";
	try {
		const [result,fields] = await db.execute(sql,[id]);
		if(result.affectedRows > 0) res.send({message:"OK"});
		else res.status(404).send({message:"Not Found"});
	} catch(err) {
		console.error(err);
	}
});

app.get("/orders", async (req,res) => {
	const sql = `
		SELECT JSON_ARRAYAGG(JSON_OBJECT(
			'order_id', A.id,
			'buyer', CONCAT(first_name," ",last_name),
			'order_date', A.date,
			'items', (SELECT JSON_ARRAYAGG(
				JSON_OBJECT(
					'name', D.name,
					'quantity', C.quantity,
					'unit_price', C.individual_price
				))
				FROM orderproducts C
				INNER JOIN products D ON C.productid = D.id
				WHERE C.orderid = A.id
			)
		)) AS orders
		FROM orders A
		INNER JOIN users B on A.userid = B.id
		`;
	try {
		const [result,_] = await db.query(sql);
		res.setHeader('Content-Type','application/json');
		res.send(result[0].orders);
	} catch(err) {
		console.error(err);
	}
})

app.get("/userOrders", async (req,res) => {
	const sql = `
		SELECT JSON_ARRAYAGG(JSON_OBJECT(
			'user_id', A.id,
			'first_name', A.first_name,
			'last_name', A.last_name,
			'email', A.email,
			'orders', (
				SELECT JSON_ARRAYAGG(JSON_OBJECT(
					'order_id', B.id,
					'order_date', B.date,
					'items', (SELECT JSON_ARRAYAGG(
						JSON_OBJECT(
							'name', D.name,
							'quantity', C.quantity,
							'unit_price', C.individual_price
						))
						FROM orderproducts C
						INNER JOIN products D ON C.productid = D.id
						WHERE C.orderid = B.id
					)
				))
				FROM orders B
				WHERE B.userid = A.id
			)
		)) AS userOrders
		FROM users A
		`;
	try {
		const [result,_] = await db.query(sql);
		res.setHeader('Content-Type','application/json');
		res.send(result[0].userOrders);
	} catch(err) {
		console.error(err);
	}
})

app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
})
