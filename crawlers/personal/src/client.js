import Crawler from "crawler";
import fetch from "node-fetch";

const baseEndPoint = "http://localhost:5000/personal/";

const baseCrawl = "https://legiontd2.fandom.com/wiki/";
const maxPagesToVisit = 30;
const rateLimit = 10;
const pagesData = {};
let queuedLinks = new Set();

const c = new Crawler({
	maxConnections: 1,
	rateLimit: rateLimit,
	maxListeners: 20,
	retries: 3,
	// followRedirect: false,
	preRequest: function (options, done) {
		const isHTML = options.uri.endsWith(".html");
		// const isHTML = options.uri.includes(".html");
		// const isWikiPage = options.uri.startsWith(baseCrawl);
		const isNotFile = !options.uri.match(/\.(wav|png|jpg|gif|pdf|#)$/i); // Exclude specific file extensions
		// console.log(isWikiPage, isNotFile);

		if (isHTML && isNotFile) {
			done();
		} else {
			console.log(isHTML, isWikiPage, isNotFile);
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

				if (!pagesData[url]) {
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

					const paragraph = $("p").text().trim().replace(/\s+/g, " ");
					const title = $("title").text();

					// Separate paragraph into an array of words
					const words = paragraph.match(/\b\w+\b/g);

					let wordFrequencies = {};

					// Calculate word frequencies
					if (words) {
						words.forEach((word) => {
							wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
						});
						// Sort and get the top 10 most frequent words
						wordFrequencies = Object.entries(wordFrequencies)
							.sort((a, b) => b[1] - a[1])
							.slice(0, 10);
					}

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

					// Queue outgoing links for further crawling
					outgoingLinks.forEach((outgoingLink) => {
						if (
							!queuedLinks.has(outgoingLink) &&
							queuedLinks.size < maxPagesToVisit
						) {
							queuedLinks.add(outgoingLink);
							c.queue(outgoingLink);
							// console.log(c.queue.length, queuedLinks.size);
						}
					});

					if (hasNecessaryInfo) {
						pagesData[url].complete = true; // Mark the page as complete
					}
				} else {
					// console.log("Skipping already visited or incomplete page: ", url);
				}
			}
		} catch (err) {
			console.error("Callback Error:", err);
		} finally {
			done();
		}
	},
});

// c.queue("https://people.scs.carleton.ca/~davidmckenney/tinyfruits/N-0.html");
c.queue("https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html");
// c.queue(baseCrawl);

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
