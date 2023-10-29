import Crawler from "crawler";
import { EventEmitter } from "events";
import fetch from "node-fetch";

// Initial endpoint for personal crawler
const baseEndPoint = "http://localhost:5000/personal/";
const baseCrawl = "https://legiontd2.fandom.com/wiki/";
// const baseCrawl =
// 	"https://legiontd2.fandom.com/wiki/Chloropixie?action=history";

// Crawler variables
const maxConnections = 1;
const maxRetries = 3;
const maxListeners = 20;
const rateLimit = 10;
const followRedirect = false;
EventEmitter.defaultMaxListeners = 20;

// Global variables
const maxPagesToVisit = 1000;
let pagesData = new Set();
let queuedLinks = new Set();
const blacklisted = [
	"UserLogin",
	"auth.fandom.com/kratos-public/self-service/login/browser",
	"community.fandom.com",
];

/*
	This crawler crawls the personal website, and adds the data to the database.
	Pre-request:
	- only crawl pages that are part of the wiki (crawler should not go to other websites)
	- only crawl pages that are not blacklisted (crawler should not go to user login pages, etc)
	- only crawl pages that are not media files (crawler should not go to media files or invalid links)

	Drain: 
	- add pages to database
	- calculate incoming links for each page
	- request server to calculate scores for each page

	Params: 
	- maxConnections (number): the maximum number of connections to make at once
	- maxRetries (number): the maximum number of retries to make
	- maxListeners (number): the maximum number of listeners for the crawler
	- rateLimit (number): the rate limit for the crawler
	- followRedirect (boolean): whether to follow redirects manually or not
*/

let isGood = false;
const c = new Crawler({
	maxConnections: maxConnections,
	rateLimit: rateLimit,
	maxListeners: maxListeners,
	retries: maxRetries,
	followRedirect: followRedirect,
	preRequest: function (options, done) {
		try {
			const isWikiPage = options.uri.startsWith(baseCrawl);
			const isQuery =
				options.uri.includes("?") || options.uri.includes("?action=");
			const notBlacklisted = !blacklisted.some((keyword) =>
				options.uri.includes(keyword)
			);
			const isValidUrl = !options.uri.match(
				/\.(wav|png|jpg|gif|pdf|#|mp3|mp4)$/i
			);

			if (isWikiPage && isValidUrl && notBlacklisted && !isQuery) {
				isGood = true;
				console.log("Crawling:", options.uri);
				done();
			} else {
				console.log("Skipping invalid URL:", options.uri);
				isGood = false;
				done();
			}
		} catch (error) {
			console.error("Error in preRequest:", error);
			isGood = false;
			done();
		}
	},
	callback: async function (error, res, done) {
		try {
			if (error) {
				console.error("Error:", error);
			} else {
				// Catch redirects
				if (res.statusCode >= 300 && res.statusCode < 400) {
					const redirectLocation = res.headers.location;
					const hasQ = redirectLocation.includes("?");
					const check =
						!res ||
						!res.headers ||
						!res.headers["content-type"] ||
						!res.headers["content-type"].includes("text/html") ||
						!isGood ||
						hasQ;
					const notBlacklisted = !blacklisted.some((keyword) =>
						redirectLocation.includes(keyword)
					);
					// Check if redirect location is valid
					if (
						!queuedLinks.has(redirectLocation) &&
						notBlacklisted &&
						queuedLinks.size < maxPagesToVisit &&
						!check
					) {
						queuedLinks.add(redirectLocation);
						c.queue(redirectLocation);
					}
				} else if (res.statusCode === 200) {
					// If not a redirect, extract data from DOM
					const $ = res.$;
					const baseUrl = new URL(res.options.uri);
					const url = baseUrl.href;
					const hasParagraph = $("p").length > 0;

					// If page has paragraph, add to pagesData
					if (!pagesData[url] && hasParagraph) {
						const outgoingLinks = $("a")
							.map(function () {
								const link = new URL($(this).attr("href"), baseUrl);
								return link.href;
							})
							.get();

						const paragraph = $("p").text().trim().replace(/\s+/g, " ");
						const title = $("title").text();

						// Separate paragraph into array of words
						const words = paragraph.match(/\b\w+\b/g);
						let wordFrequencies = {};

						// Calculate word frequencies
						if (words) {
							words.forEach((word) => {
								if (!/^\d+$/.test(word)) {
									const lowercaseWord = word.toLowerCase();
									wordFrequencies[lowercaseWord] =
										(wordFrequencies[lowercaseWord] || 0) + 1;
								}
							});
							wordFrequencies = Object.entries(wordFrequencies)
								.sort((a, b) => b[1] - a[1])
								.slice(0, 10);
						}

						// Add page to pagesData
						pagesData[url] = {
							title: title,
							paragraph: paragraph,
							outgoingLinks: outgoingLinks,
							wordFrequencies: wordFrequencies,
							complete: true,
						};

						// Add outgoing links to queue
						outgoingLinks.forEach((outgoingLink) => {
							if (
								!queuedLinks.has(outgoingLink) &&
								outgoingLink.startsWith(baseCrawl) &&
								queuedLinks.size < maxPagesToVisit
							) {
								queuedLinks.add(outgoingLink);
								c.queue(outgoingLink);
							}
						});
					}
				}
			}
		} catch (err) {
			console.error("Callback Error:", err);
		} finally {
			done();
		}
	},
});

c.queue(baseCrawl);
queuedLinks.add(baseCrawl);

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

		// Tell the server to calculate the scores and pageRanks
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
	} catch (err) {
		console.error("Error on drain: ", err.message);
	}
});
