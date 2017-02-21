var currUserPage = "me";
var user = "me";
var addinfoview = false;
var view = "not set";
var my_email = "not set";
/* View functions */

displayView = function(){


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

/* login window*/

loginfunc = function(usrname, inputpw){
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
			} else{

				document.getElementById("login_error").innerHTML = msg.message;
			}
        } else {
			document.getElementById("login_error").innerHTML = "problem connecting to server... json?"
		}
    };

	var data = JSON.stringify({"login_email": usrname, "login_password": inputpw});
	req.send(data);
	return false;

};

pwcheck = function(){

	
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

/* Profile-view functions */

var showpanel = function(element, TabId){

	var tabviews = document.getElementsByClassName("content");

	for(var i = 0; i < tabviews.length; i++){

		tabviews[i].style.display = "none";

	}

	
	var tablinks = document.getElementsByClassName("TabEl");

	for(var i = 0; i<tablinks.length; i++){

		tablinks[i].className = tablinks[i].className.replace(" active", ""	);
	}


	document.getElementById(TabId).style.display = "block";
	element.className += " active";

};

var addinfo = function(usr){

	var myToken = localStorage.getItem("myToken");
	var req = new XMLHttpRequest();
	var msgreq = new XMLHttpRequest();

	if(usr === "me"){
	//user info


		req.open("GET", '/get_user_data_by_token/' + myToken, true);
		req.setRequestHeader("Content-type", "application/json");
		req.onreadystatechange = function () {
			if(req.readyState == 4 && req.status == 200){

				var rec_info = JSON.parse(req.responseText);
				if (rec_info.success) {
                    var infoArr = rec_info.data;
                    document.getElementById("usercontent").innerHTML = infoArr.email + "<br>" + infoArr.firstname + "<br>" + infoArr.familyname + "<br>" + infoArr.gender + "<br>" + infoArr.city + "<br>" + infoArr.country;
                    my_email = infoArr.email;
                }
			}
        };
		req.send(null);

	//set wall messages

		msgreq.open("GET", '/get_user_messages_by_token/' + myToken, true);
		msgreq.setRequestHeader("Content-type", "application/json");
		msgreq.onreadystatechange = function () {
			if(msgreq.readyState == 4 && msgreq.status == 200){

				var wallPosts = JSON.parse(msgreq.responseText);
				if(wallPosts.success)
					var myPosts = wallPosts.data;
					for (var i = 0; i < myPosts.length; i++) {
						post(myPosts[i].content, myPosts[i].writer, "postsDiv")
        		}
			}
        };
		msgreq.send(null);
	 }
	else{

		user = usr;

		//var req = new XMLHttpRequest();
		req.open("GET", '/get_user_data_by_email/' + myToken + '/' + usr, true);
		req.setRequestHeader("Content-type", "application/json");
		req.onreadystatechange = function () {
			if(req.readyState == 4 && req.status == 200){

				var rec_info = JSON.parse(req.responseText);
				if (rec_info.success) {
                    var infoArr = rec_info.data;
                    document.getElementById("Browsedusercontent").innerHTML = infoArr.email + "<br>" + infoArr.firstname + "<br>" + infoArr.familyname + "<br>" + infoArr.gender + "<br>" + infoArr.city + "<br>" + infoArr.country;
                }
                else{
					document.getElementById("browse_error").innerHTML = rec_info.message;
				}
			}
        };
		req.send(null);

	//set wall messages
		//var msgreq = new XMLHttpRequest();

		msgreq.open("GET", '/get_user_messages_by_email/' + myToken + '/' + usr, true);
		msgreq.setRequestHeader("Content-type", "application/json");
		msgreq.onreadystatechange = function () {
			if(msgreq.readyState == 4 && msgreq.status == 200){

				var wallPosts = JSON.parse(msgreq.responseText);
				if(wallPosts.success) {
                    var myPosts = wallPosts.data;
                    for (var i = 0; i < myPosts.length; i++) {
                        post(myPosts[i].content, myPosts[i].writer, "B_postsDiv")
                    }
                }
        		else{
					document.getElementById("browse_error").innerHTML = "get message by email" + wallPosts.message;
				}
			}
        };
		msgreq.send(null);
	 }

};

/*   Account  */

var showform = function(){

	el = document.getElementById("pwform").style.display;

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

var newPassword = function(){

		var oldPW = document.getElementById("old");
		var newpw1 = document.getElementById("newpw1");
		var newpw2 = document.getElementById("newpw2");

		if (newpw1.value != newpw2.value) {

			document.getElementById("pw_error").innerHTML= "missmatching passwords!";
		}
		else{

			var temptoken = localStorage.getItem("myToken");

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
			var data = {
				"token": temptoken,
				"old_password": oldPW.value,
				"new_password": newpw1.value
			};

			req.send(JSON.stringify(data));
		}
return false;
};

var logout = function(){

	var req = new XMLHttpRequest();
	req.open('POST', '/sign_out', true);
	req.setRequestHeader("Content-type", "application/json");
	req.onreadystatechange = function () {
		if (req.readyState == 4 && req.status == 200) {
			var msg = JSON.parse(req.responseText);
			if (msg.success){
				localStorage.removeItem("myToken");
				displayView();
			}
		}
	};

	var token = {"token": localStorage.getItem("myToken")};
	req.send(JSON.stringify(token));


};

/*    Browse     */

var postOnWall = function(textArea, toWall, to_usr) {

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
        var postContent = {
            'token': token,
            'message': text,
            'to_email': to_email};
    	req.send(JSON.stringify(postContent))
	}
};

var post = function(text, author, wall){

	var postPlace = document.getElementById(wall);
	var NewPost = document.createElement('div');
	var Header = document.createElement('header');
	var MyText = document.createElement('p');

	Header.innerHTML = author + ":";
	Header.style.textAlign = "left";
	NewPost.className = "post";
	MyText.innerHTML = text;
	MyText.style.textAlign = "left";


	NewPost.insertBefore(Header, NewPost.firstChild);
	NewPost.appendChild(MyText);
	if(postPlace != null) {
        postPlace.insertBefore(NewPost, postPlace.firstChild);
    } else{

		postPlace.appendChild(NewPost)
	}
};

var reloadWall = function(wall){
	var token = localStorage.getItem("myToken");
	var req = new XMLHttpRequest();
	if (user == "me") {
		req.open("GET", 'get_user_messages_by_token/' + token);
		req.setRequestHeader("Content-type", "application/json")
		req.onreadystatechange = function () {
			if(req.readyState == 4 && req.status == 200) {
				var newTxt = JSON.parse(req.responseText).data[0];
				var post_wall = document.getElementById(wall);
				var oldTxt = document.getElementById(wall).firstChild.lastChild.innerHTML;

				if (oldTxt != newTxt.content){
					post(newTxt.content, newTxt.writer, post_wall.id);
				}
			}
        };

    } else{
		req.open("GET", 'get_user_messages_by_email/' + token + '/' + user);
		req.setRequestHeader("Content-type", "application/json");
		req.onreadystatechange = function () {
			if(req.readyState == 4 && req.status == 200) {
				var newTxt = JSON.parse(req.responseText).data[0];
				var post_wall = document.getElementById(wall);
				var oldTxt = document.getElementById(wall).firstChild.lastChild.innerHTML;

				if (oldTxt != newTxt.content){
					post(newTxt.content, newTxt.writer, post_wall.id);
				}
			}
        };

	}

};

var loadUser = function(){

	var token = localStorage.getItem("myToken");
	var usr = document.getElementById("serachText").value;
	currUserPage = usr;
	document.getElementById("browsedContent").style.display = "block";
	addinfo(usr);
	document.getElementById("B_usrContentDiv").style.display = "block";
	user = usr;
	reloadWall('B_postsDiv');

};
