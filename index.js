const e = require('express')
const express = require('express')
const fetch = require('node-fetch')
const path = require('path')
const { setUncaughtExceptionCaptureCallback } = require('process')
const app = express()
const pgp = require('pg-promise')()
//const db = pgp('postgres://postgres:Asym_111@localhost:5432/myDB')
const db = pgp('postgres://postgres:741852963@db-hw3.co27icswrmbi.us-east-2.rds.amazonaws.com:5432/postgres')
const port = 3002
const moviedb_api_key = '64be712340bbd3d30d0546d8d7db1778';

var currentUser = 'bob';
var results_page;
var insufficientFunds;
var rentBlocked;
var rentWithPoints;
var isPremium;
var rentCapped = false;

//we need to use this below to filter the genres the user selects
const genres =
	[
		{ "id": 28, "name": "Action" },
		{ "id": 12, "name": "Adventure" },
		{ "id": 16, "name": "Animation" },
		{ "id": 35, "name": "Comedy" },
		{ "id": 80, "name": "Crime" },
		{ "id": 99, "name": "Documentary" },
		{ "id": 18, "name": "Drama" },
		{ "id": 10751, "name": "Family" },
		{ "id": 14, "name": "Fantasy" },
		{ "id": 36, "name": "History" },
		{ "id": 27, "name": "Horror" },
		{ "id": 10402, "name": "Music" },
		{ "id": 9648, "name": "Mystery" },
		{ "id": 10749, "name": "Romance" },
		{ "id": 878, "name": "Science Fiction" },
		{ "id": 10770, "name": "TV Movie" },
		{ "id": 53, "name": "Thriller" },
		{ "id": 10752, "name": "War" },
		{ "id": 37, "name": "Western" }
	]

app.set('view engine', 'pug')

app.use(express.static(__dirname));

app.get('/', (req, res) => {
	res.render('login_screen', {})
})
app.get('/login', (req, res) => {
	const username = req.query.username;
	const password = req.query.password;

	db.one('SELECT * FROM users WHERE username = $1;', username).then(data => {
		console.log(data)

		currentUser = username

		if (data.password === password) {
			if (data.is_admin === true) {
				res.redirect('/home_admin')
			}
			else {
				isPremium = data.is_premium
				res.redirect('/home')
			}
		}
		else {
			res.render('login_screen', { passed_in_text: 'Invalid username/password' })
		}
	}).catch(error => {
		console.log(error)
		res.render('login_screen', { passed_in_text: 'Invalid username/password' })
	})
})

app.get('/home', (req, res) => {
	console.log("Home request")
	res.render('home', { error_msg: '' })
})

app.get('/home_admin', (req, res) => {
	console.log("Home admin request")
	res.render('home_admin', { error_msg: '' })
})
app.get('/admin_panel', (req, res) => {
	console.log("Admin panel request")
	res.render('admin_panel', { error_msg: '' })
})

app.get('/movie_collections', async (req, res) => {
	console.log("Movie collections request")
	console.log("Searching for: " + req.query.keywords)
	results_page = req.query.movieURL;
	fetch(results_page).then(result => result.json()).then(data => {
		res.render("movie_collections", { movieData: data });
	})
})
/* ============================================================================
	MOVIE Collection

app.get('/movie_collection', (req, res) => {
	console.log("Movie collection request")
	res.render('movie_collection', { error_msg: '' })
})

app.get('/movie_results', async(req, res) => {
	console.log("Movie results request")
	console.log("Searching for: " + req.query.keywords)
	results_page = req.query.keywords;
	let url = await runSearch(req.query.keywords, req.query.category, req.query.min_user_score, req.query.max_runtime, req.query.release_date)
	fetch(url).then(result => result.json()).then(data => {
		//console.log(data);
		res.render("movie_results", { movieData: data.results });
	})
})

function runSearch(keyword, category, min_user_score, max_runtime, release_date) {
	var url;
	if (keyword !== undefined) {
		url = ''.concat('https://api.themoviedb.org/3/search/collection?api_key=' + moviedb_api_key + '&language=en-US' + '&query=', keyword); 
	}
	else {
		url = ''.concat('https://api.themoviedb.org/3/discover/movie?api_key=' + moviedb_api_key)
		url = url.concat('&with_genres=', category === undefined ? '' : category);
		url = url.concat('&vote_average.gte=', min_user_score);
		url = url.concat('&with_runtime.lte=', max_runtime);
		if (release_date !== '') {
			url = url.concat('&primary_release_date.gte=', release_date);
			url = url.concat('&sort_by=release_date.asc');
		}
	}
	console.log(url);
	return url;
}

app.get('/movie_details', (req, res) => {
	console.log("Movie details request")

	function runSearch() {
		let url = req.query.movieURL;
		fetch(url)
			.then(result => result.json())
			.then((data) => {
				res.render("movie_details", {
					movieData: data,
					results: results_page
				});
			})
	}
	runSearch()
})

app.get('/movie_details_admin', (req, res) => {
	console.log("Movie details admin request")

	function runSearch() {
		let url = req.query.movieURL;
		fetch(url)
			.then(result => result.json())
			.then((data) => {
				res.render("movie_details_admin", {
					movieData: data,
					results: results_page
				});
			})
	}
	runSearch()
})
*/

