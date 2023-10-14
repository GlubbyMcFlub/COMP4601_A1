import elasticlunr from "elasticlunr";
import mongoose from "mongoose";
import LinkModel from "../models/linkModel.js";

const index = elasticlunr(function () {
	this.addField("paragraph");
	this.addField("title");
	this.addField("link");
	this.setRef("id");
});

export const getLinks = async (req, res) => {
	try {
		const { id } = req.query;

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
		} else {
			links = await LinkModel.find().populate("incomingLinks");
		}

		res.status(200).json(links);
	} catch (error) {
		res.status(500).json({ message: error.message });
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

export const createLink = async (req, res) => {
	const { paragraph, link, title, outgoingLinks, incomingLink } = req.body;
	const query = { link: link };

	try {
		const exists = await LinkModel.exists(query);
		if (exists) {
			let newLink = await LinkModel.findOneAndUpdate(
				query,
				{
					paragraph: paragraph,
					title: title,
					outgoingLinks: outgoingLinks,
					$push: { incomingLinks: incomingLink },
				},
				{ new: true }
			);
			await newLink.save().then((savedLink) => {
				let doc = {
					id: savedLink.id,
					paragraph: savedLink.paragraph,
					link: savedLink.link,
					title: savedLink.title,
				};
				index.addDoc(doc);
			});
			res.status(200).json(newLink);
		} else {
			let newLink = new LinkModel({
				paragraph: paragraph,
				link: link,
				title: title,
				outgoingLinks: outgoingLinks,
				incomingLinks: incomingLink ? [incomingLink] : [],
			});
			await newLink.save().then((savedLink) => {
				if (paragraph && title) {
					// TODO update schema with a field that indicates whether the page has been visited
					// Create locally stored version of link after saving to the DB, only if the page has been visited

					let doc = {
						id: savedLink.id,
						paragraph: paragraph,
						link: link,
						title: title,
					};
					index.addDoc(doc);
				} else console.log("Page has not been visited yet");
			});
			res.status(201).json(newLink);
		}
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

export const searchLinks = async (req, res) => {
	const { query } = req.query;

	try {
		const searchResults = index
			.search(query, {
				fields: { paragraph: { boost: 1 }, title: { boost: 2 } },
			})
			.slice(0, 10);
		if (searchResults.length === 0) {
			res.status(404).json({ message: "No links found with query: " + query });
		} else {
			var links = searchResults.map(function (result) {
				var link = index.documentStore.getDoc(result.ref);
				return {
					paragraph: link.paragraph,
					title: link.title,
					url: link.link,
					score: result.score,
				};
			});
		}
		res.status(200).json(links);
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
				paragraph: linkModel.paragraph,
				title: linkModel.title,
				link: linkModel.link,
			};

			index.addDoc(doc);
		});
		res.status(200).json({ message: "Index populated" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
