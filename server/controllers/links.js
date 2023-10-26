import elasticlunr from "elasticlunr";
import { Matrix } from "ml-matrix";
import mongoose from "mongoose";
import LinkModel from "../models/linkModel.js";

// Initialize ElasticLunr index
const index = elasticlunr(function () {
	this.addField("title");
	this.addField("paragraph");
	this.addField("outgoingLinks");
	this.setRef("id");
});

export const search = async (req, res) => {
	try {
		const { id, link, q, boost, limit } = req.query;

		let links;

		if (id) {
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).json({ message: "Invalid link ID" });
			}
			const foundLink = await LinkModel.findById(id);
			if (!foundLink) {
				return res.status(404).json({ message: "Link not found" });
			}
			res.status(200).json(foundLink);
			return;
		} else if (link) {
			const exists = await LinkModel.exists({ link: link });
			if (exists) {
				const foundLink = await LinkModel.findOne({ link: link });
				return res.status(200).json(foundLink);
			} else {
				return res.status(404).json({ message: "Link not found" });
			}
		} else if (q) {
			const searchResults = index.search(q, {
				fields: {
					paragraph: { boost: 3 },
					title: { boost: 2 },
					outgoingLinks: { boost: 1 },
				},
			});

			links = await Promise.all(
				searchResults.map(async (result) => {
					let link = await LinkModel.findById(result.ref);
					let doc = {
						paragraph: link.paragraph,
						title: link.title,
						url: link.link,
						score: result.score,
						incomingLinks: link.incomingLinks,
						outgoingLinks: link.outgoingLinks,
						wordFrequencies: [...link.wordFrequencies]
							.sort((a, b) => b[1] - a[1])
							.slice(0, 10),
						pageRank: link.pageRank,
					};
					return doc;
				})
			);

			// links = links
			// 	.sort((a, b) =>
			// 		boost
			// 			? b.score() * b.pageRank - a.score() * a.pageRank
			// 			: b.score() - a.score()
			// 	)
			// 	.slice(0, limit);

			return res.status(200).json(links.slice(0, limit));
		} else {
			links = await LinkModel.find();
		}

		res.status(200).json(links);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
};

export const getPopular = async (req, res) => {
	try {
		const links = await LinkModel.aggregate([
			{ $addFields: { numIncomingLinks: { $size: "$incomingLinks" } } },
			{ $sort: { numIncomingLinks: -1 } },
			{ $limit: 10 },
		]);

		res.status(200).json(links);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

export const updateLink = async (req, res) => {
	const { link, update } = req.body;
	const query = { link: link };

	try {
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

export const searchLinks = async (req, res) => {
	const { query } = req.query;

	try {
		const searchResults = index
			.search(query, {
				fields: {
					paragraph: { boost: 3 },
					title: { boost: 2 },
					outgoingLinks: { boost: 1 },
				},
			})
			.slice(0, 10);

		const links = searchResults.map(function (result) {
			const link = index.documentStore.getDoc(result.ref);
			return {
				paragraph: link.paragraph,
				title: link.title,
				url: link.link,
				score: result.score,
			};
		});

		res.status(200).json(links);
		// need to support for postman the following:
		// name, url, score, title, pr
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Alternative to running the crawler every time the server starts
export const populateIndex = async (req, res) => {
	try {
		const linkModels = await LinkModel.find();

		linkModels.forEach((linkModel) => {
			const doc = {
				id: linkModel.id,
				title: linkModel.title,
				paragraph: linkModel.paragraph,
				outgoingLinks: linkModel.outgoingLinks.join(" "), // Join outgoingLinks as a string
			};

			index.addDoc(doc);
		});

		res.status(200).json({ message: "Index populated" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