/* =============================================================================
	MOVIE SEARCH
*/

app.get('/movie_search', (req, res) => {
	console.log("Movie search request")
	res.render('movie_search', { error_msg: '' })
})

app.get('/movie_results', async (req, res) => {
	console.log("Movie results request")
	console.log("Searching for: " + req.query.keywords)
	results_page = req.query.keywords;
	let url = await runSearch(req.query.keywords, req.query.category, req.query.min_user_score, req.query.max_runtime, req.query.release_date)
	fetch(url).then(result => result.json()).then(data => {
		//console.log(data);
		res.render("movie_results", { movieData: data.results });
	})
})

function runSearch(keyword, category, min_user_score, max_runtime, release_date) {
	var url;
	if (keyword !== undefined) {
		url = ''.concat('https://api.themoviedb.org/3/search/movie?api_key=' + moviedb_api_key + '&query=', keyword);
	}
	else {
		url = ''.concat('https://api.themoviedb.org/3/discover/movie?api_key=' + moviedb_api_key)
		url = url.concat('&with_genres=', category === undefined ? '' : category);
		url = url.concat('&vote_average.gte=', min_user_score);
		url = url.concat('&with_runtime.lte=', max_runtime);
		if (release_date !== '') {
			url = url.concat('&primary_release_date.gte=', release_date);
			url = url.concat('&sort_by=release_date.asc');
		}
	}
	//console.log(url);
	return url;
}

app.get('/movie_details', (req, res) => {
	console.log("Movie details request")
	function runSearch() {
		let url = req.query.movieURL;
		fetch(url).then(result => result.json()).then((data) => {
			data.details_url = url;
			db.any('SELECT * FROM friends_list WHERE username = $1;', [currentUser]).then(friend_data => {
				res.render("movie_details", { movieData: data, results: results_page, friends: friend_data })
			}).catch(error => { console.log(error) })
		})
	}
	runSearch()
})

app.get('/movie_details_admin', (req, res) => {
	console.log("Movie details admin request")

	function runSearch() {
		let url = req.query.movieURL;
		fetch(url)
			.then(result => result.json())
			.then((data) => {
				res.render("movie_details_admin", {
					movieData: data,
					results: results_page
				});
			})
	}
	runSearch()
})

/* =============================================================================
	CART
*/

app.get('/cart', async (req, res) => {
	console.log("Cart request")
	cartResults(function (results) {
		let data = results.cartDetails
		let totalCost = results.cartCost
		let remainingAmount = results.leftover
		let currBalance = results.currentBalance
		let currPoints = results.currentPoints
		let isPremium = results.is_premium
		res.render("cart", {
			cartDetails: data,
			cartCost: totalCost,
			leftover: remainingAmount,
			currentBalance: currBalance,
			currentPoints: currPoints,
			is_premium: isPremium
		})
	})
})

