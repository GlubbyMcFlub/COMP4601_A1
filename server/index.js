// Imports
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import fetch from "node-fetch";

// Routes
import links from "./routes/links.js";

// Load Environment Variables
dotenv.config({ path: "./config.env" });

// Variables
const app = express();
const PORT = process.env.PORT || 5000;
const CONNECTION_URL = process.env.CONNECTION_URL;
const FLOATING_IP = process.env.FLOATING_IP;
const DISTRIBUTED_SYSTEM = process.env.DISTRIBUTED_SYSTEM;
const baseEndPoint = `http://localhost:${PORT}`;

// Database Connection & Start Server
try {
	await mongoose.connect(CONNECTION_URL, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
	console.log("Connected to MongoDB. Great success!");

	app.listen(PORT, async () => {
		console.log(`Server is running on http://localhost:${PORT}`);

		try {
			const response = await fetch(DISTRIBUTED_SYSTEM, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ request_url: FLOATING_IP }),
			});

			if (response.status === 201) {
				console.log("Successfully connected to distributed system.");
			} else {
				console.error(
					"Failed to connect to distributed system, bad response recieved: ",
					response.status
				);
			}
		} catch (error) {
			console.error("Error connecting to distributed system: ", error.message);
		}
		try {
			// Tell the server to index and calculate pageRanks
			const indexResponse = await fetch(baseEndPoint + "index/", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
			});
			await indexResponse.json();
			if (indexResponse.status != 200) {
				console.error("Error indexing on drain");
			}

			const pageRankResponse = await fetch(baseEndPoint + "pageRank/", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
			});
			await pageRankResponse.json();
			if (pageRankResponse.status != 200) {
				console.error("Error calculating pageRanks on drain");
			}
		} catch (error) {
			console.error("Error populating indexes or ranking pages" + error);
		}
	});
} catch (error) {
	console.error("Error connecting to MongoDB. Womp womp:", error.message);
	process.exit(1);
}

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
