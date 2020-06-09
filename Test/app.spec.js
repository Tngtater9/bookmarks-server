const app = require('../src/app')
const knex = require('knex')
const bookmarks = require('./Fixtures/store')

describe('testing endpoint /bookmarks', function(){
    this.timeout(5000)
    let db
    let testBookmarks = bookmarks()

    before(() => {
        db = knex({
            client: 'pg',
            connection: process.env.DB_URL_TEST
        })
        app.set('db', db)
    })

    before(()=>db('bookmarks_data').truncate())

    afterEach(()=>db('bookmarks_data').truncate())

    after(()=>db.destroy())

    context('given NO data resolves GET /bookmarks', () => {
        it('returns 200 with an empty array', () => {
            return supertest(app)
            .get('/bookmarks')
            .expect(200, [])
        })
        
    })
    context('given data resolves /bookmarks', () => {
        before(() => {
            return db
                .into('bookmarks_data')
                .insert(testBookmarks)
        })

        it('returns 200 with GET /bookmarks', () => {
            return supertest(app)
                .get('/bookmarks')
                .expect(200, testBookmarks)
        })
        it('POST /bookmarks', () => {
            const newBookmark = {
                "title": "Duckduckgo",
                "url": "duckduckgo.com",
                "description": "A better search engine",
                "rating": 5
            }
            return supertest(app)
                .post('/bookmarks')
                .send(newBookmark)
                .then(res => {
                    expect(201)
                    expect(res.body).to.eql({id: 1,
                        title: newBookmark.title,
                        url: newBookmark.url,
                        description: newBookmark.description,
                        rating: newBookmark.rating
                    })
                })
        })
    })

    context('testing /bookmarks/:id', () => {
        beforeEach(() => {
            return db
                .into('bookmarks_data')
                .insert(testBookmarks)
        })
        it('returns 200 if id found', () => {
            const otherid = 1
            const expected = testBookmarks[otherid - 1]
            return supertest(app)
                .get(`/bookmarks/${otherid}`)
                .expect(200, expected)
        })
        it('returns 404 if id not found', () => {
            const id = 12 
            return supertest(app)
                .get(`/bookmarks/${id}`)
                .expect(404, {error: {message: 'Bookmark not found'}})
        })
        it('deletes a bookmark and returns what remains', () => {
            const deleteid = 1
            const remaining = testBookmarks.filter(bookmark => bookmark.id !== deleteid)
            return supertest(app)
                .delete(`/bookmarks/${deleteid}`)
                .then(res => {
                    expect(res.body).to.eql(remaining)
                })
        })
        it('updates a bookmark and returns new info', () => {
            const updateid = 1
            const newDets = {
                title: "New title"
            }
            const expectedBookmark =  {
                     ...testBookmarks[updateid - 1],
                     ...newDets
                   }
                return supertest(app)
                    .patch(`/bookmarks/${updateid}`)
                    .send(newDets)
                    .expect(204)
                    .then(res => {
                        return supertest(app)
                        .get(`/bookmarks/${updateid}`)
                        .expect(expectedBookmark)
                    })
        })
    })
})

