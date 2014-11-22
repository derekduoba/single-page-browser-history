$(document).ready(function() {

    //console.log("DOCUMENT IS READY!");

    var viewsWrapper = $(".views-wrapper");
    var loginButton = "#login-button";
    var logoutButton = "#logout-button";

    /**
     * View Navigation Functions
     **/
    $("ul li.a").click(function() {
        console.log("MENU LINK A CLICK!");
        $.get('/a', { internal: true }, function(data) {
            viewsWrapper.html(data);
            history.pushState({ id: 2, name: 'a' }, '', '/a');
            console.log("APPENDED a.jade!");
        });
    });

    $("ul li.b").click(function() {
        console.log("MENU LINK B CLICK!");
        $.get('/b', { internal: true }, function(data) {
            viewsWrapper.html(data);
            history.pushState({ id: 3, name: 'b' }, '', '/b');
            console.log("APPENDED b.jade!");
        });
    });

    $("ul li.login").click(function() {
        console.log("LOGIN LINK CLICK!");
        $.get('/login', { internal: true }, function(data) {
            viewsWrapper.html(data);
            history.pushState({ id: 4, name: 'login' }, '', '/login');
            console.log("APPENDED login.jade!");
        });
    });

    /**
     * Helper Function
     **/
    viewsWrapper.on("click", loginButton, function(e) {
        console.log("LOGIN BUTTON CLICK!");
        var loginData = { username: $("#username").val(), password: $("#password").val() };
        $.post('/login', loginData, function(data) {
            viewsWrapper.html(data);
            history.pushState({ id: 0, name: 'index' }, '', '/');
        });
        return false;
    });

    viewsWrapper.on("click", logoutButton, function(e) {
        console.log("LOGOUT BUTTON CLICK!");
        $.post('/logout', function(data) {
            console.log(data);
            viewsWrapper.html(data);
            history.pushState({ id: 0, name: 'index' }, '', '/');
        });
        return false;
    });


    window.onpopstate = function(event) {  
        var content = "";
        if(event.state) {
            content = event.state.name;
        }
        //console.log(content);
        if (content != "") {
            $.get('/' + content, { internal: true }, function(data) {
                viewsWrapper.html(data);
            });
        }
       
    }
});
