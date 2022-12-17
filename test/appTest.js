const assert = require('chai').assert;
const { db } = require('../index');
const app = require('../index');
async function runTests() {
    describe('App', function () {
        describe('admin user features', function () {
            it('reset user password', function () {
                let user = 'alex'
                app.resetPassword(user);
                let new_pass = '';
                app.db.any('SELECT * FROM users WHERE username = $1 AND password = $2', [user, 'password'])
                    .then((data => {
                        for (const row in data) {
                            new_pass = row.password
                        }
                        assert.equal(new_pass, 'password');
                    }))
            })
            it('insert new non-admin user', function () {
                let user = 'test1'
                let password = 'abc'
                let is_admin = false
                let row_exists = 0
                app.insertUser(user, password, is_admin, false);
                app.db.any('SELECT * FROM users WHERE username = $1, password = $2, is_admin = $3, is_premium = false;', [user, password, is_admin])
                    .then((data => {
                        row_exists = data.length
                        assert.equal(row_exists, 1);
                    }))
            })
            it('insert new admin user', function () {
                let user = 'test2'
                let password = '123'
                let is_admin = true
                let row_exists = 0
                app.insertUser(user, password, is_admin, false);
                app.db.any('SELECT * FROM users WHERE username = $1, password = $2, is_admin = $3, is_premium = false;', [user, password, is_admin])
                    .then((data => {
                        row_exists = data.length
                        assert.equal(row_exists, 1);
                    }))
            })
            it('delete a user', function () {
                let user = 'test2'
                let row_exists = 1
                app.deleteUser(user);
                app.db.any('SELECT * FROM users WHERE username = $1;', [user])
                    .then((data => {
                        row_exists = data.length
                        assert.equal(row_exists, 0);
                    }))
            })
        })
        describe('cart features', function () {
            it('add item to cart', function () {
                let user = 'test1'
                let movie_id = 10195
                let row_exists = 0
                app.addCartItem(movie_id);
                app.db.any('SELECT * FROM cart WHERE username = $1 AND movie_title = $2;', [user, 'Thor'])
                    .then((data => {
                        row_exists = data.length
                        assert.equal(row_exists, 1);
                    }))
            })
            it('remove item from cart', function () {
                let user = 'test1'
                let movie_title = 'Thor'
                var row_exists = 1
                app.removeCartItem(movie_title);
                app.db.any('SELECT * FROM cart WHERE username = $1 AND movie_title = $2;', [user, movie_title])
                    .then((data => {
                        row_exists = data.length
                        assert.equal(row_exists, 0)
                    }))
            })
        })
        describe('search queries and discover features', function () {
            it('keyword search', function () {
                let keyword = 'thor'
                let category = null
                let min_user_score = null
                let max_runtime = null
                let release_date = null
                let url = ''
                url = app.runSearch(keyword, category, min_user_score, max_runtime, release_date);
                assert.equal(url, 'https://api.themoviedb.org/3/search/movie?api_key=64be712340bbd3d30d0546d8d7db1778&query=thor')
            })
            it('discover search with no date parameter', function () {
                let keyword = undefined
                let category = 28
                let min_user_score = 7
                let max_runtime = 150
                let release_date = ''
                let url = ''
                url = app.runSearch(keyword, category, min_user_score, max_runtime, release_date);
                assert.equal(url, 'https://api.themoviedb.org/3/discover/movie?api_key=64be712340bbd3d30d0546d8d7db1778&with_genres=28&vote_average.gte=7&with_runtime.lte=150')
            })
            it('discover search with date parameter', function () {
                let keyword = undefined
                let category = 28
                let min_user_score = 7
                let max_runtime = 150
                let release_date = '2018-01-01'
                let url = ''
                url = app.runSearch(keyword, category, min_user_score, max_runtime, release_date);
                assert.equal(url, 'https://api.themoviedb.org/3/discover/movie?api_key=64be712340bbd3d30d0546d8d7db1778&with_genres=28&vote_average.gte=7&with_runtime.lte=150&primary_release_date.gte=2018-01-01&sort_by=release_date.asc')
            })

        })
        describe('renting cases and return movie', async function () {
            it('rent with money non-premium user', async function () {
                app.currentUser = 'test1'
                app.isPremium = false
                let movie_id = 284053
                let movie_title = 'Thor: Ragnarok'
                let row_exists = 0
                app.addCartItem(movie_id);
                app.rentWithPoints = false
                await app.addValue(15)
                await app.rentMovie()
                app.db.any('SELECT * FROM rent_list WHERE username = $1 AND movie_title = $2;', [app.currentUser, movie_title])
                    .then((data => {
                        row_exists = data.length
                        assert.equal(row_exists, 1);
                    }))
                db.none('DELETE * FROM rent_list WHERE username = $1;', [app.currentUser]);
            })
            it('rent with points non-premium user', async function () {
                app.currentUser = 'test1'
                app.isPremium = false
                let movie_id = 284053
                let movie_title = 'Thor: Ragnarok'
                let row_exists = 0
                app.addCartItem(movie_id);
                app.rentWithPoints = true
                await app.rentMovie()
                app.db.any('SELECT * FROM rent_list WHERE username = $1 AND movie_title = $2;', [app.currentUser, movie_title])
                    .then((data => {
                        row_exists = data.length
                        assert.equal(row_exists, 1);
                    }))
                db.none('DELETE * FROM rent_list WHERE username = $1;', [app.currentUser]);
            })
            it('rent overcap with money premium user', async function () {
                app.currentUser = 'test1'
                app.isPremium = true
                let movie_id1 = 284053
                let movie_id2 = 10195
                let movie_id3 = 76338
                let movie_id4 = 616037
                let movie_count = 0
                app.addCartItem(movie_id1);
                app.addCartItem(movie_id2);
                app.addCartItem(movie_id3);
                app.addCartItem(movie_id4);
                app.rentWithPoints = false
                await app.addValue(40)
                await app.rentMovie()
                app.db.any('SELECT * FROM rent_list WHERE username = $1;', [app.currentUser])
                    .then((data => {
                        movie_count = data.length
                        assert.equal(movie_count, 4);
                    }))
                db.none('DELETE * FROM rent_list WHERE username = $1;', [app.currentUser]);
            })
            it('return movie', async function() {
                app.currentUser = 'test1'
                let movie_id1 = 10195
                let movie_title = 'Thor'
                let row_exists = 0
                app.addCartItem(movie_id1);
                await app.rentMovie()
                app.returnMovie(movie_title)
                app.db.any('SELECT * FROM rent_list WHERE username = $1 AND movie_title = $2', [app.currentUser, movie_title])
                .then(data => {
                    row_exists = data.length
                    assert.equal(row_exists, 1)
                })
            })
        })
        describe('fines and rent privilege', function () {
            it('toggle privilege', function () {
                let user = 'test1'
                let row_exists = 0
                app.db.none('UPDATE rent_privilege SET rent_blocked = true WHERE username = $1;', [user])
                    .then(() => {
                        app.togglePriv(user)
                        app.db.none('SELECT * FROM rent_privilege WHERE username = $1 AND rent_blocked = false;', [user])
                            .then((data) => {
                                row_exists = data.length
                                assert.equal(row_exists, 1)
                            })
                    })
            })
            it('waive fine', async function () {
                app.currentUser = 'Arham'
                let user = 'test1'
                let row_exists = 0
                app.db.none('UPDATE fees SET overdue_fine = 20.00 WHERE username = $1', [user]);
                app.payFine(user)
                app.db.any('SELECT * FROM fees WHERE username = $1 AND overdue_fine = $0.00', [user])
                    .then(data => {
                        row_exists = data.length
                        assert.equal(row_exist, 1)
                    })
            })
            it('pay fine', async function () {
                app.currentUser = 'test1'
                let user = 'test1'
                let balance = 0
                let row_exists = 0
                app.db.any('SELECT * FROM wallet WHERE username = $1', [user])
                    .then(data => {
                        for (const row in data) {
                            balance = row.balance
                        }
                    })
                app.db.none('UPDATE fees SET overdue_fine = 20.00 WHERE username = $1', [user]);
                app.payFine(user)
                app.db.any('SELECT * FROM wallet WHERE username = $1 AND balance = $2', [user, '$' + (balance - 20)])
                    .then(data => {
                        row_exists = data.length
                        assert.equal(row_exist, 1)
                    })
            })
        })
        describe('friends system', function () {
            it('send friend request', function () {
                app.currentUser = 'test1'
                let friend = 'user1'
                let row_exist = 0
                app.sendRequest(friend)
                app.db.any('SELECT * FROM request_list WHERE username = $1 AND request = $2', [app.currentUser, friend])
                    .then(data => {
                        row_exists = data.length
                        assert.equal(row_exist, 1)
                    })
            })
            it('accept friend request', function () {
                app.currentUser = 'test1'
                let friend = 'user1'
                let row_exist = 0
                app.addFriend(friend)
                app.db.any('SELECT * FROM friends_list WHERE username = $1 AND friend = $2', [app.currentUser, friend])
                    .then(data => {
                        row_exists = data.length
                        assert.equal(row_exist, 1)
                    })
            })
            it('remove friend', function () {
                app.currentUser = 'test1'
                let friend = 'user1'
                let row_exist = 1
                app.removeFriend(friend)
                app.db.any('SELECT * FROM friends_list WHERE username = $1 AND friend = $2', [app.currentUser, friend])
                    .then(data => {
                        row_exists = data.length
                        assert.equal(row_exist, 0)
                    })
            })
        })
    })
}
runTests()
