import Crawler from "crawler";
import fetch from "node-fetch";

let links = [];

const startTime = new Date();

const c = new Crawler({
	maxConnections: 60,
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

			const postData = {
				title: url,
				link: url,
				paragraph: paragraph,
			};

			if (!links.includes(url)) {
				try {
					const response = await fetch("http://localhost:5000/links/", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify(postData),
					});

					const data = await response.json();
					if (response.status === 201) {
						links.push(url);
						console.log("Link saved:", data.link);
					} else {
						console.error("Failed to save link. Error: ", data.message);
					}
				} catch (err) {
					console.error("Failed to save link. Error: ", err.message);
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
