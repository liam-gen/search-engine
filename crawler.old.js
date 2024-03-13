const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

function iCanFollow($, e){
    let rel = $(e).attr("rel");

    if(!rel) return true;
    if(rel.toLowerCase() !== 'nofollow') return false;
    return true;
}

function iCanSearch($){
    const metaRobots = $('meta[name="robots"]');

    if(!metaRobots) return true;
    if(!metaRobots.attr("content")) return true;
    if(metaRobots.attr("content").split(", ").map(e => e.toLowerCase()).includes('noindex')) return false;
    return true;
}

async function main() {
    // initialized with the first webpage to visit
    const paginationURLsToVisit = ["https://liamgenjs.vercel.app"];

    // iterating until the queue is empty
    // or the iteration limit is hit
    while (true) {
        const visitedURLs = JSON.parse(fs.readFileSync("visited_urls.json", "utf8"));
        // the current webpage to crawl
        const paginationURLMain = paginationURLsToVisit.pop();

        var is_absolute = new RegExp('^(?:[a-z+]+:)?//', 'i');

        let pageHTML;
        let database = JSON.parse(fs.readFileSync("database.json", "utf8"));

        try{
            pageHTML = await axios.get(paginationURLMain);            

            const $ = cheerio.load(pageHTML.data);
            
            if(!visitedURLs.includes(paginationURLMain.endsWith('/') ? paginationURLMain.slice(0, -1) : paginationURLMain) && iCanSearch($)){
                database.push(
                    {
                        url: paginationURLMain,
                        tab_title: $("title").text(),
                        meta_description: $("meta[name='description']") ?  $("meta[name='description']").attr("content") : null,
                        meta_keywords: $("meta[name='keywords']") ?  $("meta[name='keywords']").attr("content") : null,
                        meta_author: $("meta[name='author']") ?  $("meta[name='author']").attr("content") : null,
                        meta_title: $("meta[name='title']") ?  $("meta[name='title']").attr("content") : null,
                        meta_icon: $('link[rel="icon"], link[rel="shortcut icon"]').first() ? $('link[rel="icon"], link[rel="shortcut icon"]').first().attr('href') : null
                    }
                );

                console.log("URLs Size : "+database.length)
    
                fs.writeFileSync("database.json", JSON.stringify(database))
                visitedURLs.push(paginationURLMain);
            }

            $("a").each((index, element) => {
                let paginationURL = $(element).attr("href");
    
                if(!is_absolute.test(paginationURL))
                {
                    let tmp_url = new URL(new URL(paginationURLMain).origin);
                    tmp_url.pathname = paginationURL;
                    paginationURL = tmp_url.href;
                }
                if (
                    !visitedURLs.includes(paginationURL) &&
                    !paginationURLsToVisit.includes(paginationURL) &&
                    iCanFollow($, element)
                ) {
                    paginationURLsToVisit.push(paginationURL);
                }
            });

            
        }
        catch(e){
            console.log("Error")
        }

        fs.writeFileSync("visited_urls.json", JSON.stringify(visitedURLs));


    }
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((e) => {
        // logging the error message
        console.error(e);

        process.exit(1);
    });