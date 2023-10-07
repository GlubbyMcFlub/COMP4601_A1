
//Required module (install via NPM)
const Crawler = require("crawler");

const c = new Crawler({
    maxConnections : 10, //use this for parallel, rateLimit for individual
    //rateLimit: 10000,

    // This will be called for each crawled page
    callback : function (error, res, done) {
        if(error){
            console.log(error);
        }else{
            let $ = res.$; //get cheerio data, see cheerio docs for info

            //iterate through all the outgoing links
            //do a get request to see if link already exists in database
            //if not, then add it to the database and queue via post request with all the info
            //regardless, the number of incoming links of this page should be incremented
            //in the drain function, request the next link in the queue

            console.log("Keywords: " + $("meta[name=Keywords]").attr("content"));
            console.log("\n\n");
            console.log("Description: " + $("meta[name=Description]").attr("content"));
            console.log("\n\n");
            console.log("Title: " + $("title").text());
            console.log("\n\n");
            //console.log("Body: " + $("body").text());
            console.log("Paragraphs: " + $("p").text());

            //Link text can be useful
            console.log("Link and Paragraph Text: " + $("a,p").text());

        }
        done();
    }
});

//Perhaps a useful event
//Triggered when the queue becomes empty
//There are some other events, check crawler docs
c.on('drain',function(){
    console.log("Done.");
});

//Queue a URL, which starts the crawl
c.queue('https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html');


//c.queue('https://www.w3schools.com/tags/tag_meta.asp');
//c.queue("https://www.w3schools.com/jquery/jquery_selectors.asp")
