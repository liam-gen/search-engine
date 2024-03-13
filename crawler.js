const { CheerioCrawler } = require('crawlee');
const fs = require("fs");
const robotsParser = require('robots-txt-parser');

const robots = robotsParser(
  {
    userAgent: '*',
    allowOnNeutral: false,
  },
);

function iCanIndex($){
    const metaRobots = $('meta[name="robots"]');

    if(!metaRobots) return true;
    if(!metaRobots.attr("content")) return true;
    if(metaRobots.attr("content").split(", ").map(e => e.toLowerCase()).includes('noindex')) return false;

    return true;
}

function getBeautifulUrl(url){
    var theUrl = new URL(url);
    theUrl.search = "";
    return theUrl.href.replace(/^\/+|\/+$/g, '');
}

function getFromRelative(host, url){
    try{
        let xyz = new URL(url);
        return url;
    }
    catch(e){
        return new URL(url, host).href;
    }
}

let URLS_LIST = [];
let VISITED_LIST = JSON.parse(fs.readFileSync("visited_urls.json", "utf8"));

function addToUrls(urls, visited_urls) {
    let DATABASE_URLS = JSON.parse(fs.readFileSync("database.json", "utf8"));
    DATABASE_URLS.push(...urls);
    fs.writeFileSync("database.json", JSON.stringify(DATABASE_URLS));

    fs.writeFileSync("visited_urls.json", JSON.stringify(visited_urls));
}

const crawler = new CheerioCrawler({
    maxRequestsPerMinute: 300,
    async requestHandler({ $, request, enqueueLinks }) {

        let robotsUrl = new URL(request.url);
        robotsUrl.pathname = "/robots.txt";
        robotsUrl.search = "";

        await robots.useRobotsFor(robotsUrl.href);

        const results = {
            url: request.url,
            tab_title:  $('title').text() ? $('title').text() : null,
            meta_description: $("meta[name='description']") ?  $("meta[name='description']").attr("content") : null,
            meta_keywords: $("meta[name='keywords']") ?  $("meta[name='keywords']").attr("content") : null,
            meta_author: $("meta[name='author']") ?  $("meta[name='author']").attr("content") : null,
            meta_title: $("meta[name='title']") ?  $("meta[name='title']").attr("content") : null,
            meta_og_site_name: $("meta[property='og:site_name']") ?  $("meta[property='og:site_name']").attr("content") : null,
            meta_og_description: $("meta[property='og:description']") ?  $("meta[property='og:description']").attr("content") : null,
            meta_og_url: $("meta[property='og:url']") ? getFromRelative(request.url, $("meta[property='og:url']").attr("content")) : null,
            meta_og_type: $("meta[property='og:type']") ? $("meta[property='og:type']").attr("content") : null,
            meta_og_image: $("meta[property='og:image']") ? $("meta[property='og:image']").attr("content") : null,
            meta_og_title: $("meta[property='og:title']") ? $("meta[property='og:title']").attr("content") : null,
            meta_icon: $('link[rel="icon"], link[rel="shortcut icon"]').first() ? getFromRelative(request.url, $('link[rel="icon"], link[rel="shortcut icon"]').first().attr('href')) : null,
            images:  $('img').get().map(e => getFromRelative(request.url, e.attribs.src)),
            videos:  $('video').get().map(e => getFromRelative(request.url, e.attribs.src)),
            sitemaps: await robots.getSitemaps()
        };

        if(robots.canCrawlSync(request.url) && iCanIndex($) && !VISITED_LIST.map(e => {e = e.url; return e;}).includes(getBeautifulUrl(request.url))) {
            console.log("Adding "+getBeautifulUrl(request.url))
            URLS_LIST.push(results);
            VISITED_LIST.push({url: getBeautifulUrl(request.url), date: new Date().getTime()});
        }

        if(URLS_LIST.length == 50)
        {
            addToUrls(URLS_LIST, VISITED_LIST);
            URLS_LIST = [];
        }

        await enqueueLinks({
            strategy: 'all',
            selector: 'a:not([rel="nofollow"])'
        });
    }
})
// Start the crawler with the provided URLs
crawler.run(['https://liamgenjs.vercel.app']);