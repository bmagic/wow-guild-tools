# wow-guild-tools
WoW Guild Tools (raids preparations / enchant check / chat / news ) 

Install client lib 
bower install 

Install server lib (soon a npm config file)
server/npm install async body-parser cookie-session datejs express-mysql-session mysql passport-local path socket.io bcrypt cookie-parser cron express express-session passport passport.socketio sha1 xml2js

Delete passport in passport.socketio (it's too old ... )

Install Database with database.sql 

Rename & Edit config file (you need a functionnal PhpBB forum for authentication)
server/config/config.default.json -> server/config/config.dev.json

Launch with nodejs 
node server/server.js 

goto http://localhost:3000/ 