function cartResults(callback) {
	db.any('SELECT * FROM cart WHERE username = $1;', [currentUser]).then(data => {
		let totalCost = 0
		if (isPremium) {
			totalCost = data.length * 10
		}
		else {
			totalCost = data.length * 10 + 5
		}
		let remainingAmount = 0.00
		let currBalance = 0.00
		let currPoints = 0;

		db.any('SELECT * FROM wallet WHERE username = $1;', [currentUser])
			.then((innerData) => {
				for (const row of innerData) {
					let currentAmount = parseFloat(row.balance.substring(1))
					remainingAmount = currentAmount - parseFloat(totalCost);
					currBalance = currentAmount
					currPoints = row.reward_points
				}
				let result = {
					cartDetails: data,
					cartCost: '$ ' + totalCost + '.00',
					leftover: '$ ' + remainingAmount + '.00',
					currentBalance: '$ ' + currBalance + '.00',
					currentPoints: currPoints,
					is_premium: isPremium
				}
				return callback(result)
			})
			.catch(error => {
				console.log(error)
			})

	}).catch(error => {
		console.log(error)
	})
}

app.get('/add_cart_item', (req, res) => {
	console.log('Add to cart request');
	addCartItem(req.query.itemID, res)
})

app.get('/remove_cart_item', (req, res) => {
	//console.log(req.query.item)
	removeCartItem(req.query.item)
	res.redirect('/cart')
})

function addCartItem(movie_id, res) {
	function searchForCartItem() {
		let url = ''.concat("https://api.themoviedb.org/3/movie/" + movie_id + "?api_key=64be712340bbd3d30d0546d8d7db1778&language=en-US");
		fetch(url).then(result => result.json()).then((data) => {
			let posterPath = "https://image.tmdb.org/t/p/original/" + data.poster_path
			db.none('INSERT INTO cart VALUES ($1, $2, $3, $4);', [currentUser, posterPath, url, data.title]).then(na => {
				/* Commented out for demo */
				//res.redirect('/cart');
			})
		}).catch(error => {
			console.log(error);
		})
	}
	searchForCartItem();
}

function removeCartItem(item) {
	db.none('DELETE FROM cart WHERE username = $1 AND movie_title = $2;', [currentUser, item]);
}

/* =============================================================================
	RENTALS
*/

app.get('/rentals', (req, res) => {
	console.log("Rentals request")

	db.any('SELECT * FROM rent_list WHERE username = $1;', [currentUser]).then(data => {
		res.render("rentals", { rentalDetails: data })
	}).catch(error => { console.log(error) })
})

app.get('/rentals_list_admin', (req, res) => {
	console.log("Rentals list admin request")

	db.any('SELECT DISTINCT username FROM rent_list;').then(data => {
		res.render("rentals_list_admin", { rentals: data });
	}).catch(error => { console.log(error) })
})

app.get('/rentals_admin', (req, res) => {
	console.log("Rentals admin request")
	db.any('SELECT * FROM rent_list WHERE username = $1;', req.query.username).then(data => {
		res.render("rentals_admin", {
			rentalDetails: data,
			username: req.query.username
		})
	}).catch(error => {
		console.log(error)
	})
})

var changed = false;
app.get('/rent_movie', async (req, res) => {
	console.log('Checkout Request');
	rentWithPoints = req.query.pointsUsed;
	if (rentWithPoints === 'true') {
		rentWithPoints = true
	}
	else {
		rentWithPoints = false
	}
	rentMovie()
	while (changed == false) { await new Promise(r => setTimeout(r, 1000)); }
	changed = false;
	rentWithPoints = false;
	if (!insufficientFunds && !rentBlocked && !rentCapped) {
		db.none('DELETE FROM cart WHERE username = $1', [currentUser]);
		res.redirect('/rentals')
	}
	else {
		res.redirect('/cart');
	}
	rentCapped = false;
})

app.get('/return_movie', (req, res) => {
	returnMovie(req.query.title)
	//console.log(req.query.title)
	res.redirect('/rentals')
})

