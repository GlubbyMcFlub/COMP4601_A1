import elasticlunr from "elasticlunr";
import { Matrix } from "ml-matrix";
import mongoose from "mongoose";
import NodeCache from "node-cache";
import LinkModel from "../models/linkModel.js";

// Initialize ElasticLunr index
const index = elasticlunr(function () {
	this.addField("title");
	this.addField("paragraph");
	this.addField("outgoingLinks");
	this.addField("wordFrequencies");
	this.setRef("id");
});

const cache = new NodeCache({ stdTTL: 60 });

export const search = async (req, res) => {
	try {
		const { id, q, boost, limit } = req.query;
		const applyBoost = boost === "true";
		const cacheKey = `search:${q}:${applyBoost}:${limit}`;
		let links;

		const cachedResult = cache.get(cacheKey);
		if (cachedResult) {
			return res.status(200).json(cachedResult);
		}

		if (id) {
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).json({ message: "Invalid link ID" });
			}
			const foundLink = await LinkModel.findById(id);
			if (!foundLink) {
				return res.status(404).json({ message: "Link not found" });
			}
			links = {
				id: foundLink._id,
				name: "Eric Leroux and David Addison",
				paragraph: foundLink.paragraph,
				title: foundLink.title,
				url: foundLink.link,
				incomingLinks: foundLink.incomingLinks,
				outgoingLinks: foundLink.outgoingLinks,
				wordFrequencies: [...foundLink.wordFrequencies]
					.sort((a, b) => b[1] - a[1])
					.slice(0, 10),
				pr: foundLink.pageRank,
			};
		} else if (q) {
			const searchResults = index.search(q, {
				fields: {
					paragraph: { boost: 3 },
					title: { boost: 2 },
					outgoingLinks: { boost: 1 },
					wordFrequencies: { boost: 4 },
				},
			});

			const linkIds = searchResults.map((result) => result.ref);
			const dbLinks = await LinkModel.find({ _id: { $in: linkIds } });

			links = searchResults.map((result) => {
				const foundLink = dbLinks.find(
					(link) => link._id.toString() === result.ref
				);
				return {
					id: result.ref ? result.ref : "",
					name: "Eric Leroux and David Addison",
					title: foundLink.title ? foundLink.title : "",
					url: foundLink.link ? foundLink.link : "",
					score: result.score ? result.score : 0,
					pr: foundLink.pageRank ? foundLink.pageRank : 0,
				};
			});

			if (!applyBoost) {
				links.sort((a, b) => b.score - a.score);
			} else {
				links.sort((a, b) => b.score * b.pr - a.score * a.pr);
			}

			links = links.slice(0, limit);
		} else {
			links = await LinkModel.find().limit(limit);
			links = links.map((link) => ({
				id: link._id,
				title: link.title,
				paragraph: link.paragraph,
				outgoingLinks: link.outgoingLinks,
			}));
		}

		cache.set(cacheKey, links, 60);
		res.status(200).json(links);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
};

export const updateLink = async (req, res) => {
	const { link, update } = req.body;
	const query = { link: link };

	try {
		//if incoming link already exists then make sure we don't push it again
		//usually happens when crawler is ran twice without clearing database
		if ("$push" in update) {
			const exists = await LinkModel.exists({ link: link });
			if (exists) {
				const foundLink = await LinkModel.findOne({ link: link });
				if (foundLink.incomingLinks.includes(update.$push.incomingLinks)) {
					return res.status(201).json({});
				}
			}
		}
		const newLink = await LinkModel.findOneAndUpdate(query, update, {
			upsert: true,
			new: true,
			includeResultMetadata: true,
		});
		if (newLink.lastErrorObject.updatedExisting) {
			res.status(201).json(newLink);
		} else {
			res.status(200).json(newLink);
		}
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

export const calculatePageRank = async (req, res) => {
	try {
		let links = await LinkModel.find();
		if (!links) {
			console.error("no links found");
		}

		const ALPHA = 0.1;
		const EUC_STOPPING_THRESHOLD = 0.0001;

		//create map of links to index in links array
		const linkIndexingMap = {};
		links.forEach((link, index) => {
			{
				linkIndexingMap[link.link] = index;
			}
		});

		//create probability matrix
		const probabilityMatrix = new Matrix(links.length, links.length);
		links.forEach((link, row) => {
			link.outgoingLinks.forEach((outgoingLink) => {
				const col = linkIndexingMap[outgoingLink];
				probabilityMatrix.set(row, col, 1);
			});
		});

		//if a row has all 0's, then set each entry to links.length to simulate teleportation
		//otherwise, set each 1 to 1/numOnes to show the probability that a link will be chosen
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

		//multiply matrix by the chance that a link will be chosen
		probabilityMatrix.mul(1 - ALPHA);

		//add the chance that a teleportation will occur
		let teleportationMatrix = new Matrix(links.length, links.length);
		for (let i = 0; i < probabilityMatrix.rows; i++) {
			teleportationMatrix.setRow(
				i,
				Array(probabilityMatrix.columns).fill(ALPHA / links.length)
			);
		}

		probabilityMatrix.add(teleportationMatrix);

		//power iteration. multiply pageRanks matrix by probabilityMatrix until euclidean distance between last two vectors < 0.0001
		let pageRanks = new Matrix(1, links.length);
		pageRanks.set(0, 0, 1);
		let oldPageRanks;
		do {
			oldPageRanks = pageRanks.clone();
			pageRanks = pageRanks.mmul(probabilityMatrix);
		} while (
			Math.abs(oldPageRanks.norm() - pageRanks.norm()) >= EUC_STOPPING_THRESHOLD
		);

		//save links
		links.forEach(async (link, column = 0) => {
			link.pageRank = pageRanks.get(0, column);
			link.save();
		});

		res.status(200).json(links);
	} catch (err) {
		res.status(400).json(err.message);
	}
};

export const indexLinks = async (req, res) => {
	try {
		let links = await LinkModel.find();
		if (!links) {
			console.error("no links found");
		}

		//index links
		links.forEach((link) => {
			let doc = {
				id: link._id,
				title: link.title,
				paragraph: link.paragraph,
				outgoingLinks: link.outgoingLinks,
			};
			index.addDoc(doc);
		});

		res.status(200).json({});
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};
