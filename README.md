# wow-guild-tools
WoW Guild Tools (raids preparations / enchant check / chat / news ).
Authentication is provided by phpBB3.1!!! So you need a proper 3.1 phpBB installation.

##Installation
###Requirements
You need : 

* bower 
* nodejs
* npm

###Install client lib 
`bower install`

###Install server lib
    `cd server`
    `npm install`
_Delete passport in passport.socketio (it's too old ... )_

###Install database structure
`mysql -u [user] -p [database]` < database.sql

##Configuration 
Rename & Edit config file (you need a functionnal PhpBB forum for authentication) from server/config/config.default.json to server/config/config.dev.json

##Launch
Simply launch it with nodejs 

`node server/server.js`

Then go to : `http://localhost:3000/`