function rentMovie() {
	let today = new Date();
	let dd = String(today.getDate()).padStart(2, '0');
	let mm = String(today.getMonth() + 1).padStart(2, '0');
	let yyyy = today.getFullYear();

	today = String(mm + '/' + dd + '/' + yyyy);

	if (mm === "12") {
		if (isPremium === true) {
			mm = "2";
		}
		else {
			mm = "1";
		}
		yyyy = String(parseInt(yyyy) + 1);
	} else if (mm === "11" && isPremium === true) {
		mm = "1";
		yyyy = String(parseInt(yyyy) + 1);
	}
	else {
		if (isPremium === true) {
			mm = String(parseInt(mm) + 2);
		}
		else {
			mm = String(parseInt(mm) + 1);
		}
	}
	let dateDue = mm + '/' + dd + '/' + yyyy;
	let total_cost = 0.00;
	let remainingBalance = 0.00;
	let currentBalance = 0.00;
	let currrentPoints = 0;
	let pointsEarned = 0;
	let pointsUsed = 0;
	let rent_limit = 0;

	db.any('SELECT * FROM wallet WHERE username = $1;', [currentUser])
		.then((data) => {
			for (const record of data) {
				currentPoints = record.reward_points;
			}
		}).catch(error => { console.log(error) })

	db.any('SELECT * FROM cart WHERE username = $1;', [currentUser])
		.then((data) => {
			db.any('SELECT * FROM rent_list WHERE username = $1 AND date_returned IS NULL', [currentUser])
				.then((limitData) => {
					rent_limit = limitData.length + data.length
				}).catch(error => { console.log(error) })
			if (isPremium === true) {
				pointsEarned = data.length * 5
				total_cost = data.length * 10
			}
			else {
				pointsEarned = data.length * 2;
				total_cost = data.length * 10 + 5
			}
			pointsUsed = data.length * 10
			db.any('SELECT * FROM wallet WHERE username = $1;', [currentUser])
				.then((innerData) => {
					for (const row of innerData) {
						currentBalance = parseFloat(row.balance.substring(1))
						remainingBalance = currentBalance - parseFloat(total_cost);
					}
					db.any('SELECT * FROM rent_privilege WHERE username = $1;', [currentUser])
						.then((priv_data) => {
							for (const record of priv_data) {
								rentBlocked = record.rent_blocked;
							}
							if (rent_limit > 3 && !isPremium) {
								rentCapped = true
								changed = true
								return
							}
							else {
								if (rentBlocked === true) {
									//do nothing
								}
								else if (rentWithPoints === false) {
									if (remainingBalance >= 0.00) {
										db.none('UPDATE wallet SET balance = $1, reward_points = $2 WHERE username = $3;', [remainingBalance, currentPoints + pointsEarned, currentUser])
										for (const movie of data) {
											db.none('INSERT INTO rent_list VALUES ($1, $2, $3, $4, $5, $6, $7);', [currentUser, movie.img_url, movie.details_url, today, null, dateDue, movie.movie_title])
										}
										insufficientFunds = false;
									}
									else {
										insufficientFunds = true;
									}
								}
								else if (rentWithPoints === true) {
									if (currentPoints - pointsUsed >= 0) {
										db.none('UPDATE wallet SET balance = $1, reward_points = $2 WHERE username = $3;', [currentBalance, currentPoints + pointsEarned - pointsUsed, currentUser])
										for (const movie of data) {
											db.none('INSERT INTO rent_list VALUES ($1, $2, $3, $4, $5, $6, $7);', [currentUser, movie.img_url, movie.details_url, today, null, dateDue, movie.movie_title])
										}
										insufficientFunds = false;
									}
									else {
										insufficientFunds = true;
									}
								}
								changed = true;
							}
						}).catch(error => { console.log(error) })
				}).catch(error => { console.log(error) })
		}).catch(error => { console.log(error) })
}

function returnMovie(title) {
	let today = new Date();
	let dd = String(today.getDate()).padStart(2, '0');
	let mm = String(today.getMonth() + 1).padStart(2, '0');
	let yyyy = today.getFullYear();

	today = String(mm + '/' + dd + '/' + yyyy);
	//console.log(title);
	db.none('UPDATE rent_list SET date_returned = $1 WHERE movie_title = $2 AND username = $3;', [today, title, currentUser])
}

/* =============================================================================
	FINES
*/

