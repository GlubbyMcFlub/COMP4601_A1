import Crawler from "crawler";
import { EventEmitter } from "events";
import fetch from "node-fetch";

const baseEndPoint = "http://localhost:5000/personal/";

const baseCrawl = "https://legiontd2.fandom.com/wiki/";
// const baseCrawl =
// 	"https://people.scs.carleton.ca/~davidmckenney/tinyfruits/N-0.html";
const maxPagesToVisit = 30;
const rateLimit = 10;
let pagesData = {};
let queuedLinks = new Set();

EventEmitter.defaultMaxListeners = 20;

const c = new Crawler({
	maxConnections: 1,
	rateLimit: rateLimit,
	maxListeners: 20,
	retries: 3,
	followRedirect: false, // Prevent automatic following of redirects
	preRequest: function (options, done) {
		const isWikiPage = options.uri.startsWith(baseCrawl);
		const notUserLogin = !options.uri.includes("UserLogin");
		const isValidUrl = !options.uri.match(/\.(wav|png|jpg|gif|pdf|#)$/i);
		const isProblematicUrl = options.uri.includes(
			"auth.fandom.com/kratos-public/self-service/login/browser"
		);
		if (isWikiPage && isValidUrl && notUserLogin && !isProblematicUrl) {
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
				if (res.statusCode >= 300 && res.statusCode < 400) {
					const redirectLocation = res.headers.location;
					if (
						!queuedLinks.has(redirectLocation) &&
						!redirectLocation.includes("UserLogin") &&
						!redirectLocation.includes("signin") &&
						queuedLinks.size < maxPagesToVisit
					) {
						queuedLinks.add(redirectLocation);
						c.queue(redirectLocation);
					}
				} else if (res.statusCode === 200) {
					const $ = res.$;
					const baseUrl = new URL(res.options.uri);
					const url = baseUrl.href;
					const hasParagraph = $("p").length > 0;
					if (!pagesData[url] && hasParagraph) {
						const outgoingLinks = $("a")
							.map(function () {
								const link = new URL($(this).attr("href"), baseUrl);
								return link.href;
							})
							.get();

						const paragraph = $("p").text().trim().replace(/\s+/g, " ");
						const title = $("title").text();

						const words = paragraph.match(/\b\w+\b/g);
						let wordFrequencies = {};

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

						pagesData[url] = {
							title: title,
							paragraph: paragraph,
							outgoingLinks: outgoingLinks,
							wordFrequencies: wordFrequencies,
							complete: true,
						};

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
		//calculate incomingLinks
		for (const url in pagesData) {
			if (pagesData[url].complete) {
				pagesData[url].outgoingLinks.forEach((outgoingLink) => {
					if (pagesData[outgoingLink]) {
						if (!pagesData[outgoingLink].incomingLinks) {
							pagesData[outgoingLink].incomingLinks = new Set();
						} else {
							pagesData[outgoingLink].incomingLinks.add(url);
						}
					}
				});
			}
		}
		//add data to database
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

		//index data

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

		//calculate page rank

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
