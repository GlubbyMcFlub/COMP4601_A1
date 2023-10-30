import elasticlunr from "elasticlunr";
import { Matrix } from "ml-matrix";
import mongoose from "mongoose";
import NodeCache from "node-cache";
import { FruitModel, PersonalModel } from "../models/linkModel.js";

// Initialize ElasticLunr index
const index = elasticlunr(function () {
	this.addField("title");
	this.addField("paragraph");
	this.addField("outgoingLinks");
	this.addField("wordFrequencies");
	this.setRef("id");
});

// Initialize NodeCache
const cache = new NodeCache({ stdTTL: 60 });
const GROUP_MEMBERS = "Eric Leroux and David Addison";
const ALPHA = 0.1;
const EUC_STOPPING_THRESHOLD = 0.0001;

/*
	This function searches the database for appropriate data according to request and query.
	If specified, it uses search score and boost to rank data.
	Params:
	- req: request object
		- id: id of resource to search for
		- q: query to search for
		- boost: whether or not to boost search results by page rank
		- limit: number of results to return
	- res: response object
	- type: type of data to search for (fruits or personal)
*/
export const search = async (req, res, type) => {
	try {
		// Get query parameters and cache the query
		const { id, q, boost, limit } = req.query;
		const applyBoost = boost === "true";
		const cacheKey = `search:${q}:${applyBoost}:${type}`;
		let links;
		let selectedSchema;

		// Choose appropriate schema according to type
		if (type === "fruits") selectedSchema = FruitModel;
		else if (type === "personal") selectedSchema = PersonalModel;

		// If both ID and query are specified, return error
		if (id && q) {
			return res
				.status(400)
				.json({ message: "Cannot specify both ID and query." });
		}

		// If query is cached, return cached result
		const cachedResult = cache.get(cacheKey);
		if (cachedResult && cachedResult.length >= limit) {
			return res.status(200).json(cachedResult.slice(0, limit));
		}

		// If request contains an ID then find resource by ID and send it back
		if (id) {
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).json({ message: "Invalid link ID" });
			}
			const foundLink = await selectedSchema.findById(id);
			if (!foundLink) {
				return res.status(404).json({ message: "Link not found" });
			}
			links = {
				id: foundLink._id,
				name: GROUP_MEMBERS,
				paragraph: foundLink.paragraph,
				title: foundLink.title,
				url: foundLink.link,
				incomingLinks: foundLink.incomingLinks,
				outgoingLinks: foundLink.outgoingLinks,
				wordFrequencies: [...foundLink.wordFrequencies],
				pr: foundLink.pageRank,
			};
		} else if (q) {
			// If request contains a query, then perform a search to find appropriate resources

			// Search for query in index
			const searchResults = index.search(q, {
				fields: {
					paragraph: { boost: 3 },
					title: { boost: 2 },
					outgoingLinks: { boost: 1 },
					wordFrequencies: { boost: 4 },
				},
			});

			const linkIds = searchResults.map((result) => result.ref);
			const dbLinks = await selectedSchema.find({ _id: { $in: linkIds } });

			// Map search results to links
			links = await Promise.all(
				searchResults.map(async (result) => {
					const foundLink = dbLinks.find((link) => link._id.equals(result.ref));
					if (!foundLink) {
						console.error(
							"link " + result.ref + "not found, returning empty data"
						);
						return {
							id: "",
							name: GROUP_MEMBERS,
							title: "",
							url: "",
							score: 0,
							pr: 0,
						};
					}
					return {
						id: result.ref ? result.ref : "",
						name: GROUP_MEMBERS,
						title: foundLink.title ? foundLink.title : "",
						url: foundLink.link ? foundLink.link : "",
						score: result.score ? result.score : 0,
						pr: foundLink.pageRank ? foundLink.pageRank : 0,
					};
				})
			);
			// Multiply score by page rank if boost is true, otherwise only sort by score
			if (!applyBoost) {
				links.sort((a, b) => b.score - a.score);
			} else {
				links.sort((a, b) => b.score * b.pr - a.score * a.pr);
			}

			// Trim results down to limit
			links = links.slice(0, limit);
			let linksToAdd = await selectedSchema.find().limit(limit);

			// Add any other links with score of 0 if limit is not yet reached
			for (const linkToAdd of linksToAdd) {
				if (links.length == limit) {
					break;
				}

				if (!links.some((link) => link.id == linkToAdd._id.toString())) {
					let doc = {
						id: linkToAdd._id,
						name: "Eric Leroux and David Addison",
						title: linkToAdd.title,
						url: linkToAdd.link,
						score: 0,
						pr: linkToAdd.pageRank,
					};
					links.push(doc);
				}
			}
		} else {
			// Return all links according to limit
			links = await selectedSchema.find().limit(limit);
			links = links.map((link) => ({
				id: link._id,
				name: "Eric Leroux and David Addison",
				title: link.title,
				url: link.link,
				score: 0,
				pr: link.pageRank,
			}));
		}

		cache.set(cacheKey, links, 60);
		res.status(200).json(links);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
};

