import elasticlunr from "elasticlunr";
import Crawler from "crawler";
import fetch from "node-fetch";
import { Matrix } from "ml-matrix";

// Initialize ElasticLunr index
const index = elasticlunr(function () {
  this.addField("title");
  this.addField("outgoingLinks");
  this.addField("paragraph");
  this.setRef("id");
});

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

      // Send post request to update incomingLinks
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

      const postData = {
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
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        });

        const data = await response.json();
        console.log(response.status);

        if (response.status === 200 || response.status === 201) {
          outgoingLinks.forEach(async (link) => {
            let outgoingLinkGetQuery = baseEndPoint + "?link=" + link;
            const outgoingLinkGetResponse = await fetch(outgoingLinkGetQuery, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            });

            //will use later to decide if we need to add to queue
            const outgoingLinkGetError = await outgoingLinkGetResponse.json();
            // console.log(outgoingLinkGetResponse.status);

            let outgoingLinkPostData = {
              update: {
                $set: { link: link },
                $push: { incomingLinks: url },
              },
              link: link,
            };

            const outgoingLinkPostResponse = await fetch(baseEndPoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(outgoingLinkPostData),
            });
            const outgoingLinkPostError = await outgoingLinkPostResponse.json();
            if (
              (outgoingLinkPostResponse.status === 200 &&
                outgoingLinkGetResponse.status === 404) ||
              (outgoingLinkPostResponse.status === 201 &&
                outgoingLinkGetResponse.status === 404)
            ) {
              c.queue(link);
            } else if (
              outgoingLinkPostResponse.status != 200 &&
              outgoingLinkPostResponse.status != 201
            ) {
              console.error(
                "Failed to add outgoing link. Error: ",
                outgoingLinkPostError.message
              );
            }
          });
          // console.log("Link saved:", data.link);
        } else {
          console.error("Bad response from server. Error: ", data.message); //TODO this is a terrible error message
        }
      } catch (err) {
        console.error("Error: ", err.message);
      }
    }
    done();
  },
});

c.queue("https://people.scs.carleton.ca/~davidmckenney/tinyfruits/N-0.html");
// c.queue("https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html");

c.on("drain", async function () {
  try {
    const response = await fetch(baseEndPoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    let links = await response.json();
    if (response.status != 200) {
      console.log("error fetching links on drain");
    }
    links.forEach((link) => {
      if (link) {
        let doc = {
          id: link._id,
          title: link.title ? link.title : "",
          paragraph: link.paragraph ? link.paragraph : "",
          outgoingLinks: link.outgoingLinks ? link.outgoingLinks : [],
        };
        index.addDoc(doc);
      }
    });
    index.search("kiwi", {});

    const ALPHA = 0.1;
    const EUC_STOPPING_THRESHOLD = 0.0001;

    //create map of links to index in links array
    const linkIndexingMap = {};
    links.forEach((link, index) => {
      {
        linkIndexingMap[link.link] = index;
      }
    });

    //create probability matrix
    const probabilityMatrix = new Matrix(links.length, links.length);
    links.forEach((link, row) => {
      link.outgoingLinks.forEach((outgoingLink) => {
        const col = linkIndexingMap[outgoingLink];
        probabilityMatrix.set(row, col, 1);
      });
    });

    //if a row has all 0's, then set each entry to links.length to simulate teleportation
    //otherwise, set each 1 to 1/numOnes to show the probability that a link will be chosen
    for (let i = 0; i < probabilityMatrix.rows; i++) {
      const numOnes = probabilityMatrix
        .getRow(i)
        .reduce((count, value) => (value === 1 ? count + 1 : count), 0);
      if (numOnes == 0) {
        probabilityMatrix.setRow(
          i,
          Array(probabilityMatrix.columns).fill(1 / links.length)
        );
      } else {
        let editedRow = probabilityMatrix
          .getRow(i)
          .map((value) => (value * 1) / numOnes);
        probabilityMatrix.setRow(i, editedRow);
      }
    }

    //multiply matrix by the chance that a link will be chosen
    probabilityMatrix.mul(1 - ALPHA);

    //add the chance that a teleportation will occur
    let teleportationMatrix = new Matrix(links.length, links.length);
    for (let i = 0; i < probabilityMatrix.rows; i++) {
      teleportationMatrix.setRow(
        i,
        Array(probabilityMatrix.columns).fill(ALPHA / links.length)
      );
    }

    probabilityMatrix.add(teleportationMatrix);

    //power iteration. multiply pageRanks matrix by probabilityMatrix until euclidean distance between last two vectors < 0.0001
    let pageRanks = new Matrix(1, links.length);
    pageRanks.set(0, 0, 1);
    let oldPageRanks;
    do {
      oldPageRanks = pageRanks.clone();
      pageRanks = pageRanks.mmul(probabilityMatrix);
    } while (Math.abs(oldPageRanks.norm() - pageRanks.norm()) >= EUC_STOPPING_THRESHOLD);

    links.forEach(async (link, column = 0) => {
      let data = {
        update: {
          $set: { pageRank: pageRanks.get(0, column) },
        },
        link: link.link,
      };

      const response = await fetch(baseEndPoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const error = await response.json();
      if (response.status != 200 && response.status != 201) {
        console.log(error.message);
      }
    });

    const endTime = new Date();
    const totalTime = Math.round((endTime - startTime) / 1000);
    console.log("Finished in " + totalTime + " seconds");
  } catch (err) {
    console.error("Error on drain: ", err.message);
  }
});