app.get("/overdue_fines", function (req, res, next) {
	db.any('SELECT * FROM fees;').then(data => {
		console.log("Overdue fines request")
		res.render("overdue_fines", {
			userData: data
		});
	}).catch(error => { console.log(error) })
});

app.get('/my_fines', (req, res) => {
	console.log("Fines request")

	db.any('SELECT * FROM fees WHERE username = $1;', [currentUser]).then(data => {
		res.render("my_fines", { myFines: data })
	}).catch(error => { console.log(error) });
})

app.get('/pay_fine', async (req, res) => {
	await payFine(req.query.username)
	db.one('SELECT * FROM users WHERE username = $1;', [currentUser]).then(data => {
		if (data.is_admin === true) {
			res.redirect('/overdue_fines')
		}
		else {
			res.redirect('/my_fines')
		}
	}).catch(error => { console.log(error) })
})

async function payFine(username) {
	if (username === "")
		return;
	db.any('SELECT * FROM users WHERE username = $1;', [currentUser])
		.then(data => {
			let isAdmin = undefined
			for (const entry of data) {
				isAdmin = entry.is_admin
			}
			if (isAdmin === false) {
				let fineAmount = 0
				let currentBalance = 0
				db.any('SELECT * FROM fees WHERE username = $1;', [username])
					.then(feeData => {
						for (const row of feeData) {
							fineAmount = parseFloat(row.overdue_fine.substring(1));
						}
						db.any('SELECT * FROM wallet WHERE username = $1;', [username])
							.then(walletData => {
								for (const record of walletData) {
									currentBalance = parseFloat(record.balance.substring(1));
								}
							})
							.then(() => {
								if(currentBalance - fineAmount >= 0.00){
									db.none('UPDATE wallet SET balance = $1 WHERE username = $2', [currentBalance - fineAmount, username])
									db.none("UPDATE fees SET overdue_fine = $1 WHERE username = $2;", ['0.00', username]);
								}
								else{
									return;
								}
							}).catch(error => { console.log(error) })
					}).catch(error => { console.log(error) })
			}
			else if (isAdmin === true){
				db.none("UPDATE fees SET overdue_fine = $1 WHERE username = $2;", ['0.00', username]);
			}
		}).catch(error => { console.log(error) })
}

/* =============================================================================
	WALLET
*/

app.get('/wallet', (req, res) => {
	console.log("Wallet request")
	db.one('SELECT * FROM wallet WHERE username = $1;', [currentUser]).then(data => {
		res.render("wallet", { wallet: data })
	}).catch(error => { console.log(error) })
})

app.get('/add_value', (req, res) => {
	db.oneOrNone('SELECT * FROM wallet WHERE username = $1;', [currentUser]).then(data => {
		if (parseInt(req.query.value) < 0) {
			res.render('wallet', {
				error_msg: 'Insufficient value',
				wallet: data
			})
		}
		else {
			addValue(req.query.value)
			res.redirect('/wallet')
		}
	}).catch(error => { console.log(error) })
})

function addValue(value) {
	db.none("UPDATE wallet SET balance = balance + $1 WHERE username = $2", [value, currentUser]);
}

/* =============================================================================
	RENT PRIVILEGES
*/

app.get("/rent_priv", function (req, res, next) {
	db.any('SELECT * FROM rent_privilege;').then(data => {
		console.log("Rent privilege request")
		res.render("rent_priv", {
			rentPriv: data
		});
	}).catch(error => { console.log(error) })
})

app.get('/toggle_priv', (req, res) => {
	togglePriv(req.query.username)
	res.redirect('/rent_priv')
})

function togglePriv(username) {
	if (username === "")
		return;

	db.none("UPDATE rent_privilege SET rent_blocked = NOT rent_blocked WHERE username = $1;", [username]);
}

/* =============================================================================
	FRIENDS
*/

app.get('/friends', (req, res) => {
	console.log("Friends request")
	db.any('SELECT * FROM friends_list WHERE username = $1;', [currentUser]).then(data => {
		res.render("friends", { friends: data })
	}).catch(error => { console.log(error) })
})

