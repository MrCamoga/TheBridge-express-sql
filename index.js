const mysql = require("mysql2");
const express = require("express");

const PORT = 25565;

const app = express();
app.use(express.json());

const db = mysql.createConnection({
        host: "localhost",
        port: 3306,
        user: "thebridge",
        password: "",
        database: "tb_express"
});

db.connect(err => {
        if(err) {
                console.log("An error ocurred connecting to the database");
                throw err;
        } else {
                console.log("Connection to database stablished");
        }
})


app.get("/createProductTable", (req,res) => {
        const sql = `CREATE TABLE products (id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL, description VARCHAR(150), category_id TINYINT UNSIGNED, CONSTRAINT category_ibfk_1 FOREIGN KEY (category_id) REFERENCES categories(id), KEY name (name))`; // TODO test
        db.query(sql, (err,result) => {
                if(err) throw err;
                res.send(result);
        });
});

app.get("/createCategoryTable", (req,res) => {
        const sql = `CREATE TABLE categories (id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL)`;
        db.query(sql, (err,result) => {
                if(err) throw err;
                res.send(result);
        });
});


app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
})

app.post("/products", (req,res) => {
        const {name, description, category_id } = req.body;
        if(!name) {
                return res.status(400).send("Name cannot be null");
        }
        const sql = `INSERT INTO products (name,description,category_id) VALUES (?,?,?)`;
        db.execute(sql, [name,description,category_id], (err,result) => {
                if(err) throw err;
                res.send({
			id: result.insertId,
			name: name+"",
			description: description ?? null,
			category_id: category_id ?? null
		});
        });
});

app.post("/categories", (req,res) => {
        const name = req.body.name;
        if(!name) {
                return res.status(400).send("Name cannot be null");
        }
        const sql = `INSERT INTO categories (name) VALUES (?)`;
        db.execute(sql, [name], (err,result) => {
                if(err) throw err;
                res.send({
                        id: result.insertId,
                        name
                });
        });
});

app.put("/products/:id", (req,res) => {
	const id = +req.params.id;
	if(isNaN(id)) {
		return res.status(400).send("Id must be numeric");
	}
        const { name = null, description = null, category_id = null } = req.body;
        if(name === "") {
		return res.status(400).send("Name cannot be null");
	}
	const sql = `UPDATE products SET name = COALESCE(?,name), description = COALESCE(?,description), category_id = COALESCE(?,category_id) WHERE id = ?`;
        db.execute(sql, [name,description,category_id,id], (err,result) => {
                if(err) throw err;
		res.send(result);
        });
});

app.put("/categories/:id", (req,res) => {
	const id = +req.params.id;
	if(isNaN(id)) {
		return res.status(400).send("Id must be numeric");
	}
        const { name = null } = req.body;
        if(name === "") {
		return res.status(400).send("Name cannot be null");
	}
	const sql = `UPDATE categories SET name = COALESCE(?,name) WHERE id = ?`;
        db.execute(sql, [name,id], (err,result) => {
                if(err) throw err;
		res.send(result);
        });
});

app.get("/products", (req, res) => {
	const sql = `SELECT * FROM products`;
        db.execute(sql, (err,result) => {
                if(err) throw err;
		res.send(result);
        });
});

app.get("/categories", (req, res) => {
	const sql = `SELECT * FROM categories`;
        db.execute(sql, (err,result) => {
                if(err) throw err;
		res.send(result);
        });
});

app.get("/productsAll", (req, res) => {
	const sql = `SELECT A.name, A.description, B.name AS category FROM products A LEFT JOIN categories B ON A.category_id = B.id`;
        db.execute(sql, (err,result) => {
                if(err) throw err;
		res.send(result);
        });
});

app.get("/products/:idOrName", (req,res) => {
	const id = req.params.idOrName;
        const sql = "SELECT * FROM products WHERE " + (isNaN(+id) ? "name = ?":"id = ?");
        db.execute(sql, [id], (err,result) => {
                if(err) throw err;
		if(result.length > 0) res.send(result);
		else res.status(404).send({message:"Not Found"});
        });
});

app.get("/productsSorted", (req, res) => {
	const sql = `SELECT * FROM products ORDER BY id DESC`;
        db.execute(sql, (err,result) => {
                if(err) throw err;
		res.send(result);
        });
});

app.get("/categories/:id", (req,res) => {
	const id = +req.params.id;
	if(isNaN(id)) {
		return res.status(400).send("Id must be numeric");
	}
        const sql = `SELECT * FROM categories WHERE id = ?`;
        db.execute(sql, [id], (err,result) => {
                if(err) throw err;
		if(result.length > 0) res.send(result);
		else res.status(404).send({message:"Not Found"});
        });
});

app.delete("/products/:id", (req,res) => {
        const id = +req.params.id;
        const sql = "DELETE FROM products WHERE id = ?";
        db.execute(sql, [id], (err,result) => {
                if(err) throw err;
		res.send(result);
                if(result.length > 0) res.send(result);
                else res.status(404).send({message:"Not Found"});
        });
});
