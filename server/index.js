// Imports
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";
import mongoose from "mongoose";

// Routes
import links from "./routes/links.js";

// Load Environment Variables
dotenv.config({ path: "./config.env" });

// Variables
const app = express();
const PORT = process.env.PORT || 5000;
const CONNECTION_URL = process.env.CONNECTION_URL;

// Database Connection & Start Server
mongoose
	.connect(CONNECTION_URL, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		console.log("Connected to MongoDB. Great success!");
		app.listen(PORT, async () => {
			console.log(`Server is running on http://localhost:${PORT}`);
		})
		.then(
			response = await fetch( "http://134.117.130.17:3000/searchengines", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({request_url: "http://134.117.128.87:3000"}),
			});
			// const outgoingLinkData = await outgoingLinkResponse.json();
			// if (outgoingLinkResponse.status === 200) {
			// 	c.queue(outgoingLink);
			// } else if (outgoingLinkResponse.status != 201) {
			// 	console.error(
			// 		"Failed to add outgoing link. Error: ",
			// 		outgoingLinkData.message
			// 	);
			// }
		).catch((error) => {
			console.error("Error connecting to distributed system: ", error.message);
			process.exit(1);
		}
	})
	.catch((error) => {
		console.error("Error connecting to MongoDB. Womp womp:", error.message);
		process.exit(1);
	});

// Middleware
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

// Routes
app.use("/", links);

// Error Handling Middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send("Something went wrong!");
});