app.get('/add_friend', (req, res) => {
	let friend = req.query.username;
	db.oneOrNone('SELECT * FROM users WHERE username = $1 AND is_admin = false;', friend).then(data => {
		db.any('SELECT * FROM friends_list WHERE username = $1;', [currentUser]).then(friendsData => {
			db.any('SELECT * FROM request_list WHERE username = $1;', friend).then(innerData => {
				// adding oneself
				if (data != null && friend == currentUser) {
					res.render("friends", { friends: friendsData, error_msg: 'Cannot add yourself!' })
					return;
				}

				// adding nonexistent user
				if (data == null) {
					res.render("friends", { friends: friendsData, error_msg: 'User does not exist!' })
					return;
				}

				if (data != null) {
					// sending duplicate requests
					if (innerData != null) {
						for (const row of innerData) {
							if (row.request == currentUser) {
								res.render("friends", { friends: friendsData, error_msg: "Already sent request to " + friend })
								return;
							}
						}
					}

					// adding duplicates
					for (const row of friendsData) {
						if (row.friend == friend) {
							res.render("friends", {
								friends: friendsData,
								error_msg: row.friend + " already added!"
							})
							return;
						}
					}
					sendRequest(friend)
					res.redirect("/friends")
				}

			}).catch(error => { console.log(error) })
		}).catch(error => { console.log(error) })
	}).catch(error => { console.log(error) })
})

app.get('/friend_requests', (req, res) => {
	console.log("Friend requests request")
	db.any('SELECT * FROM request_list WHERE username = $1;', [currentUser]).then(data => {
		res.render("friend_requests", { requests: data })
	}).catch(error => { console.log(error) })
})

app.get('/accept_request', async (req, res) => {
	addFriend(req.query.request)
	await new Promise(r => setTimeout(r, 500));
	res.redirect("/friend_requests")
})

app.get('/remove_friend', async (req, res) => {
	removeFriend(req.query.friend)
	await new Promise(r => setTimeout(r, 500));
	res.redirect("/friends")
})

app.get('/recommend_friend', async (req, res) => {
	db.oneOrNone('SELECT * FROM movie_recommendations WHERE username = $1 AND friend = $2 AND movie_title = $3;', [currentUser, req.query.friend, req.query.movie_title]).then(data => {
		if (data === null) {
			db.none('INSERT INTO movie_recommendations VALUES ($1, $2, $3, $4, $5);', [currentUser, req.query.friend, req.query.poster_path, req.query.details_url, req.query.movie_title]).then(data => {
				res.redirect('/friends');
			})
		}
		else
			res.redirect('/friends');

	}).catch(error => { console.log(error) })
})

app.get('/friend_recommendations', async (req, res) => {
	db.any('SELECT * FROM movie_recommendations WHERE friend = $1;', [currentUser]).then(data => {
		res.render('friend_recommendations', { recommendations: data })
	}).catch(error => { console.log(error) })
})

function addFriend(friend) {
	if (friend === '') return;

	db.none('INSERT INTO friends_list VALUES ($1, $2);', [currentUser, friend])
	db.none('INSERT INTO friends_list VALUES ($1, $2);', [friend, currentUser])
	db.none('DELETE FROM request_list WHERE username = $1 AND request = $2;', [friend, currentUser])
	db.none('DELETE FROM request_list WHERE username = $1 AND request = $2;', [currentUser, friend])
}

function sendRequest(friend) {
	if (friend === '') return;

	db.none('INSERT INTO request_list VALUES ($1, $2);', [friend, currentUser])
	return true;
}

function removeFriend(friend) {
	db.none('DELETE FROM friends_list WHERE username = $1 AND friend = $2;', [friend, currentUser])
	db.none('DELETE FROM friends_list WHERE username = $1 AND friend = $2;', [currentUser, friend])
}

/* =============================================================================
	USERS
*/

app.get("/users", function (req, res, next) {
	db.any('SELECT * FROM users;').then(data => {
		console.log("Users request")
		res.render("users", { allData: data });
	});
})

app.get('/create_users', (req, res) => {
	console.log("Create Users request")
	res.render('create_users', { error_msg: '' })
})

