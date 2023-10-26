import mongoose from "mongoose";
import LinkModel from "../models/linkModel.js";

// import elasticlunr from "elasticlunr";
// // Initialize ElasticLunr index
// const index = elasticlunr(function () {
// 	this.addField("title");
// 	this.addField("paragraph");
// 	this.addField("outgoingLinks");
// 	this.setRef("id");
// });
// index.addDoc({id: "hfiwoefioew"});

export const search = async (req, res) => {
  try {
    const { id, link } = req.query;

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

// export const createLink = async (req, res) => {
// 	const { paragraph, link, title, outgoingLinks, incomingLink, score, pageRank } = req.body;
// 	// const query = { link: link };

// 	try {
// 		// const exists = await LinkModel.exists(query);
// 		// if (exists) {
// 		// 	let newLink = await LinkModel.findOneAndUpdate(
// 		// 		query,
// 		// 		{
// 		// 			paragraph: paragraph,
// 		// 			title: title,
// 		// 			outgoingLinks: outgoingLinks,
// 		// 			$push: { incomingLinks: incomingLink },
// 		// 		},
// 		// 		{ new: true }
// 		// 	);
// 		// 	await newLink.save();
// 		// 	res.status(200).json(newLink);
// 		// }
// 		// } else {
// 		// 	let newLink = new LinkModel({
// 		// 		paragraph: paragraph,
// 		// 		link: link,
// 		// 		title: title,
// 		// 		outgoingLinks: outgoingLinks,
// 		// 		incomingLinks: incomingLink ? [incomingLink] : [],
// 		// 	});
// 		// 	await newLink.save();
// 		// 	res.status(201).json(newLink);
// 		// }
// 		let newLink = await LinkModel.findOneAndUpdate(
// 			query,
// 			{
// 				paragraph: paragraph ? paragraph : "",
// 				title: title,
// 				outgoingLinks: outgoingLinks,
// 				$push: { incomingLinks: incomingLink },
// 			},
// 			{ new: true }
// 		);
// 		await newLink.save();
// 		res.status(200).json(newLink);
// 	} catch (error) {
// 		res.status(400).json({ message: error.message });
// 	}
// };

export const updateLink = async (req, res) => {
  const { link, update } = req.body;
  const query = { link: link };

  try {
    // console.log(link);
    const newLink = await LinkModel.findOneAndUpdate(query, update, {
      upsert: true,
      new: true,
      includeResultMetadata: true,
    });
    // if (newLink) {
    //   if (newLink.createdAt == newLink.updatedAt) {
    //     console.log("created");
    //   } else {
    //     console.log("updated");
    //   }
    // } else {
    //   console.log("doc NOT updated");
    // }
    if (newLink.lastErrorObject.updatedExisting) {
      res.status(201).json(newLink);
    } else {
      res.status(200).json(newLink);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// export const searchLinks = async (req, res) => {
// 	//const { query } = req.query;
// 	const ALPHA = 0.1;
// 	const EUC_STOPPING_THRESHOLD = 0.0001;

// 	try {
// 		const links = await LinkModel.find().sort({ title: 1 }); //ascending by title
// 		//create map of links to index in links array
// 		const linkIndexingMap = {};
// 		links.forEach((link, index) => {
// 			{
// 				linkIndexingMap[link.link] = index;
// 			}
// 		});

// 		//create probability matrix
// 		const probabilityMatrix = new Matrix(links.length, links.length);
// 		links.forEach((link, row) => {
// 			link.outgoingLinks.forEach((outgoingLink) => {
// 				const col = linkIndexingMap[outgoingLink];
// 				probabilityMatrix.set(row, col, 1);
// 			});
// 		});

// 		//if a row has all 0's, then set each entry to links.length to simulate teleportation
// 		//otherwise, set each 1 to 1/numOnes to show the probability that a link will be chosen
// 		for (let i = 0; i < probabilityMatrix.rows; i++) {
// 			const numOnes = probabilityMatrix
// 				.getRow(i)
// 				.reduce((count, value) => (value === 1 ? count + 1 : count), 0);
// 			if (numOnes == 0) {
// 				probabilityMatrix.setRow(
// 					i,
// 					Array(probabilityMatrix.columns).fill(1 / links.length)
// 				);
// 			} else {
// 				let editedRow = probabilityMatrix
// 					.getRow(i)
// 					.map((value) => (value * 1) / numOnes);
// 				probabilityMatrix.setRow(i, editedRow);
// 			}
// 		}

// 		//multiply matrix by the chance that a link will be chosen
// 		probabilityMatrix.mul(1 - ALPHA);

// 		//add the chance that a teleportation will occur
// 		let teleportationMatrix = new Matrix(links.length, links.length);
// 		for (let i = 0; i < probabilityMatrix.rows; i++) {
// 			teleportationMatrix.setRow(
// 				i,
// 				Array(probabilityMatrix.columns).fill(ALPHA / links.length)
// 			);
// 		}

// 		probabilityMatrix.add(teleportationMatrix);

// 		//power iteration. multiply pageRanks matrix by probabilityMatrix until euclidean distance between last two vectors < 0.0001
// 		let pageRanks = new Matrix(1, links.length);
// 		pageRanks.set(0, 0, 1);
// 		let oldPageRanks;
// 		do {
// 			oldPageRanks = pageRanks.clone();
// 			pageRanks = pageRanks.mmul(probabilityMatrix);
// 		} while (
// 			Math.abs(oldPageRanks.norm() - pageRanks.norm()) >= EUC_STOPPING_THRESHOLD
// 		);

// 		//create object which includes pageRanks
// 		var rankedLinks = links.map(function (link, column = 0) {
// 			return {
// 				url: link.link,
// 				pageRank: pageRanks.get(0, column).toFixed(10),
// 			};
// 		});

// 		rankedLinks.sort((a, b) => b.pageRank - a.pageRank);

// 		//var pageRanks =

// 		//res.status(200).json(rankedLinks);
// 	} catch (error) {
// 		res.status(500).json({ message: error.message });
// 	}
// };

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
        // url: link.link,
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
