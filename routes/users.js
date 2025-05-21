const express = require("express");
const router = express.Router();

const {
	getUsers,
	getUser,
	getUserOrders,
	createUser,
	updateUser,
	deleteUser
} = require("../controllers/UserController.js");

router.get("/", getUsers);
router.get("/orders", getUserOrders);
router.get("/:id", getUser);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
