const fs = require("fs")
const MiniSearch = require('minisearch');

let miniSearch = new MiniSearch({
    fields: ['tab_title', 'meta_description', 'meta_keywords', 'meta_author', 'meta_title'], // fields to index for full-text search
    storeFields: ['tab_title', 'meta_description', 'meta_keywords', 'meta_author', 'meta_title', 'meta_icon', 'images', 'sitemaps'] // fields to return with search results
})

let num = 0;
miniSearch.addAll(JSON.parse(fs.readFileSync("database.json", "utf8")).map(e => {e.id = num;num++;return e;}))

console.log(miniSearch.search('liam'))