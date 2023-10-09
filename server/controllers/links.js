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
            { $limit: 10 }
        ]);
		
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
			},
			{ new: true });
			await newLink.save();
			res.status(200).json(newLink);
		} else {
			let newLink = new LinkModel({
				paragraph: paragraph,
				link: link,
				title: title,
				outgoingLinks: outgoingLinks,
				incomingLinks: incomingLink ? [incomingLink] : [],
			});
			await newLink.save();
			res.status(201).json(newLink); 
		}
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};