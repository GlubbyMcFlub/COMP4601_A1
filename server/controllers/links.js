import mongoose from "mongoose";
import LinkModel from "../models/linkModel.js";
import { Matrix } from 'ml-matrix';

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

export const searchLinks = async (req, res) => {
	// const { query } = req.query;

	try {
		var links = await LinkModel.find().sort( {title: 1} );	//ascending by title
		var pageRanks = new Matrix(1, links.length);
		pageRanks.set(0,0,1);
		const alpha = 0.1;
		const euclideanStoppingThreshold = 0.0001;
		var probabilityMatrix = new Matrix(links.length, links.length);

		//populate probability matrix
		links.forEach((link, row = 0) => {
			link.outgoingLinks.forEach((outgoingLink) => {
				const column = links.findIndex((link) => link.link === outgoingLink);
				probabilityMatrix.set(row, column, 1);
			});
			row++;
		});
		//if a row has all 0's, then set each entry to links.length to simulate teleportation
		//otherwise, set each 1 to 1/numOnes to show the probability that a link will be chosen
		for(let i = 0; i < probabilityMatrix.rows; i++){
			const numOnes = probabilityMatrix.getRow(i).reduce((count, value) => (value === 1 ? count + 1 : count), 0);
			if(numOnes == 0){
				probabilityMatrix.setRow(i, Array(probabilityMatrix.columns).fill(1/links.length));
			}
			else{
				let editedRow = probabilityMatrix.getRow(i).map((value) => value * 1/numOnes);
				probabilityMatrix.setRow(i, editedRow);
			}
		}


		//multiply matrix by the chance that a link will be chosen
		probabilityMatrix.mul(1-alpha);

		//add the chance that a teleportation will occur
		let teleportationMatrix = new Matrix(links.length, links.length);
		for(let i = 0; i < probabilityMatrix.rows; i++){
			teleportationMatrix.setRow(i, Array(probabilityMatrix.columns).fill(alpha/links.length));
		}
		probabilityMatrix.add(teleportationMatrix);

		//power iteration. multiply pageRanks matrix by probabilityMatrix until euclidean distance between last two vectors < 0.0001
		let oldpageRanks;
		do{
			oldpageRanks = pageRanks.clone();
			pageRanks = pageRanks.mmul(probabilityMatrix);
		}while(Math.abs(oldpageRanks.norm() - pageRanks.norm()) >= euclideanStoppingThreshold);

		//create object which includes pageRanks
		var rankedLinks = links.map(function (link, column = 0) {
			return {
				url: link.link,
				pageRank: pageRanks.get(0, column),
			};
			row++;
		});
		rankedLinks.sort((a, b) => b.pageRank - a.pageRank);

		console.log(rankedLinks);

		// var pageRanks = 
		// const searchResults = index
		// 	.search(query, {
		// 		// TODO more experimentation and fine-tuning of our search algorithm
		// 		fields: {
		// 			paragraph: { boost: 3 },
		// 			title: { boost: 2 },
		// 			outgoingLinks: { boost: 1 },
		// 		},
		// 	})
		// 	.slice(0, 10);
		// if (searchResults.length === 0) {
		// 	res
		// 		.status(404)
		// 		.json({ message: "No results found with query: " + query });
		// } else {
		// 	var links = searchResults.map(function (result) {
		// 		var link = index.documentStore.getDoc(result.ref);
		// 		return {
		// 			paragraph: link.paragraph,
		// 			title: link.title,
		// 			url: link.link,
		// 			score: result.score,
		// 		};
		// 	});
		// }
		
		res.status(200).json(rankedLinks);
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
				outgoingLinks: linkModel.outgoingLinks,
			};

			index.addDoc(doc);
		});
		res.status(200).json({ message: "Index populated" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
