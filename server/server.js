var env = process.env.NODE_ENV || 'dev'
var config = require('./config/config.'+env+'.json');

var express = require('express');
var path = require('path');

var app = express();

var server = require('http').Server(app);
var io = require('socket.io')(server);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var PhpbbStrategy = require('./passport-phpbb/strategy');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var session = require('express-session');
var sessionStore = require('express-mysql-session')
var passportSocketIo = require("passport.socketio");
var mysql = require('mysql');
var bcrypt = require('bcrypt');



var options = {
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    createDatabaseTable: true
}
var connection = mysql.createConnection(options);
var sessionStore = new sessionStore(options, connection)

require('./sockets/global.js')(config,io, connection);
require('./sockets/chat.js')(config,io,connection);
require('./sockets/characters.js')(config,io,connection);
require('./sockets/raids.js')(config,io,connection);

var feeds = require('./sockets/feeds.js')(config,io,connection);
var cronJob = require('cron').CronJob;
new cronJob('0 0 * * * *',feeds.fetchFeeds,null, true);
feeds.fetchFeeds();

// Declarations
var optionsPhpbb3 = {
    host: config.mysql_phpbb3.host,
    port: config.mysql_phpbb3.port,
    user: config.mysql_phpbb3.user,
    password: config.mysql_phpbb3.password,
    database: config.mysql_phpbb3.database,
    createDatabaseTable: true
}
var connectionPhpbb3 = mysql.createConnection(optionsPhpbb3);

app.use(session({
    key: 'gt.sid',
    secret: config.session_cookie_secret,
    store: sessionStore,
    resave: true,
    saveUninitialized: true
}))

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());

server.listen(3000);

// App root
app.use(function(req, res, next) {
    if (req.isAuthenticated() ||
        req.path.indexOf('/login') != -1 ||
        req.path.indexOf('.css') != -1 ||
        req.path.indexOf('.js') != -1
    ) { return next(); }

    connectionPhpbb3.query('SELECT config_value from `phpbb_config` where config_name=?', ['cookie_name'], function(err, rows, fields) {
        if (!err && rows[0] && req.cookies[rows[0].config_value+"_sid"]) {
            console.log('auth by cookie')
            res.redirect('/login')
        } else {
            res.redirect('/login.html');
        }
    });
});

app.use(express.static(path.join(__dirname ,'../app')));

// Authentication
app.get('/login',
    passport.authenticate('phpbb_cookie', {
        successRedirect: '/',
        failureRedirect: '/login.html'
        //failureFlash: true
    })
);

app.post('/login',
    passport.authenticate('form_auth', {
        successRedirect: '/',
        failureRedirect: '/login.html'
        //failureFlash: true
    })
);

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/login.html');
});

function get_user_role(uid,username,done) {
    connectionPhpbb3.query('SELECT group_id from `phpbb_user_group` where `user_id`=?', [uid], function(err, rows, fields) {
        if (err) return done(err);
        var roles = []
        rows.forEach(function(item){
            config.roles.forEach(function(d,i){
                if (item.group_id == d.phpbb_id) roles.push(i)
            });
        });
        if (roles.length == 0) return done(null, false, { message: 'Permissions insuffisantes' });
        var role = config.roles[Math.min.apply(null,roles)].name
        return done(null, {"uid":uid,"username":username,"role":role});
    });
}

passport.use('phpbb_cookie', new PhpbbStrategy({},
    function(cookies, done) {
        connectionPhpbb3.query('SELECT config_value from `phpbb_config` where config_name=?', ['cookie_name'], function(err, rows, fields) {
            if (!err && rows[0] && cookies[rows[0].config_value+"_sid"]) {
                connectionPhpbb3.query('SELECT s.session_user_id, u.username from phpbb_sessions s LEFT JOIN phpbb_users u ON u.user_id = s.session_user_id ' +
                'where session_id=?',[cookies[rows[0].config_value+"_sid"]], function(err, rows, fields) {
                    if (err) return done(err);
                    if (!rows || rows.length == 0) return done(null, false, { message: 'Session invalide ou expirée' });

                    return get_user_role(rows[0].session_user_id,rows[0].username,done)
                });
            }
        });
    }
));

passport.use('form_auth', new LocalStrategy({},
    function(username, password, done) {
        var username_clean = username.toLowerCase();
        connectionPhpbb3.query('SELECT user_id, user_password, username from `phpbb_users` where username_clean=?',[username_clean], function(err, rows, fields) {
            if (err) return done(err);
            if (!rows || rows.length == 0) return done(null, false, { message: 'Mot de passe ou utilisateur incorrect' });

            var user_password = rows[0].user_password.replace('$2y$','$2a$');
            if (!bcrypt.compareSync(password, user_password))
                return done(null, false, { message: 'Mot de passe ou utilisateur incorrect' });

            return get_user_role(rows[0].user_id,rows[0].username,done)
        });
    }
));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

io.use(passportSocketIo.authorize({
    cookieParser: cookieParser,
    key:         'gt.sid',
    secret:      config.session_cookie_secret,
    store:       sessionStore
}));