app.get('/create_user', (req, res) => {
	db.oneOrNone('SELECT * FROM users WHERE username = $1;', req.query.username).then(data => {
		if (data != null) {
			res.render('create_users', { error_msg: 'Username already exists!' })
		}
		else if (insertUser(req.query.username, req.query.password, req.query.is_admin === undefined ? false : true) === true) {
			res.render('create_users', { error_msg: 'Successfully created new user!' })
		}
		else {
			res.render('create_users', { error_msg: 'Creation of new user unsuccessful!' })
		}
	}).catch(error => {
		console.log(error)
		res.render('create_users', { error_msg: 'Creation of new user unsuccessful!' })
	})
})

app.get('/premium', (req, res) => {
	console.log("premium upgrade page request")
	db.one('SELECT * FROM users WHERE username = $1;', [currentUser]).then(data => {
		res.render("premium", { account_status: data })
	}).catch(error => { console.log(error) })
})

app.get('/upgrade_to_premium', (req, res) => {
	var currentBalance;
	var alreadyPremium = false;
	db.any('SELECT COUNT(*) FROM users WHERE username = $1 AND is_premium = true', [currentUser])
		.then(data => {
			if (data.length === 0) {
				alreadyPremium = true;
			}
		}).catch(error => { console.log(error + 'here is the issue') })
	if (alreadyPremium === false) {
		db.oneOrNone('SELECT * FROM wallet WHERE username = $1;', [currentUser]).then(data => {
			currentBalance = parseFloat(data.balance.substring(1));
			if (currentBalance - 50 > 0) {
				db.none('UPDATE users SET is_premium = true WHERE username = $1', [currentUser])
				db.none('UPDATE wallet SET balance = $1 WHERE username = $2', [currentBalance - 50, currentUser]);
			}
			res.redirect('/premium')
		}).catch(error => { console.log(error) })
	}
	else {
		res.redirect('/premium')
	}
})

app.get('/delete_user', (req, res, next) => {
	deleteUser(req.query.username)
	res.redirect('/users')
})

app.get('/reset_password', (req, res) => {
	resetPassword(req.query.username)
	res.redirect('/users')
})

function insertUser(username, password, is_admin) {
	if (username === "" || password === "")
		return false;

	db.none('INSERT INTO users VALUES ($1, $2, $3, false);', [username, password, is_admin])
		.then(() => {
			if (is_admin === false) {
				db.none('INSERT INTO wallet VALUES ($1, $2, $3);', [username, 100.00, 0]);
				db.none('INSERT INTO rent_privilege VALUES ($1, $2);', [username, false]);
				db.none('INSERT INTO fees VALUES($1, $2);', [username, 0.00]);
			}
		})

	return true;
}

async function deleteUser(username) {
	if (username === "")
		return;

	await db.none('DELETE FROM rent_list WHERE username = $1', username)
	await db.none('DELETE FROM wallet WHERE username = $1', username)
	await db.none('DELETE FROM rent_privilege WHERE username = $1', username)
	await db.none('DELETE FROM fees WHERE username = $1', username)
	await db.none('DELETE FROM cart WHERE username = $1', username)
	await db.none('DELETE FROM friends_list WHERE username = $1', username)
	await db.none('DELETE FROM movie_recommendations WHERE username = $1', username)
	await db.none('DELETE FROM request_list WHERE username = $1', username)
	await db.none('DELETE FROM users WHERE username = $1', username)
}

function resetPassword(username) {
	if (username === "")
		return;

	db.none("UPDATE users SET password = $1 WHERE username = $2;", ['password', username]);
}

/* =============================================================================
	EXPORT FOR TESTING
*/
module.exports = {
	sayHello: function () {
		return 'hello';
	},
	e,
	express,
	fetch,
	path,
	app,
	pgp,
	db,
	port,
	moviedb_api_key,
	currentUser,
	results_page,
	insufficientFunds,
	rentBlocked,
	rentWithPoints,
	isPremium,
	rentCapped,
	insertUser,
	resetPassword,
	deleteUser,
	addFriend,
	sendRequest,
	removeFriend,
	togglePriv,
	addValue,
	payFine,
	returnMovie,
	rentMovie,
	removeCartItem,
	addCartItem,
	runSearch
}

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})
