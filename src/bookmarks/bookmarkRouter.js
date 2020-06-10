const express = require('express')
const logger = require('../logger')
const path = require('path')
const xss = require('xss')
const BookmarksService = require('./bookmarksService')

const bookmarkRouter = express.Router()
const bodyParser = express.json()
const serializeBookmark = bookmark => {
    return {id: bookmark.id,
        title: xss(bookmark.title),
        url: xss(bookmark.url),
        description: xss(bookmark.description),
        rating: xss(bookmark.rating)}
}

bookmarkRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res
                    .status(200)
                    .json(bookmarks.map(serializeBookmark))
            })
            .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const { title, url, description = "", rating} = req.body
        const newBookmark = { title, url, description, rating}
        const knexInstance = req.app.get('db')

        for (const [key, value] of Object.entries(newBookmark)) {
            if (value == null) {
            return res
                .status(400)
                .json({
                    error: { message: `Missing '${key}' in request body` }
                })
            }
        }

        if(rating < 0 || rating > 5){
            logger.error('Rating not in range')
            return res
                .status(400)
                .send('Rating must be a whole number from 1 to 5')
        }

        BookmarksService.addBookmark(knexInstance, req.body)
            .then(bookmark => {
                logger.info(`Bookmark with id ${bookmark.id} created`)
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
                    .json(serializeBookmark(bookmark))
            })
            .catch(next)
    })

bookmarkRouter
    .route('/:id')
    .all((req, res, next) => {
        const knexInstance =  req.app.get('db')
        BookmarksService.getById(knexInstance, req.params.id)
            .then(bookmark => {
                if(!bookmark){
                    logger.error(`Bookmark with id  not found.`);
                    return res
                        .status(404)
                        .json({error: {message: 'Bookmark not found'}})
                }
                res.bookmark = bookmark // save the article for the next middleware
                next() // don't forget to call next so the next middleware happens!
            })
            .catch(next)
    })
    .get((req, res, next) => {
        return res.json(serializeBookmark(res.bookmark))
    })
    .delete((req, res, next) => {
        const knexInstance = req.app.get('db')
        const { id } = req.params
        
        BookmarksService.deleteBookmark(knexInstance, id)
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(bodyParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        const { id } = req.params
        const { title, url, description, rating } = req.body
        const bookmarkToUpdate = { title, url, description, rating }

        const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
        return res.status(400).json({
            error: {
            message: `Request body must contain at least one of the following values 'title', 'url' 'description' or 'rating'`
            }
        })
        }

        BookmarksService.updateBookmark(knexInstance, id, bookmarkToUpdate)
            .then(bookmark => {
                logger.info(`Bookmark with id ${bookmark.id} was updated`)
                res
                    .status(204)
                    .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
                    .json(serializeBookmark(bookmark))
                    
            })
    })

module.exports = bookmarkRouter