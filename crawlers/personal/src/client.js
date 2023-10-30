import Crawler from "crawler";
import { EventEmitter } from "events";
import fetch from "node-fetch";

// Initial endpoint for personal crawler
const baseEndPoint = "http://localhost:5000/personal/";

// Initial URL to crawl
const baseURL = "https://starwars.fandom.com/wiki/";
const baseCrawl = "https://starwars.fandom.com/wiki/Main_Page";

// Crawler variables
const maxConnections = 1;
const maxRetries = 3;
const maxListeners = 20;
const rateLimit = 10;
const followRedirect = false;
EventEmitter.defaultMaxListeners = 20;

// Global variables
const maxPagesToAdd = 1000;
let pagesData = new Set();
let queuedLinks = new Set();
const blacklistedFileTypes = [
	"wav",
	"png",
	"jpg",
	"gif",
	"pdf",
	"mp3",
	"mp4",
	"ogg",
];
const blacklistedTokens = ["?", "#", "undefined"];
const blacklistedSites = ["UserLogin", "community.fandom.com"];

/*
	Checks if a URL is valid or not
	- URL must start with baseURL
	- URL must not contain any blacklisted sites
	- URL must not contain any blacklisted file types
	- URL must not contain any blacklisted tokens
	Params: 
	- url (string): the url to check
*/
function isValidUrl(url) {
	if (!url.startsWith(baseURL)) {
		return false;
	}
	for (const site of blacklistedSites) {
		if (url.includes(site)) {
			return false;
		}
	}
	for (const type of blacklistedFileTypes) {
		if (url.includes(type)) {
			return false;
		}
	}
	for (const token of blacklistedTokens) {
		if (url.includes(token)) {
			return false;
		}
	}
	return true;
}

/*
	This crawler crawls the personal website, and adds the data to the database.
	Pre-request:
	- only crawl pages that are part of the wiki (crawler should not go to other websites)
	- only crawl pages that are not blacklisted (crawler should not go to user login pages, etc)
	- only crawl pages that are not media files (crawler should not go to media files or invalid links)

	Callback:
	- extract data from DOM
	- add pages to pagesData
	- add outgoing links to queue

	Drain: 
	- add pages to database
	- calculate incoming links for each page
	- request server to index for each page
*/
const c = new Crawler({
	maxConnections: maxConnections,
	rateLimit: rateLimit,
	maxListeners: maxListeners,
	retries: maxRetries,
	followRedirect: followRedirect,
	preRequest: function (options, done) {
		try {
			if (isValidUrl(options.uri)) {
				done();
			} else {
				console.log("prerequest: ", options.uri);
				done();
			}
		} catch (error) {
			console.error("Error in preRequest:", error);
			done();
		}
	},
	callback: async function (error, res, done) {
		try {
			// 	if (error) {
			// 		console.error("Error:", error);
			// 	} else {
			// 		// Catch redirects
			// 		if (res.statusCode >= 300 && res.statusCode < 400) {
			// 			const redirectLocation = res.headers.location;
			// 			const isInvalidHeaders =
			// 				!res ||
			// 				!res.headers ||
			// 				!res.headers["content-type"] ||
			// 				!res.headers["content-type"].includes("text/html");
			// 			// Check if redirect location is valid
			// 			if (
			// 				queuedLinks.size < maxPagesToAdd &&
			// 				!isInvalidHeaders &&
			// 				isValidUrl(redirectLocation) &&
			// 				!queuedLinks.has(redirectLocation)
			// 			) {
			// 				queuedLinks.add(redirectLocation);
			// 				c.queue(redirectLocation);
			// 			}
			// 		} else if (res.statusCode === 200) {
			// 			// If not a redirect, extract data from DOM
			// 			const $ = res.$;
			// 			const baseUrl = new URL(res.options.uri);
			// 			const url = baseUrl.href;
			// 			const hasParagraph = $("p").length > 0;
			// 			// If page has paragraph, add to pagesData
			// 			if (!pagesData[url] && hasParagraph) {
			// 				const outgoingLinks = $("a")
			// 					.map(function () {
			// 						const link = new URL($(this).attr("href"), baseUrl);
			// 						return link.href;
			// 					})
			// 					.get();
			// 				const paragraph = $("p").text().trim().replace(/\s+/g, " ");
			// 				const title = $("title").text();
			// 				// Separate paragraph into array of words
			// 				const words = paragraph.match(/\b\w+\b/g);
			// 				let wordFrequencies = {};
			// 				// Calculate word frequencies
			// 				if (words) {
			// 					words.forEach((word) => {
			// 						if (!/^\d+$/.test(word)) {
			// 							const lowercaseWord = word.toLowerCase();
			// 							wordFrequencies[lowercaseWord] =
			// 								(wordFrequencies[lowercaseWord] || 0) + 1;
			// 						}
			// 					});
			// 					wordFrequencies = Object.entries(wordFrequencies)
			// 						.sort((a, b) => b[1] - a[1])
			// 						.slice(0, 10);
			// 				}
			// 				// Add page to pagesData
			// 				pagesData[url] = {
			// 					title: title,
			// 					paragraph: paragraph,
			// 					outgoingLinks: outgoingLinks,
			// 					wordFrequencies: wordFrequencies,
			// 					complete: true,
			// 				};
			// 				// Add outgoing links to queue
			// 				outgoingLinks.forEach((outgoingLink) => {
			// 					if (
			// 						queuedLinks.size < maxPagesToAdd &&
			// 						isValidUrl(outgoingLink) &&
			// 						!queuedLinks.has(outgoingLink)
			// 					) {
			// 						queuedLinks.add(outgoingLink);
			// 						c.queue(outgoingLink);
			// 					}
			// 				});
			// 			}
			// 		}
			// 	}
		} catch (err) {
			console.error("Callback Error:", err);
		} finally {
			done();
		}
	},
});

c.queue(baseCrawl);
// queuedLinks.add(baseCrawl);

c.on("drain", async function () {
	try {
		// Calculate incomingLinks
		for (const url in pagesData) {
			if (pagesData[url].complete && pagesData[url].outgoingLinks) {
				if (!pagesData[url].incomingLinks) {
					pagesData[url].incomingLinks = new Set();
				}
				pagesData[url].outgoingLinks.forEach((outgoingLink) => {
					if (pagesData[outgoingLink]) {
						if (!pagesData[outgoingLink].incomingLinks) {
							pagesData[outgoingLink].incomingLinks = new Set();
						}
						pagesData[outgoingLink].incomingLinks.add(url);
					}
				});
			}
		}
		// Add pages to database
		for (const url in pagesData) {
			if (pagesData[url].complete) {
				const body = {
					update: {
						$set: {
							title: pagesData[url].title,
							link: url,
							paragraph: pagesData[url].paragraph,
							outgoingLinks: pagesData[url].outgoingLinks,
							incomingLinks: Array.from(pagesData[url].incomingLinks),
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

		// Tell the server to index and calculate pageRanks
		const indexResponse = await fetch(baseEndPoint + "index/", {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
		});
		await indexResponse.json();
		if (indexResponse.status != 200) {
			console.error("Error indexing on drain");
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
	} catch (err) {
		console.error("Error on drain: ", err.message);
	}
});
