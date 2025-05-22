const db = require("../config/database");

module.exports = {
	createOrder: async (req,res) => {
		const {userid, items = [] } = req.body; // items: [[product_id, quantity],...]
		if(!userid || items.length == 0) {
			return res.status(400).send("Invalid body");
		}
		const sql_order = `INSERT INTO orders (userid) VALUES (?)`;
		const sql_items = `
			INSERT INTO orderproducts (orderid, productid, quantity, unit_price)
			WITH items (productid,quantity) AS (
				SELECT * FROM (VALUES ?) AS C
			)
			SELECT ?, A.productid, A.quantity, B.price FROM items A
			INNER JOIN products B ON A.productid = B.id
		`;
		try {
			await db().query("START TRANSACTION");
			const [result,_] = await db().execute(sql_order, [userid]);
			const orderid = result.insertId;
			const [result2,__] = await db().query(sql_items, [items, orderid]);
			res.send({
				id: orderid,
				userid,
				date: new Date()
			});

			await db().query("COMMIT");
		} catch(err) {
			await db().query("ROLLBACK");
			res.status(500).send({message: "Internal Server Error"});
			console.log(err);
		}
	},

	getOrders: async (req,res) => {
		const sql = `
			SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT(
				'order_id', A.id,
				'buyer', CONCAT(first_name," ",last_name),
				'order_date', A.date,
				'total_price', (SELECT SUM(unit_price*quantity) FROM orderproducts WHERE orderid = A.id),
				'items', (SELECT JSON_ARRAYAGG(
					JSON_OBJECT(
						'name', D.name,
						'quantity', C.quantity,
						'unit_price', C.unit_price
					))
					FROM orderproducts C
					INNER JOIN products D ON C.productid = D.id
					WHERE C.orderid = A.id
				)
			)), JSON_OBJECT()) AS orders
			FROM orders A
			INNER JOIN users B on A.userid = B.id
			`;
		try {
			const [result,_] = await db().query(sql);
			res.setHeader('Content-Type','application/json');
			res.send(result[0].orders);
		} catch(err) {
			res.status(500).send({message: "Internal Server Error"});
			console.log(err);
		}
	}
}
