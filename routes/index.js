var jade = require('jade');


/*
 * GET home page and various partials
 */

var last = "none";

/**
 * Full Pages
 */

exports.renderFullPages = function(req, res) {
    req.session.lastPage = last;
    if (req.session.lastPage) {
        last = req.session.lastPage;
    }
    var path = req.url.split('?')[0];    
    var partialHTML = jade.renderFile('views/partials' + path + '.jade');
    res.render('index', { title: 'Test Application',  partial: partialHTML });
    //res.render('partials/a', { layout: false, test: last });
}

/**
 * Partials
 */

// Index
exports.index = function(req, res){
    if (req.session.lastPage) {
        last = req.session.lastPage;
    }
    req.session.lastPage = "/index";
    var partialHTML = jade.renderFile('views/partials/login.jade');
    res.render('index', { title: 'Test Application', partial: partialHTML } ); 
    //res.render('index', { layout: false, test: last });

};


// View A
exports.a = function(req, res) {
    if (req.session.lastPage) {
        last = req.session.lastPage;
    }
    req.session.lastPage = "/a";
    res.render('partials/a', { layout: false, test: last });
};

// View B
exports.b = function(req, res) {
    if (req.session.lastPage) {
        last = req.session.lastPage;
    }
    req.session.lastPage = "/b";
    res.render('partials/b', { layout: false, test: last });
};

// Login View
exports.login = function(req, res) {
    if (req.session.lastPage) {
        last = req.session.lastPage;
    }
    req.session.lastPage = "/login";
    
    if (!req.session.username) {
        res.render('partials/login', { layout: false, test: last });
    } else {
        res.render('partials/home', { layout: false, test: last, user: req.session.username });
    }
};


/**
 * Helper Functions
 */

// Login Submission
exports.loginSubmit = function(req, res) {
    if (req.session.lastPage) {
        last = req.session.lastPage;
    }
    req.session.lastPage = "/login";
    
    //console.log("Session : ");
    //console.log(req.session);
    //console.log("req.body.username:" + req.body.username);

    //if (!req.session.username && req.body.username) {
    if (req.body.username) {
        req.session.username = req.body.username;
        res.render('partials/home', { layout: false, test: last, user: req.session.username });
    } else {
        res.render('partials/invalid', { layout: false, test: last });
    }
}

// Logout
exports.logout = function(req, res) {
    if (req.session.username) {
        req.session.destroy(function(err) {
            if (err) {
                console.log(err);
            } else {
                req.session = null;
                res.render('partials/login');
            }
        });
    }
}
