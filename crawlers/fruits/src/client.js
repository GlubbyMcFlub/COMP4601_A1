import Crawler from "crawler";
import fetch from "node-fetch";

const baseEndPoint = "http://localhost:5000/fruits/";

const startTime = new Date();

const c = new Crawler({
	maxConnections: 1,
	callback: async function (error, res, done) {
		if (error) {
			console.error(error);
		} else {
			const $ = res.$;
			const baseUrl = new URL(res.options.uri);
			const url = baseUrl.href;
			const outgoingLinks = $("a")
				.map(function () {
					const link = new URL($(this).attr("href"), baseUrl);
					return link.href;
				})
				.get();

			const paragraph = $("p").text();

			//separate paragraph into array of words
			const words = paragraph.match(/\b\w+\b/g);

			let wordFrequencies = {};

			//calculate word frequencies
			words.forEach((word) => {
				if (wordFrequencies[word]) {
					wordFrequencies[word]++;
				} else {
					wordFrequencies[word] = 1;
				}
			});

			//sort and get top 10 most frequent words
			wordFrequencies = Object.entries(wordFrequencies).sort(
				(a, b) => b[1] - a[1]
			);
			wordFrequencies - wordFrequencies.slice(0, 10);

			const body = {
				update: {
					$set: {
						title: $("title").text(),
						link: url,
						paragraph: paragraph,
						outgoingLinks: outgoingLinks,
						wordFrequencies: wordFrequencies,
					},
				},
				link: url,
			};

			try {
				const response = await fetch(baseEndPoint, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(body),
				});

				const data = await response.json();

				if (response.status === 200 || response.status === 201) {
					outgoingLinks.forEach(async (outgoingLink) => {
						let outgoingLinkBody = {
							update: {
								$set: { link: outgoingLink },
								$push: { incomingLinks: url },
							},
							link: outgoingLink,
						};

						const outgoingLinkResponse = await fetch(baseEndPoint, {
							method: "PUT",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify(outgoingLinkBody),
						});
						const outgoingLinkData = await outgoingLinkResponse.json();
						if (outgoingLinkResponse.status === 200) {
							c.queue(outgoingLink);
						} else if (outgoingLinkResponse.status != 201) {
							console.error(
								"Failed to add outgoing link. Error: ",
								outgoingLinkData.message
							);
						}
					});
				} else {
					console.error("Failed to add link. Error: ", data.message);
				}
			} catch (err) {
				console.error("Error: ", err.message);
			}
		}
		done();
	},
});

//c.queue("https://people.scs.carleton.ca/~davidmckenney/tinyfruits/N-0.html");
c.queue("https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html");

c.on("drain", async function () {
	try {
		const scoreResponse = await fetch(baseEndPoint + "score/", {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
		});
		await scoreResponse.json();
		if (scoreResponse.status != 200) {
			console.error("Error calculating scores on drain");
		}

		const pageRankResponse = await fetch(baseEndPoint + "pageRank/", {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
		});
		await pageRankResponse.json();
		if (pageRankResponse.status != 200) {
			console.error("Error calculating pageRanks on drain");
		}

		const endTime = new Date();
		const totalTime = Math.round((endTime - startTime) / 1000);
		console.log("Finished in " + totalTime + " seconds");
	} catch (err) {
		console.error("Error on drain: ", err.message);
	}
});
