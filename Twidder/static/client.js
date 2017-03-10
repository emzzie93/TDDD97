var currUserPage = "me";
var user = "me";
var addinfoview = false;
var view = "not set";
var my_email = "not set";
var error = false;
var numOfPosts = 0;

/* View functions */

displayView = function(){
// hämta data igen

	if("myToken" in localStorage) {

		view = document.getElementById("profileView").innerHTML;
		addinfoview = true;
	}

	else{

		view = document.getElementById("loginView").innerHTML;
		addinfoview = false;

	}

	
	var myview =  document.getElementById('currentView');

	myview.innerHTML = view;
	if (addinfoview){
		addinfo("me");
    }
};

window.onload = function(){
	displayView();

};

/* hashfunction
 *
 * This function uses the CryptoJS HMAC-SHA256 hashing algoritm. The input message is then hashed with the
 * token and returned.
 *
 * message:A string of all variables to be sent.
 *
 * Changes done in the code due to this implementation is that
 *
 */

hash_message = function (message) {

	var token = localStorage.getItem("myToken");
	var hashed_msg = CryptoJS.HmacSHA256(message, token).toString(CryptoJS.enc.Hex);
	return hashed_msg;
};

/* login window*/

loginfunc = function(usrname, inputpw){
	document.getElementById("login_error").innerHTML ="";
	if (usrname == undefined && inputpw == undefined) {
        usrname = document.getElementById("username").value;
        inputpw = document.getElementById("password").value;
    }

	var req = new XMLHttpRequest();
	req.open('POST', '/sign_in', true);
	req.setRequestHeader("Content-type", "application/json");
	req.onreadystatechange = function () {
		if (req.readyState == 4 && req.status == 200) {
            var msg = JSON.parse(req.responseText);
			if(msg.success){

				//new view
				localStorage.setItem("myToken", msg.data);
				my_email = usrname;
				displayView();
				SocketConn(usrname, msg.data);

			} else{
				document.getElementById("login_error").innerHTML = msg.message;
			}
        } else {
			document.getElementById("login_error").innerHTML = "problem connecting to server."
		}
    };

	var data = JSON.stringify({"login_email": usrname, "login_password": inputpw});
	req.send(data);
	return false;

};

pwcheck = function(){

	document.getElementById("signup_error").innerHTML = "";
	var pw1 = document.getElementById("Password1").value;
	var pw2 = document.getElementById("Password2").value;

	if(pw1!=pw2){

		document.getElementById("signup_error").innerHTML = "missmatching passwords!";
		return false;
	}
	else{


		var email = document.getElementById("email").value;
		var password = document.getElementById("Password1").value;
		var firstname = document.getElementById("firstname").value;
		var familyname =  document.getElementById("familyname").value;
		var gender = document.getElementById("gender").value;
		var city = document.getElementById("city").value;
		var country = document.getElementById("country").value;

		var output = {
			email: email, 
			password:password, 
			firstname:firstname, 
			familyname:familyname, 
			gender:gender, 
			city:city, 
			country:country};

		var req = new XMLHttpRequest();
		req.open('POST', '/sign_up', true);
		req.setRequestHeader("Content-type", "application/json");
		req.onreadystatechange = function () {
			if (req.readyState == 4 && req.status == 200) {
				var msg = JSON.parse(req.responseText);
				if (msg.success){
					loginfunc(email, password);
					displayView();
				}
				else{
					document.getElementById("signup_error").innerHTML = msg.message;
				}
			}
		};
		req.send(JSON.stringify(output));

	}
	return false;

};

/*     Socket    */

SocketConn = function (email, token) {

	var socket = new WebSocket("ws://127.0.0.1:5000/init_socket");


	socket.onopen = function (ev) {
		console.log("open!");
		socket.send(JSON.stringify({"email": email, "token": token}));
    };

    socket.onclose = function () {
		//socket.close();
		console.log("onclose");
		//logout();
		
    };

    socket.onmessage = function (event) {
		if(event.data == "[sign_in] log_out"){
			console.log("logout: " + event.data);
			localStorage.removeItem("myToken");
			displayView();

		} else if (event.data == "[log_out] close") {
			console.log("closing socket");
			socket.close()
		}
 		else{
			console.log("on message: " + event.data);
		}
    }

};

/* Profile-view functions */

showpanel = function(element, TabId){

	var tabviews = document.getElementsByClassName("content");

	for(var j = 0; j < tabviews.length; j++){

		tabviews[j].style.display = "none";

	}

	
	var tablinks = document.getElementsByClassName("TabEl");

	for(var i = 0; i<tablinks.length; i++){

		tablinks[i].className = tablinks[i].className.replace(" active", ""	);
	}


	document.getElementById(TabId).style.display = "block";
	element.className += " active";

};

