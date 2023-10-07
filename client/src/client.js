import Crawler from "crawler";
import fetch from "node-fetch";

let links = [];

const startTime = new Date();

const c = new Crawler({
	maxConnections: 60,
	retries: 3,
	retryTimeout: 10000,
	callback: async function (error, res, done) {
		if (error) {
			console.error(error);
		} else {
			const $ = res.$;
			const baseUrl = new URL(res.options.uri); // Parse the base URL
			const url = baseUrl.href; // Get the normalized base URL
			const outgoingLinks = $("a")
				.map(function () {
					const link = new URL($(this).attr("href"), baseUrl); // Create an absolute URL
					return link.href; // Get the normalized absolute URL
				})
				.get();
			const paragraph = $("p").text();

			const postData = {
				title: url,
				link: url,
				paragraph: paragraph,
				//outgoingLinks: outgoingLinks,
			};

			if (!links.some((link) => link === url)) {
				try {
					const response = await fetch("http://localhost:5000/links/", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify(postData),
					});

					const data = await response.json();
					links.push(url);
					console.log("Link saved:", data.link);
				} catch (err) {
					console.error(err);
				}
			}
			// Queue the outgoing links for crawling
			outgoingLinks.forEach((link) => {
				const absoluteLink = new URL(link, url).href;
				c.queue(absoluteLink);
			});
		}
		done();
	},
});

c.queue("https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html");

c.on("drain", function () {
	const endTime = new Date();
	const totalTime = Math.round((endTime - startTime) / 1000);

	console.log("Finished in " + totalTime + " seconds");
});
