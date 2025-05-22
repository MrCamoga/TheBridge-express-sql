const db = require("../config/database");

module.exports = {
	createUser: async (req,res) => {
		const {first_name, last_name = null, email, password } = req.body;
		if(!email || !password || !first_name) {
			return res.status(400).send("Invalid body");
		}
		const sql = `
			INSERT INTO users (first_name,last_name,email,salt,password) 
			WITH data (fname,lname,email,password,salt) AS ( 
				SELECT ?,?,?,?,TO_BASE64(RANDOM_BYTES(24))
			)
			SELECT fname,lname,email,salt,SHA2(CONCAT(salt,password),512) AS password FROM data`;
		try {
			const [result,_] = await db().execute(sql, [first_name,last_name,email,password]);
			res.status(201).send({
				id: result.insertId,
				first_name,
				last_name,
				email
			});
		} catch(err) {
			if(err.code == "ER_DUP_ENTRY") res.status(409).send({message: "Email already registered"});
			else {
				res.status(500).send({message: "Internal Server Error"});
				console.log(err);
			}
		}
	},

	updateUser: async (req,res) => {
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
			const [result,_] = await db().execute(sql, [first_name, last_name, email, id]); // TODO add password
			if(result.affectedRows > 0) res.send({message:"OK"});
			else res.status(404).send({message:"Not Found"});
		} catch(err) {
			if(err.code == "ER_DUP_ENTRY")
				res.status(409).send({message: "Email already registered"});
			else {
				res.status(500).send({message: "Internal Server Error"});
				console.log(err);
			}
		}
	},

	getUsers: async (req,res) => {
		const sql = `SELECT id, first_name, last_name, email, creation_date FROM users`;
		try {
			const [result,fields] = await db().execute(sql);
			res.send(result);
		} catch(err) {
			res.status(500).send({message: "Internal Server Error"});
			console.log(err);
		}
	},

	getUser: async (req,res) => {
		const id = +req.params.id;
		if(isNaN(id)) {
			return res.status(400).send("Id must be numeric");
		}
		const sql = `SELECT id, first_name, last_name, email, creation_date FROM users WHERE id = ?`;
		try {
			const [result,fields] = await db().execute(sql,[id]);
			if(result.length > 0) res.send(result);
			else res.status(404).send({message:"Not Found"});
		} catch(err) {
			res.status(500).send({message: "Internal Server Error"});
			console.log(err);
		}
	},

	deleteUser: async (req,res) => {
		const id = +req.params.id;
		const sql = "DELETE FROM users WHERE id = ?";
		try {
			const [result,fields] = await db().execute(sql,[id]);
			if(result.affectedRows > 0) res.send({message:"OK"});
			else res.status(404).send({message:"Not Found"});
		} catch(err) {
			res.status(500).send({message: "Internal Server Error"});
			console.log(err);
		}
	},

	getUserOrders: async (req,res) => {
		const sql = `
			SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT(
				'user_id', A.id,
				'first_name', A.first_name,
				'last_name', A.last_name,
				'email', A.email,
				'orders', COALESCE((
					SELECT JSON_ARRAYAGG(JSON_OBJECT(
						'order_id', B.id,
						'order_date', B.date,
						'total_price', (SELECT SUM(unit_price*quantity) FROM orderproducts WHERE orderid = B.id),
						'items', (SELECT JSON_ARRAYAGG(
							JSON_OBJECT(
								'name', D.name,
								'quantity', C.quantity,
								'unit_price', C.unit_price
							))
							FROM orderproducts C
							LEFT JOIN products D ON C.productid = D.id
							WHERE C.orderid = B.id
						)
					))
					FROM orders B
					WHERE B.userid = A.id
				), JSON_ARRAY())
			)), JSON_ARRAY()) AS userOrders
			FROM users A
			`;
		try {
			const [result,_] = await db().query(sql);
			res.setHeader('Content-Type','application/json');
			res.send(result[0].userOrders);
		} catch(err) {
			res.status(500).send({message: "Internal Server Error"});
			console.log(err);
		}
	}
}