addinfo = function(usr){

	error = false;
	document.getElementById("browsedContent").style.display = "none";
	document.getElementById("B_usrContentDiv").style.display = "none";
	document.getElementById("browse_error").innerHTML = "";

	var req = new XMLHttpRequest();
	var msgreq = new XMLHttpRequest();

	if(usr === "me"){
	//user info

		var hashed_message = hash_message(my_email);
		req.open("GET", '/get_user_data_by_email/' + hashed_message + '/' + my_email + '/' + my_email, true);
		req.setRequestHeader("Content-type", "application/json");
		req.onreadystatechange = function () {
			if(req.readyState == 4 && req.status == 200){

				var rec_info = JSON.parse(req.responseText);
				if (rec_info.success) {
                    var infoArr = rec_info.data;
                    document.getElementById("usercontent").innerHTML = infoArr.email + "<br>" + infoArr.firstname + "<br>" + infoArr.familyname + "<br>" + infoArr.gender + "<br>" + infoArr.city + "<br>" + infoArr.country;
                    my_email = infoArr.email;
                }
                else
                	error = true;
			}
        };
		req.send(null);

	//set wall messages

		msgreq.open("GET", '/get_user_messages_by_email/' + hashed_message + '/' + my_email + '/' + my_email ,true);
		msgreq.setRequestHeader("Content-type", "application/json");
		msgreq.onreadystatechange = function () {
			if(msgreq.readyState == 4 && msgreq.status == 200){

				var wallPosts = JSON.parse(msgreq.responseText);
				if(wallPosts.success) {
                    var myPosts = wallPosts.data;
                    if (myPosts != null) {
                        for (var i = 0; i < myPosts.length; i++) {
                            post(myPosts[i].content, myPosts[i].writer, "postsDiv")
                        }
                    }

                }
                else {
                    error = true;
                }
			}
        };
		msgreq.send(null);
	 }
	else {

        user = usr;
        var hashed_message = hash_message(usr);
        //var req = new XMLHttpRequest();
        req.open("GET", '/get_user_data_by_email/' + hashed_message + '/' + my_email + '/' + usr, true);
        req.setRequestHeader("Content-type", "application/json");
        req.onreadystatechange = function () {
            if (req.readyState == 4 && req.status == 200) {

                var rec_info = JSON.parse(req.responseText);
                if (rec_info.success) {
                    var infoArr = rec_info.data;
                    document.getElementById("Browsedusercontent").innerHTML = infoArr.email + "<br>" + infoArr.firstname + "<br>" + infoArr.familyname + "<br>" + infoArr.gender + "<br>" + infoArr.city + "<br>" + infoArr.country;
                } else {
                    document.getElementById("browse_error").innerHTML = rec_info.message;
                    error = true;
                }
            }
        };
        req.send(null);

        //set wall messages
        //var msgreq = new XMLHttpRequest();
        if (!error) {
            msgreq.open("GET", '/get_user_messages_by_email/' + hashed_message + '/' + my_email + '/' + usr, true);
            msgreq.setRequestHeader("Content-type", "application/json");
            msgreq.onreadystatechange = function () {
                if (msgreq.readyState == 4 && msgreq.status == 200) {

                    var wallPosts = JSON.parse(msgreq.responseText);
                    if (wallPosts.success) {
                        var myPosts = wallPosts.data;
                        for (var i = 0; i < myPosts.length; i++) {
                            post(myPosts[i].content, myPosts[i].writer, "B_postsDiv");
                        }
                    }
                    else {
                        document.getElementById("browse_error").innerHTML = wallPosts.message;
                        error = true;
                    }
                }
            };
            msgreq.send(null);
        }
    }


};

/*   Account  */

showform = function(){

	var el = document.getElementById("pwform").style.display;

	if(el === "none"){
		document.getElementById("pwform").style.display = "block";
		document.getElementById("logout-button").style.display = "none";
		document.getElementById("changePW").innerHTML = "close";
		}
	else{
		document.getElementById("pwform").style.display = "none";
		document.getElementById("logout-button").style.display = "initial";
		document.getElementById("changePW").innerHTML = "Change password";
	}
};

newPassword = function(){

		var oldPW = document.getElementById("old");
		var newpw1 = document.getElementById("newpw1");
		var newpw2 = document.getElementById("newpw2");

		if (newpw1.value != newpw2.value) {

			document.getElementById("pw_error").innerHTML= "missmatching passwords!";
		}
		else{

			//var temptoken = localStorage.getItem("myToken");

			var req = new XMLHttpRequest();

			req.open('POST', '/change_password', true);
			req.setRequestHeader("Content-type", "application/json");
			req.onreadystatechange = function () {
				if (req.readyState == 4 && req.status == 200) {
					var msg = JSON.parse(req.responseText);
					if (msg.success){
						document.getElementById("pw_error").innerHTML= msg.message;
                    }
					else{
						document.getElementById("pw_error").innerHTML = msg.message;
					}
				}
			};

			var authentication = hash_message(oldPW.value + newpw1.value);
			var data = {
				"authentication": authentication,
				"email": my_email,
				"old_password": oldPW.value,
				"new_password": newpw1.value
			};

			req.send(JSON.stringify(data));
		}
return false;
};

