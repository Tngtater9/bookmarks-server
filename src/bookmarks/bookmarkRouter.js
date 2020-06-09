const express = require('express')
const logger = require('../logger')
const xss = require('xss')
const BookmarksService = require('./bookmarksService')

const bookmarkRouter = express.Router()
const bodyParser = express.json()

bookmarkRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res
                    .status(200)
                    .json(bookmarks)
            })
            .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const { title, url, description = "", rating} = req.body
        const knexInstance = req.app.get('db')
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

        if(!rating){
            logger.error('Rating is required')
            return res
                .status(400)
                .send('Rating is required')
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
                    .location(`http://localhost:8000/bookmarks/${bookmark.id}`)
                    .json({id: bookmark.id,
                    title: xss(bookmark.title),
                    url: xss(bookmark.url),
                    description: xss(bookmark.description),
                    rating: bookmark.rating})
            })
    })

bookmarkRouter
    .route('/bookmarks/:id')
    .get((req, res, next) => {
        const knexInstance =  req.app.get('db')
        BookmarksService.getById(knexInstance, req.params.id)
            .then(bookmark => {
                if(!bookmark){
                    logger.error(`Bookmark with id  not found.`);
                    return res
                        .status(404)
                        .json({error: {message: 'Bookmark not found'}})
                }
                res
                    .status(200)
                    .json(bookmark)
            })
            .catch()
    })
    .delete((req, res, next) => {
        const knexInstance = req.app.get('db')
        const { id } = req.params
        
        BookmarksService.deleteBookmark(knexInstance, id)
            .then(bookmark =>{
                if(!bookmark){
                    logger.error(`Bookmark with id ${bookmark.id} not found.`)
                    return res
                        .status(404)
                        .send("404 Not found")
                }
                BookmarksService.getAllBookmarks(knexInstance)
                    .then(bookmarks =>
                        res.json(bookmarks)
                    )
            })
            .catch()
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
            message: `Request body must contain either 'title', 'url' 'description' or 'rating'`
            }
        })
        }

        BookmarksService.updateBookmark(knexInstance, id, bookmarkToUpdate)
            .then(bookmark => {
                logger.info(`Bookmark with id ${bookmark.id} was updated`)
                res
                    .status(204)
                    .location(`http://localhost:8000/bookmarks/${bookmark.id}`)
                    .json({id: bookmark.id,
                    title: xss(bookmark.title),
                    url: xss(bookmark.url),
                    description: xss(bookmark.description),
                    rating: bookmark.rating})
                    
            })
    })

module.exports = bookmarkRouter