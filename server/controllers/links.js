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
	const { title, link, paragraph, outgoingLinks } = req.body;

	try {
		const doesLinkExist = await LinkModel.findOne({ link: link });

		if (doesLinkExist)
			return res.status(400).json({ message: "Link already exists" });

		const newLink = new LinkModel({
			title: title,
			link: link,
			paragraph: paragraph,
			outgoingLinks: outgoingLinks,
		});

		console.log("New link created: ", newLink.link);
		await newLink.save();
		res.status(201).json(newLink);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};