logout = function(){

	var req = new XMLHttpRequest();
	req.open('POST', '/sign_out', true);
	req.setRequestHeader("Content-type", "application/json");
	req.onreadystatechange = function () {
		if (req.readyState == 4 && req.status == 200) {
			var msg = JSON.parse(req.responseText);
			console.log("success: " + msg.success + "msg: " + msg.message);
			if (msg.success){
				localStorage.removeItem("myToken");
				displayView();
			}
		}
	};

	var token = localStorage.getItem("myToken");
	var data = {
        'token': token
    	};
	req.send(JSON.stringify(data));

};

/*    Browse     */

/* function ondrop(event)
 * this function takes the event and checks if the droptarget is a textarea
 * if so then the daggable text is added tp the textbox.
 */
ondrop = function (event) {
	event.preventDefault();
	if(event.target.className == 'postSettings') {
        var data = event.dataTransfer.getData("Text");
        var postText = document.getElementById(data).lastChild.innerHTML;
        event.target.value = postText;

    }
};

// this function prevents the default event to make sure that the wanted function can be executed without
// interference.
allowDrop = function (event) {
	event.preventDefault()
};

postOnWall = function(textArea, toWall, to_usr) {

    var text = document.getElementById(textArea).value;
    var token = localStorage.getItem("myToken");

    if (to_usr == 'me') {
        var to_email = my_email;
    } else {
        var to_email = user;
    }
    if (text != "") {

        var req = new XMLHttpRequest();

        req.open('POST', '/post_message', true);
        req.setRequestHeader("Content-type", "application/json");
        req.onreadystatechange = function () {
            if (req.readyState == 4 && req.status == 200) {
                var check = JSON.parse(req.responseText);
                if (check.success) {
                    post(text, my_email, toWall)
                }
                else {
                    document.getElementById("post_error").innerHTML = check.message;
                }
            }
        };
        var auth = hash_message(to_email + text);
        var postContent = {
            'email': my_email,
            'authentication': auth,
			'message': text,
            'to_email': to_email};
    	req.send(JSON.stringify(postContent))
	}
};



post = function(text, author, wall){

	var postPlace = document.getElementById(wall);
	var NewPost = document.createElement('div');
	var Header = document.createElement('header');
	var MyText = document.createElement('p');

	Header.innerHTML = author + ":";
	Header.style.textAlign = "left";
	NewPost.className = "post";
	//adds an id to each post in order to be able to extract the correct text being dragged.
	NewPost.id = "postNr" + numOfPosts;
	numOfPosts = numOfPosts + 1;
	MyText.innerHTML = text;
	MyText.style.textAlign = "left";

	/* The ondragstart function adds the id of the post to the dataTransfer variable
	 * making it possible for the droptarget to extract the text from this specific post
	 */
	NewPost.ondragstart = function(){
		event.dataTransfer.setData("Text", event.target.id)

	};

	NewPost.insertBefore(Header, NewPost.firstChild);
	NewPost.appendChild(MyText);
	if(postPlace != null) {
        postPlace.insertBefore(NewPost, postPlace.firstChild);
    } else{
		postPlace.appendChild(NewPost)
	}

	//making the post-text on the wall draggalbe!
	NewPost.draggable = true;

};

reloadWall = function(wall){

	var token = localStorage.getItem("myToken");
	var hashed_msg = hash_message(my_email);
	var req = new XMLHttpRequest();
	if (user == "me") {
		req.open("GET", 'get_user_messages_by_email/' + hashed_msg + + '/' + my_email + '/' + my_email);
		req.setRequestHeader("Content-type", "application/json");
		req.onreadystatechange = function () {
			if(req.readyState == 4 && req.status == 200) {
				var Txt = JSON.parse(req.responseText).data;
				var newTxt = Txt[Txt.length-1];
				var post_wall = document.getElementById(wall);
				if (document.getElementById(wall) != null) {
                    var oldTxt = document.getElementById(wall).firstChild.lastChild.innerHTML;
                } else {
					post(newTxt.content, newTxt.writer, post_wall.id);
				}
				if (oldTxt != newTxt.content){
					post(newTxt.content, newTxt.writer, post_wall.id);
				}
			}
        };
		req.send(null);
    } else{
		req.open("GET", 'get_user_messages_by_email/' + hashed_msg + '/' + my_email + '/' + user);
		req.setRequestHeader("Content-type", "application/json");
		req.onreadystatechange = function () {
			if(req.readyState == 4 && req.status == 200) {
				var Txt = JSON.parse(req.responseText).data;
				var newTxt = Txt[Txt.length-1];
				var post_wall = document.getElementById(wall);
				if (document.getElementById(wall).firstChild.lastChild != null) {
                    var oldTxt = document.getElementById(wall).firstChild.lastChild.innerHTML;
                }
				if (oldTxt != newTxt.content){
					post(newTxt.content, newTxt.writer, post_wall.id);
				}
			}
        };
		req.send(null);

	}

};

loadUser = function(){
	var usr = document.getElementById("serachText").value;
	currUserPage = usr;
	document.getElementById("browsedContent").style.display = "none";
	document.getElementById("B_usrContentDiv").style.display = "none";
	addinfo(usr);
	if(!error) {
		document.getElementById("browsedContent").style.display = "block";
        document.getElementById("B_usrContentDiv").style.display = "block";
        user = usr;
        reloadWall('B_postsDiv');
    }
};
