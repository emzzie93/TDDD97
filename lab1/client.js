var currUserPage = "me";


/* View functions */

displayView = function(){


	if(!("myToken" in localStorage)) {

		var view = document.getElementById("loginView").innerHTML;
	}

	else{

		var view = document.getElementById("profileView").innerHTML;
	}

	
	var myview =  document.getElementById('currentView');

	myview.innerHTML = view;
	addinfo("me");
};

window.onload = function(){

	displayView();

};

/* login window*/

loginfunc = function(){

	
	var usrname = document.getElementById("username").value;
	var inputpw = document.getElementById("password").value;

	var loginObj = serverstub.signIn(usrname, inputpw);

	if(loginObj.success){

		//new view
		localStorage.setItem("myToken", loginObj.data);
		displayView();

	}
	else{

		alert(loginObj.message);
	}

	
};

pwcheck = function(){

	
	var pw1 = document.getElementById("Password1").value;
	var pw2 = document.getElementById("Password2").value;

	if(pw1!=pw2){

		alert("missmatching passwords! Please try again");
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

		var success = serverstub.signUp(output);
		var loginObj = serverstub.signIn(email, password);
		localStorage.setItem("myToken",loginObj.data);
		


		if(success.success){
			displayView();

			
		}
		else{
			alert(success.message)
		}
	}

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

/*   Account  */

var showform = function(){

	el = document.getElementById("pwform").style.display;

	if(el === "none"){
		document.getElementById("pwform").style.display = "block";
		document.getElementById("logout-button").style.display = "none"
		}
	else{
		document.getElementById("pwform").style.display = "none";
		document.getElementById("logout-button").style.display = "initial"
	}
};

var newPassword = function(){

		var oldPW = document.getElementById("old");
		var newpw1 = document.getElementById("newpw1");
		var newpw2 = document.getElementById("newpw2");

		if (newpw1.value != newpw2.value) {

			alert("missmatching passwords!");
				return false;
		}
		else{

			var temptoken = localStorage.getItem("myToken");
			temp = serverstub.changePassword(temptoken, oldPW.value, newpw1.value);
			alert(temp.message)
		}

};

var logout = function(){

	serverstub.signOut(localStorage.getItem("myToken"));
	localStorage.removeItem("myToken");
	displayView();

};

var addinfo = function(usr){

	var token = localStorage.getItem("myToken");

	if(usr === "me"){
	//user info
		var infoArr = serverstub.getUserDataByToken(localStorage.getItem("myToken")).data;
		document.getElementById("usercontent").innerHTML = infoArr.email + "<br>" + infoArr.firstname + "<br>" + infoArr.familyname + "<br>" + infoArr.gender + "<br>" + infoArr.city + "<br>" + infoArr.country;
	//set wall messages
		var wallPosts = serverstub.getUserMessagesByToken(token).data;

	
		for (var i = wallPosts.length - 1; i >= 0; i--) {
			post(wallPosts[i].content, wallPosts[i].writer, "postsDiv")
		}
	 }
	 else{

	 	var infoArr = serverstub.getUserDataByEmail(token,usr).data;
		document.getElementById("Browsedusercontent").innerHTML = infoArr.email + "<br>" + infoArr.firstname + "<br>" + infoArr.familyname + "<br>" + infoArr.gender + "<br>" + infoArr.city + "<br>" + infoArr.country;
	
		var wallPosts = serverstub.getUserMessagesByEmail(token,usr).data;

		for (var i = wallPosts.length - 1; i >= 0; i--) {
			post(wallPosts[i].content, wallPosts[i].writer, "B_postsDiv");

		}
	}
};

var postOnWall = function(textArea, toWall, usr){

	var text = document.getElementById(textArea).value;
	var token = localStorage.getItem("myToken");

	if (usr === "me") {
		var usrData = serverstub.getUserDataByToken(token).data;
		var email = usrData.email;
	}
	else{
		var email = currUserPage;
		var usrData = serverstub.getUserDataByEmail(token,email).data;
	}

	if(text != ""){
		var check = serverstub.postMessage(token, text, email);

		if(check.success){
			var author = serverstub.getUserDataByToken(token).data.email;
			post(text, author, toWall);
		}
		else{
			alert(check.message)
		}
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
	postPlace.insertBefore(NewPost, postPlace.firstChild);
};

var reloadWall = function(wall){
	var token = localStorage.getItem("myToken");
	var oldTxt = document.getElementById(wall).firstChild.lastChild.innerHTML;
	var newTxt = serverstub.getUserMessagesByToken(token).data[0];

	if(oldTxt != newTxt.content)
		post(newTxt.content, newTxt.writer, wall);
};


var loadUser = function(){

	var token = localStorage.getItem("myToken");

	var usr = document.getElementById("serachText").value;
	var usrData = serverstub.getUserDataByEmail(token,usr);
	currUserPage = usr;
	if(usrData.success){
		document.getElementById("browsedContent").style.display = "block";
		addinfo(usr);
		document.getElementById("B_usrContentDiv").style.display = "block";

	}
	else{

		alert(usrData.message);

	}

};