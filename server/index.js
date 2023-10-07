// Imports
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";

// Routes
import links from "./routes/links.js";

const app = express();
const CONNECTION_URL =
	"mongodb+srv://davidaddison:davidaddison123@labscluster.t59zal5.mongodb.net/?retryWrites=true&w=majority";
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
app.use("/links", links);
