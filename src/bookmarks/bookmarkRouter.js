const express = require('express')
const { v4: uuid } = require('uuid')
const logger = require('../logger')
const { bookmarks } = require('../store')

const bookmarkRouter = express.Router()
const bodyParser = express.json()

bookmarkRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        res.json(bookmarks);

        next()
    })
    .post(bodyParser, (req, res, next) => {
        const id = uuid();
        const { title, url, description = "", rating = null} = req.body;

        if(!title){
            logger.error(`Title is required`);
            return res
                .status(400)
                .send('The title is required')
        }
            

        if(!url){
            logger.error(`URL is required`);
            return res
                .status(400)
                .send('The URL is required')
        }

        const newBookmark = {
            id,
            title,
            url,
            description,
            rating
        }

        bookmarks.push(newBookmark);

        logger.info(`Bookmark with id ${id} created`);

        res
        .status(201)
        .location(`http://localhost:8000/card/${id}`)
        .json(newBookmark);
            next()
    })

bookmarkRouter
    .route('/bookmarks/:id')
    .get((req, res, next) => {
        const { id } = req.params;
        const bookmark = bookmarks.find(bm => bm.id === id);
        
        if (!bookmark) {
            logger.error(`Bookmark with id ${id} not found.`);
            res
                .status(404)
                .send('404 Not Found')
        }

        res.json(bookmark);

        next()
    })
    .delete((req, res, next) => {
        const { id } = req.params;
        const index = bookmarks.findIndex(bm => bm.id === id);

        if(index === -1) {
            logger.error(`Bookmark with id ${id} not found.`)
            return res
                .status(404)
                .send("404 Not found")
        }

        bookmarks.splice(index, 1)

        res.json(bookmarks)

        next()
    })

module.exports = bookmarkRouter