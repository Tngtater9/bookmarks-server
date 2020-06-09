const BookmarksService = {
    getAllBookmarks (knex) {
        return knex
            .select('*')
            .from('bookmarks_data')
    },
    getById (knex, id) {
        return knex
            .select('*')
            .from('bookmarks_data')
            .where('id', id)
            .first()
    },
    addBookmark (knex, newBookmark) {
        return knex
            .insert(newBookmark)
            .into('bookmarks_data')
            .returning('*')
            .then(rows => rows[0])
    },
    updateBookmark (knex, id, newDetails) {
        return knex('bookmarks_data')
            .where('id', id)
            .update(newDetails)
    },
    deleteBookmark (knex, id) {
        return knex('bookmarks_data')
            .where('id', id)
            .delete()
    }
}

module.exports = BookmarksService