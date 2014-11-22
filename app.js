
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

//var memStore = express.session.MemoryStore;
var memStore = require('memstore').Store;
var store = new memStore();

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('1234567890QWERTY'));
app.use(express.session({ secret: "verysecret" }));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

/*
 * Views
 */
app.get('/', routes.index);

app.get('/a', function(req, res) {
    console.log(req.query);
    if (req.query.internal) {
        console.log("A INTERNAL!");
        routes.a(req, res);
    } else {
        console.log("A EXTERNAL!");
        routes.renderFullPages(req, res);
    }
});

app.get('/b', function(req, res) {
    console.log(req.query);
    if (req.query.internal) {
        console.log("B INTERNAL!");
        routes.b(req, res);
    } else {
        console.log("B EXTERNAL!");

        //TODO: Check for session + load the main page if user is already logged in
        routes.renderFullPages(req, res);
    }
});

app.get('/login', function(req, res) {
    if (req.query.internal) {
        console.log("LOGIN INTERNAL!");
        routes.login(req, res);
    } else {
        console.log("LOGIN EXTERNAL!");
        routes.renderFullPages(req, res);
    }
});

app.post('/login', routes.loginSubmit);
app.post('/logout', routes.logout);

/*
app.get('/', routes.index);
app.get('/users', user.list);
app.get('/a', routes.a);
app.get('/b', routes.b);
app.get('/login', routes.login);
app.post('/login', routes.loginSubmit);
app.post('/logout', routes.logout);
*/

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
