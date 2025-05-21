const express = require("express");
const router = express.Router();

const {
	getProducts,
	getProduct,
	getProductsCat,
	getSortedProducts,
	createProduct,
	updateProduct,
	deleteProduct
} = require("../controllers/ProductController");

router.get("/", getProducts);
router.get("/categories", getProductsCat);
router.get("/sorted", getSortedProducts);
router.get("/:idOrName", getProduct);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;

