const db = require("../config/database");

const createProduct = async (req,res) => {
        const {name, price, description = null, category_id = null} = req.body;
        if(!name || !price) {
                return res.status(400).send("Name cannot be null");
        }
        const sql = `INSERT INTO products (name,description,category_id,price) VALUES (?,?,?,?)`;
        try {
		const [result,_] = await db().execute(sql, [name,description,category_id,price]);
		res.send({
			id: result.insertId,
			name: name.toString(),
			description,
			price: +price,
			category_id
		});
	} catch(err) {
		res.status(500).send({message: "Internal Server Error"});
		console.log(err);
	}
}

const updateProduct = async (req,res) => {
	const id = +req.params.id;
	if(isNaN(id)) {
		return res.status(400).send({message: "Id must be numeric"});
	}
        const { name = null, description = null, category_id = null } = req.body;
        if(name === "") {
		return res.status(400).send({message: "Name cannot be null"});
	}
	const sql = `UPDATE products SET name = COALESCE(?,name), description = COALESCE(?,description), category_id = COALESCE(?,category_id) WHERE id = ?`;
        try {
		const [result,_] = await db().execute(sql, [name,description,category_id,id]);
		if(result.affectedRows > 0) res.send({message:"OK"});
		else res.status(404).send({message: "Not Found"});
        } catch(err) {
		res.status(500).send({message: "Internal Server Error"});
		console.log(err);
	}
}

const getProducts = async (req, res) => {
	const sql = `SELECT * FROM products`;
	try {
		const [result,fields] = await db().execute(sql);
		res.send(result);
	} catch(err) {
		res.status(500).send({message: "Internal Server Error"});
		console.log(err);
	}
}

const getProductsCat = async (req, res) => {
	const sql = `SELECT A.*, B.name AS category FROM products A LEFT JOIN categories B ON A.category_id = B.id`;
	try {
		const [result,fields] = await db().execute(sql);
		res.send(result);
	} catch(err) {
		res.status(500).send({message: "Internal Server Error"});
		console.log(err);
	}
}

const getProduct = async (req,res) => {
	const id = req.params.idOrName;
	const param = isNaN(+id) ? "name":"id";
        const sql = `SELECT * FROM products WHERE ${param} = ?`;
	try {
		const [result,fields] = await db().execute(sql,[id]);
		if(result.length > 0) res.send(result);
		else res.status(404).send({message:"Not Found"});
	} catch(err) {
		res.status(500).send({message: "Internal Server Error"});
		console.log(err);
	}
}

const getSortedProducts = async (req, res) => {
	const sql = `SELECT * FROM products ORDER BY id DESC`;
	try {
		const [result,fields] = await db().execute(sql);
		res.send(result);
	} catch(err) {
		res.status(500).send({message: "Internal Server Error"});
		console.log(err);
	}
}

const deleteProduct = async (req,res) => {
        const id = +req.params.id;
        const sql = "DELETE FROM products WHERE id = ?";
        try {
		const [result,fields] = await db().execute(sql,[id]);
		if(result.affectedRows > 0) res.send({message:"OK"});
		else res.status(404).send({message:"Not Found"});
	} catch(err) {
		res.status(500).send({message: "Internal Server Error"});
		console.log(err);
	}
}

module.exports = {
	getProducts,
	getProduct,
	getProductsCat,
	getSortedProducts,
	createProduct,
	updateProduct,
	deleteProduct
}
