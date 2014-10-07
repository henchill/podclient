var PodClient = function() {
	var self = Object.create(PodClient.prototype);

	var currentUser = {};

	self.init = function() {
		var container = $("<div id='login'/>");
		container.css({
			'position': 'absolute',
			'top': '0px',
			'right': '0px',
			'padding': '5px',
			'border': '1px solid black'
		});
		$('body').prepend(container);
		getSession();
		toggleLogin();
	}

	self.insertItem = function(item, callback) {
		console.log("insert called");
		if (jQuery.isEmptyObject(currentUser)) {
			alert("Please sign in or sign up for an account");
		} else {
			$.ajax({
				type: "POST",
				url: currentUser._id,
				data: JSON.stringify(item),
				success: function(d, s, r) {
					// cannot find response header
					callback(r.getResponseHeader('Location'), s);
				},
				error: function(d, s, r) {
					callback(undefined, s);
				}
			});
		}
	}


	self.getItem = function (loc, callback) {
		if (logged_in && loc !== undefined && callback != undefined) {
			$.ajax({
				type: "GET",
				url: loc,
				dataType: "json",
				success: function(d, s, r) {
					callback(d, s);
				},
				error: function (d, s, r) {
					callback(d, s);
				}
			});
		}
	}

	/**
	 * Updates an item on the user's pod. 
	 * Not implemented on the backend
	 */
	self.updateItem = function (data, callback) {
		if (data != null && data._id) {
			$.ajax({
				type: "PUT",
				url: data._id,
				dataType: "json",
				success: function(d, s, r) {
					callback(d, s);
				},
				error: function(d, s, r) {
					callback(d, s);
				}
			});
		}
	}

	/**
	 * Return all items located in a pod. 
	 */
	self.getItems = function(pod, callback) {
		if (pod != undefined && callback != undefined) {
			if (pod.slice(-1) === "/") {
				pod = (0, -1);
			}
			$.ajax({
				type: "GET",
				url: pod + "/_active",
				// dataType: "application/json",
				success: function(d, s, r) {
					data = JSON.parse(d)._members;
					callback(data, s);
				},
				error: function(d, s, r) {
					callback(d, s);
				}
			});
		}
	}

	/**
	 * Return information about the current user.
	 */
	self.getCurrentUser = function() {
		return currentUser;
	}

	var logged_in = function () {
		if (currentUser.username) {
			return true;
		} 
		return false;
	}

	var toggleLogin = function () {
		var container = $("#login");
		if (!currentUser.username) {
			container.empty();
			var username = $('<input>').attr({'type': 'text', 
											  'id': 'username',
											  'placeholder': 'username'});
			var loginButton = $('<button id="linBtn">').text('Login');
			loginButton.click(function() {
				self.loginUser($('#username').val());
			});
			var signupButton = $('<button id="sgnBtn">').text('SignUp');
			signupButton.click(signupUser);
			container.append(username);
			container.append(loginButton);
			container.append(signupButton);
		} else {
			container.empty();
			var username = $('<input>').attr({'type': 'text', 
											  'id': 'username',
											  'placeholder': currentUser.username});
			username.prop('disabled', true);
			var logoutButton = $('<button id="loutBtn">').text('Logout');
			logoutButton.click(logoutUser);
			container.append(username);
			container.append(logoutButton);
		}
	}


	/**
	 * Should login the user and fetch some basic information about the user from their pod
	 */
	self.loginUser = function (username) {
		// var username = $('#username').val();
		console.log("logging in user: " + username);
		if (!username || username.trim() === ""){
			alert("Please provide a username");
		} else {
			var userpod = "http://" + username + ".fakepods.com"
			$.ajax({
				type: "GET", 
				url: userpod,
				dataType: "json",
				success: function(d, s, r) {
					currentUser['username'] = username;
					for (var k in d) {
						if (d.hasOwnProperty(k)) {
							currentUser[k] = d[k];
						}
					}
					console.log(currentUser.username);
					saveSession();
				},
				error: function(d, s, r) {
					alert("couldn't find fakepod for given username: " + username);
				},
				complete: function(d, s, r) {
					toggleLogin();
				}
			});
		}
	}

	var signupUser = function() {
		var username = $('#username').val();
		console.log(username);
		if (!username || username.trim() === ""){
			alert("Please provide a username");
		} else {
			var userpod = "http://" + username + ".fakepods.com"
			$.ajax({
				type: "POST", 
				url: userpod,
				dataType: "json",
				success: function(d, s, r) {
					currentUser["username"] = username;
					for (var k in d) {
						if (d.hasOwnProperty(k)) {
							currentUser[k] = d[k];
						}
					}
					saveSession();
				},
				error: function(d, s, r) {
					// posting to the pod without any items throws an error.
					// this is a hack to sign people up without them having to post an item
					$.ajax({
						type: "GET", 
						url: userpod,
						dataType: "json",
						success: function(d, s, r) {
							currentUser["username"] = username;
							for (var k in d) {
								if (d.hasOwnProperty(k)) {
									currentUser[k] = d[k];
								}
							}
							saveSession();
						},
						error: function() {
							alert("couldn't create pod for user: " + username);	
						},
						complete: function() {
							toggleLogin();
						}
					});
					console.log("ignore post error for now.");
				},
				complete: function(d, s, r) {
					toggleLogin();
				}
			});
		}
	}

	var logoutUser = function() {
		currentUser = {};
		deleteSession();
		toggleLogin();
		// logout of backend

	}

	var saveSession = function() {
		if(typeof(Storage) !== "undefined") {
   			sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
		} else {
		    // Sorry! No Web Storage support..
		    console.log("No web storage support");
		}
	}

	var deleteSession = function() {
		if (typeof(Storage) !== "undefined") {
			sessionStorage.removeItem("currentUser");
		}
	}

	var getSession = function () {
		if (typeof(Storage) !== "undefined") {
			if (sessionStorage.getItem("currentUser") !== null) {
				currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
			}			
		}
	}

	return self;
}