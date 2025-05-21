const express = require("express");
const router = express.Router();

const {
	getCategories,
	getCategory,
	createCategory,
	updateCategory
} = require("../controllers/CategoryController");


router.get("/", getCategories);
router.get("/:id", getCategory);
router.post("/", createCategory);
router.put("/:id", updateCategory);
//router.delete("/:id", deleteCategory);

module.exports = router;