/*
	This function updates the database according to the update body and query of the request.
	Params:
	- req: request object
		- body: body of request
			- update: update to apply to database
			- link: link to update
	- res: response object
	- type: type of data to update (fruits or personal)
*/
export const updateLink = async (req, res, type) => {
	try {
		const { link, update } = req.body;
		const query = { link: link };
		let selectedSchema;
		if (type === "fruits") selectedSchema = FruitModel;
		else if (type === "personal") selectedSchema = PersonalModel;

		// If the incoming link already exists then make sure we don't push it again.
		// This usually happens when the crawler is ran more than once without clearing database
		if ("$push" in update) {
			const exists = await selectedSchema.exists({ link: link });
			if (exists) {
				const foundLink = await selectedSchema.findOne({ link: link });
				if (foundLink.incomingLinks.includes(update.$push.incomingLinks)) {
					return res.status(201).json({});
				}
			}
		}

		// Create a new resource if it does not exist, otherwise update it
		const newLink = await selectedSchema.findOneAndUpdate(query, update, {
			upsert: true,
			new: true,
			includeResultMetadata: true,
		});
		// Return status 201 if there was an update and 200 if a new resource was created
		res
			.status(newLink.lastErrorObject.updatedExisting ? 200 : 201)
			.json(newLink);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

/*
	This function calculates the page rank of each link in the database.
	Params:
	- req: request object
	- res: response object
	- type: type of data to calculate page rank for (fruits or personal)
*/
export const calculatePageRank = async (req, res, type) => {
	try {
		let selectedSchema;
		if (type === "fruits") selectedSchema = FruitModel;
		else if (type === "personal") selectedSchema = PersonalModel;
		let links = await selectedSchema.find();
		if (!links) {
			console.error("No links found");
		}

		// Create map of links to index in links array
		const linkIndexingMap = {};
		links.forEach((link, index) => {
			{
				linkIndexingMap[link.link] = index;
			}
		});

		// Create probability matrix
		const probabilityMatrix = new Matrix(links.length, links.length);
		links.forEach((link, row) => {
			link.outgoingLinks.forEach((outgoingLink) => {
				const col = linkIndexingMap[outgoingLink];
				probabilityMatrix.set(row, col, 1);
			});
		});

		// If a row has all 0's, then set each entry to links.length to simulate teleportation.
		// Otherwise, set each 1 to 1/numOnes to show the probability that a link will be chosen.
		for (let i = 0; i < probabilityMatrix.rows; i++) {
			const numOnes = probabilityMatrix
				.getRow(i)
				.reduce((count, value) => (value === 1 ? count + 1 : count), 0);
			if (numOnes == 0) {
				probabilityMatrix.setRow(
					i,
					Array(probabilityMatrix.columns).fill(1 / links.length)
				);
			} else {
				let editedRow = probabilityMatrix
					.getRow(i)
					.map((value) => (value * 1) / numOnes);
				probabilityMatrix.setRow(i, editedRow);
			}
		}

		// Multiply matrix by the chance that a link will be chosen
		probabilityMatrix.mul(1 - ALPHA);

		// Add the chance that a teleportation will occur
		let teleportationMatrix = new Matrix(links.length, links.length);
		for (let i = 0; i < probabilityMatrix.rows; i++) {
			teleportationMatrix.setRow(
				i,
				Array(probabilityMatrix.columns).fill(ALPHA / links.length)
			);
		}

		probabilityMatrix.add(teleportationMatrix);

		// Power iteration: multiply pageRanks matrix by probabilityMatrix until euclidean distance between last two vectors < 0.0001
		let pageRanks = new Matrix(1, links.length);
		pageRanks.set(0, 0, 1);
		let oldPageRanks;
		do {
			oldPageRanks = pageRanks.clone();
			pageRanks = pageRanks.mmul(probabilityMatrix);
		} while (
			Math.abs(oldPageRanks.norm() - pageRanks.norm()) >= EUC_STOPPING_THRESHOLD
		);

		// Save links
		links.forEach(async (link, column = 0) => {
			link.pageRank = pageRanks.get(0, column);
			link.save();
		});

		res.status(200).json(links);
	} catch (err) {
		res.status(400).json(err.message);
	}
};

/*
	This function adds links to the elasticlunr index.
	Params:
	- req: request object
	- res: response object
	- type: type of data to index (fruits or personal)
*/
export const indexLinks = async (req, res, type) => {
	try {
		let selectedSchema;
		if (type === "fruits") selectedSchema = FruitModel;
		else if (type === "personal") selectedSchema = PersonalModel;

		let links = await selectedSchema.find();
		if (!links) {
			console.error("no links found");
		}

		// Index links
		links.forEach((link) => {
			let doc = {
				id: link._id,
				title: link.title,
				paragraph: link.paragraph,
				outgoingLinks: link.outgoingLinks,
			};
			index.addDoc(doc);
		});

		res.status(200).json({ message: "Links indexed" });
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};
