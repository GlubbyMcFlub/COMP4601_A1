import mongoose from "mongoose";
import LinkModel from "../models/linkModel.js";

export const getLinks = async (req, res) => {
	try {
		const { id } = req.query;

		let links;

		if (id) {
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).json({ message: "Invalid link ID" });
			}
			const foundLink = await LinkModel.findById(id).populate("incomingLinks");
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
		const links = await LinkModel.find()
			.sort({ numIncomingLinks: -1 })
			.limit(10)
			.populate("incomingLinks");
		res.status(200).json(links);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

export const createLink = async (req, res) => {
	const { paragraph, link, title, outgoingLinks, incomingLink } = req.body;
	const query = {link: link};

	try {
		const exists = await LinkModel.exists(query);
		if (exists) {
			let newLink = await LinkModel.findOneAndUpdate(query, {
				paragraph: paragraph,
				title: title,
				outgoingLinks: outgoingLinks,
				$push: { incomingLinks: incomingLink},
			});
			console.log("UPDATED: ", newLink.link);
			await newLink.save();
			res.status(200).json(newLink);
		} else {
			console.log("incominglink: ", incomingLink);
			let newLink = new LinkModel({
				paragraph: paragraph,
				link: link,
				title: title,
				outgoingLinks: outgoingLinks,
				incomingLinks: [incomingLink],
				// $push: { incomingLinks: incomingLink},
			});
			console.log("CREATED: ", newLink.link);
			await newLink.save();
			res.status(201).json(newLink); 
		}
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

// export const updateLink = async (req, res) => {
// 	const { url, incomingLink } = req.body;

// 	try {
// 		const link = await LinkModel.findOneAndUpdate({ link: url}, { $push: {incomingLinks: incomingLink }});

// 		await link.save();
// 		res.status(201).json(link);
// 	} catch (error) {
// 		res.status(400).json({ message: error.message });
// 	}
// };
