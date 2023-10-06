// Imports
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { createRequire } from "module";
import mongoose from "mongoose";

// Database
// import fs from "fs/promises";
// import ProductModel from "./models/productModel.js";
// import ReviewModel from "./models/reviewModel.js";

// Routes
import links from "./routes/links.js";
// import productRoutes from "./routes/products.js";

// Const
const app = express();
const CONNECTION_URL =
	"mongodb+srv://davidaddison:davidaddison123@labscluster.t59zal5.mongodb.net/?retryWrites=true&w=majority";
const PORT = process.env.PORT || 5000;
const require = createRequire(import.meta.url);

// Middleware
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

app.use("/links", links);
app.get("/", (req, res) => {
	res.send("Hello from Express!");
});

// Clear Database
// const productFilePath = "./database/products.json";
// const reviewsFilePath = "./database/reviews.json";

// function replaceReviewIds(updatedReviewsData, productIds) {
// 	// Ensure we have up to 10 product IDs to use
// 	const idsToReplace = productIds.slice(0, 10);

// 	// Replace the existing product IDs in the reviews with new ones
// 	const updatedReviews = updatedReviewsData.map((review, index) => {
// 		if (index < idsToReplace.length) {
// 			review.id = idsToReplace[index];
// 			review.data.forEach((dataItem) => {
// 				dataItem.productId = idsToReplace[index];
// 			});
// 		}
// 		return review;
// 	});

// 	return updatedReviews;
// }

// async function createAndSaveReviews(updatedReviewsData) {
// 	try {
// 		const productReviewsMap = {}; // Create a map to associate product IDs with reviews

// 		// Iterate through the updatedReviewsData to group reviews by product ID
// 		updatedReviewsData.forEach((review) => {
// 			const productId = review.id;

// 			if (!productReviewsMap[productId]) {
// 				productReviewsMap[productId] = [];
// 			}

// 			productReviewsMap[productId].push(review);
// 		});

// 		// Create and save reviews for each product
// 		for (const productId of Object.keys(productReviewsMap)) {
// 			const product = await ProductModel.findById(productId);

// 			if (!product) {
// 				console.log(`Product not found for ID: ${productId}`);
// 				continue; // Skip if product not found
// 			}

// 			const reviewsForProduct = productReviewsMap[productId];
// 			let i = 0;

// 			// Create and save each review
// 			for (const reviewData of reviewsForProduct) {
// 				const newReview = new ReviewModel(reviewData.data[i]);

// 				// Save the review to the database
// 				await newReview.save();

// 				// Push the review's ID to the product's reviews array
// 				product.reviews.push(newReview._id);
// 				i++;
// 			}

// 			// Save the product to update the reviews array
// 			await product.save();
// 		}

// 		console.log("Reviews created and linked to products successfully.");
// 	} catch (error) {
// 		console.error("Error creating reviews:", error);
// 	}
// }

// const clearAndPopulateDatabase = async () => {
// 	try {
// 		// Read the JSON data from the file
// 		const jsonData = await fs.readFile(productFilePath, "utf-8");
// 		const productsData = JSON.parse(jsonData);

// 		// Clear the MongoDB collection associated with ProductModel
// 		await ProductModel.deleteMany({});
// 		await ReviewModel.deleteMany({});

// 		// Insert the data from the JSON file into the MongoDB collection
// 		const insertedProducts = await ProductModel.insertMany(productsData);
// 		const productIds = insertedProducts.map((product) => product._id);

// 		// Read the JSON data for updated reviews
// 		const reviewsData = await fs.readFile(reviewsFilePath, "utf-8");
// 		const updatedReviewsData = JSON.parse(reviewsData);

// 		// Call replaceReviewIds with the correct arguments
// 		const updatedReviews = replaceReviewIds(updatedReviewsData, productIds);

// 		// Create and save reviews
// 		await createAndSaveReviews(updatedReviews);
// 		console.log("Database cleared and populated successfully.");
// 	} catch (error) {
// 		console.error("Error clearing and populating the database:", error.message);
// 	}
// };

// Database & Start Server
mongoose
	.connect(CONNECTION_URL)
	.then(() => {
		//clearAndPopulateDatabase(); // comment this out when you don't want auto-clearing database
		app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
	})
	.catch((error) => console.log(error.message));
