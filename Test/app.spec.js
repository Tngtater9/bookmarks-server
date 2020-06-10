const app = require('../src/app')
const knex = require('knex')
const bookmarks = require('./Fixtures/store')

describe('testing endpoint /api/bookmarks', function(){
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

    context('given NO data resolves GET /api/bookmarks', () => {
        it('returns 200 with an empty array', () => {
            return supertest(app)
            .get('/api/bookmarks')
            .expect(200, [])
        })
        
    })
    context.only('given data resolves /api/bookmarks', () => {
        beforeEach(() => {
            return db
                .into('bookmarks_data')
                .insert(testBookmarks)
        })

        it('returns 200 with GET /api/bookmarks', () => {
            return supertest(app)
                .get('/api/bookmarks')
                .expect(200, testBookmarks)
        })
        
        const requiredFields = ['title', 'url', 'rating']

        requiredFields.forEach(field => {
            const newBookmark = {
                "title": "Duckduckgo",
                "url": "duckduckgo.com",
                "rating": 5
            }

            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
            delete newBookmark[field]

            return supertest(app)
                .post('/api/bookmarks')
                .send(newBookmark)
                .expect(400, {
                error: { message: `Missing '${field}' in request body` }
                })
            })
        })
    })
    context('testing /api/bookmarks/:id', () => {
        beforeEach(() => {
            return db
                .into('bookmarks_data')
                .insert(testBookmarks)
        })
        it('returns 200 if id found', () => {
            const otherid = 1
            const expected = testBookmarks[otherid - 1]
            return supertest(app)
                .get(`/api/bookmarks/${otherid}`)
                .expect(200, expected)
        })
        it('returns 404 if id not found', () => {
            const id = 12 
            return supertest(app)
                .get(`/api/bookmarks/${id}`)
                .expect(404, {error: {message: 'Bookmark not found'}})
        })
        it('deletes a bookmark and returns 204', () => {
            const deleteid = 1
            const remaining = testBookmarks.filter(bookmark => bookmark.id !== deleteid)
            return supertest(app)
                .delete(`/api/bookmarks/${deleteid}`)
                .expect(204)
                .then(res =>{
                    return supertest(app)
                        .get('/api/bookmarks')
                        .expect(200, remaining)
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
                    .patch(`/api/bookmarks/${updateid}`)
                    .send(newDets)
                    .expect(204)
                    .then(res => {
                        return supertest(app)
                        .get(`/api/bookmarks/${updateid}`)
                        .expect(expectedBookmark)
                    })
        })
    })
})

