import Crawler from "crawler";
import fetch from "node-fetch";

const baseEndPoint = "http://localhost:5000/personal/";

let pagesAdded = 0;
const maxPagesToVisit = 5;
const rateLimit = 1000;
const pagesData = {};

const c = new Crawler({
	maxConnections: 10,
	rateLimit: rateLimit,
	preRequest: function (options, done) {
		if (options.uri.endsWith(".html")) {
			done();
		} else {
			done(null, false);
		}
	},
	callback: async function (error, res, done) {
		try {
			if (error) {
				console.error("Error:", error);
			} else {
				const $ = res.$;
				const baseUrl = new URL(res.options.uri);
				const url = baseUrl.href;

				if (!pagesData[url] && pagesAdded < maxPagesToVisit) {
					const outgoingLinks = $("a")
						.map(function () {
							const link = new URL($(this).attr("href"), baseUrl);
							return link.href;
						})
						.get();

					const incomingLinks = []; // Array to store incoming links

					// Find and store incoming links
					$("a").each(function () {
						const incomingLink = new URL($(this).attr("href"), baseUrl).href;
						incomingLinks.push(incomingLink);
					});

					const paragraph = $("p").text();
					const title = $("title").text();

					// Separate paragraph into an array of words
					const words = paragraph.match(/\b\w+\b/g);

					let wordFrequencies = {};

					// Calculate word frequencies
					words.forEach((word) => {
						wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
					});

					// Sort and get the top 10 most frequent words
					wordFrequencies = Object.entries(wordFrequencies)
						.sort((a, b) => b[1] - a[1])
						.slice(0, 10);

					pagesData[url] = {
						title: title,
						paragraph: paragraph,
						outgoingLinks: outgoingLinks,
						incomingLinks: incomingLinks,
						wordFrequencies: wordFrequencies,
						complete: false, // Mark the page as incomplete initially
					};

					// Check if the page has all necessary information
					const hasNecessaryInfo =
						title !== "" &&
						paragraph !== "" &&
						outgoingLinks.length > 0 &&
						incomingLinks.length > 0 &&
						wordFrequencies.length > 0;

					if (hasNecessaryInfo) {
						pagesData[url].complete = true; // Mark the page as complete
						pagesAdded++;
					}

					// Queue outgoing links for further crawling
					outgoingLinks.forEach((outgoingLink) => {
						if (!pagesData[outgoingLink]) {
							c.queue(outgoingLink);
						}
					});
				} else {
					console.log("Skipping already visited or incomplete page: ", url);
				}
			}
		} catch (err) {
			console.error("Callback Error:", err);
		} finally {
			done();
		}
	},
});

c.queue("https://people.scs.carleton.ca/~davidmckenney/tinyfruits/N-0.html");

c.on("drain", async function () {
	try {
		for (const url in pagesData) {
			if (pagesData[url].complete) {
				const body = {
					update: {
						$set: {
							title: pagesData[url].title,
							link: url,
							paragraph: pagesData[url].paragraph,
							outgoingLinks: pagesData[url].outgoingLinks,
							incomingLinks: pagesData[url].incomingLinks,
							wordFrequencies: pagesData[url].wordFrequencies,
						},
					},
					link: url,
				};

				const response = await fetch(baseEndPoint, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(body),
				});

				const data = await response.json();

				if (response.status === 200 || response.status === 201) {
					console.log("Added to database: ", url);
				} else {
					console.error("Failed to add link. Error: ", data.message);
				}
			} else {
				console.log("Skipping incomplete page: ", url);
			}
		}
	} catch (err) {
		console.error("Error on drain: ", err.message);
	}
});
