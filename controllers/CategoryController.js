const db = require("../config/database");

const createCategory = async (req,res) => {
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
}

const updateCategory = async (req,res) => {
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
}

const getCategories = async (req, res) => {
	const sql = `SELECT * FROM categories`;
	try {
		const [result,fields] = await db.execute(sql);
		res.send(result);
	} catch(err) {
		console.error(err);
	}
}

const getCategory = async (req,res) => {
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
}

module.exports = {
	getCategories, getCategory,
	createCategory,
	updateCategory
};
