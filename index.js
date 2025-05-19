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
        const sql = `CREATE TABLE products (id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL, description VARCHAR(150), category_id TINYINT UNSIGNED, CONSTRAINT category_ibfk_1 FOREIGN KEY (category_id) REFERENCES categories(id))`;
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
