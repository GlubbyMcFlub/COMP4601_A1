// Imports
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

// Routes
import links from "./routes/links.js";

// Load
dotenv.config({ path: "./config.env" });

// Variables
const app = express();
const CONNECTION_URL = String(process.env.CONNECTION_URL);
console.log(CONNECTION_URL);
const PORT = process.env.PORT || 5000;

// Database & Start Server
mongoose
	.connect(CONNECTION_URL)
	.then(() => {
		app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
	})
	.catch((error) => console.log(error.message));

// Middleware
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

// Routes
app.use("/fruits", links);
app.use("/personal", links);
