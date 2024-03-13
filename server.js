const Fuse = require('fuse.js');
const fs = require("fs");
const express = require('express')
const app = express()
const port = 3000

app.set('json spaces', 4)

app.get('/api/search/:search', (req, res) => {
  let database = JSON.parse(fs.readFileSync("database.json", "utf8"));

    /*const fuse = new Fuse(database, {
        isCaseSensitive: true,
        includeScore: true,
        shouldSort: true,
        includeMatches: true,
        findAllMatches: true,
        threshold: 0.3,
        useExtendedSearch: true,
        keys: ['url', 'tab_title', 'meta_description', 'meta_author', 'meta_title', 'meta_keywords']
    })*/

    const MiniSearch = require('minisearch');

    let miniSearch = new MiniSearch({
        fields: ['url', 'tab_title', 'meta_description', 'meta_keywords', 'meta_author', 'meta_title'], // fields to index for full-text search
        storeFields: ['url', 'tab_title', 'meta_description', 'meta_keywords', 'meta_author', 'meta_title', 'meta_icon', 'images', 'sitemaps'] // fields to return with search results
    })

    let num = 0;
    miniSearch.addAll(database.map(e => {e.id = num;num++;return e;}))

    res.setHeader('Content-Type', 'application/json');
    res.json(miniSearch.search(req.params.search))
})

app.get("/search", function (req, res) {
    return res.sendFile(__dirname + "/search.html")
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})