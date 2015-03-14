var https = require('https');
require('datejs');

var users = [];
module.exports = function(config,io,connection){
    io.on('connection', function(socket){

        console.log('user '+ socket.request.user.username +' connected');


        var sql = "SELECT class FROM gt_character where `uid`="+connection.escape(socket.request.user.uid)+" AND `main`=1";
        connection.query(sql, function(err, rows, fields) {
            if (err) return console.log(err);

            if (rows.length > 0)
                socket.request.user.class=rows[0].class;
            else
                socket.request.user.class=0;

            var sql = "INSERT INTO gt_user(uid, role)"+
            "VALUES("+connection.escape(socket.request.user.uid)+", " +
            connection.escape(socket.request.user.role)+") " +
            "ON DUPLICATE KEY UPDATE uid="+connection.escape(socket.request.user.uid)+", "+
            "role="+connection.escape(socket.request.user.role);
            connection.query(sql, function(err, rows, fields) {
                if (err) return console.log(err);
                users.push(socket.request.user);
                io.sockets.emit('get:online-users',users);
            });


        });




        socket.on('disconnect', function(){
            console.log('user '+ socket.request.user.username +' disconnected');
            users.splice(users.indexOf(socket.request.user),1);
            io.sockets.emit('get:online-users',users);
        });

        socket.on('get:user', function(){
            socket.emit('get:user', socket.request.user);
        });

        socket.on('get:raids-logs', function(){

            var start = Date.today().add(-1).months().format("Y-m-d");
            var end = Date.today().format("Y-m-d");
            var url = "https://www.warcraftlogs.com/guilds/calendarfeed/"+config.warcraftlogs_id+"/0?start="+start+"&end="+end;
            https.get(url, function(res) {
                var body = '';
                res.on('data', function(chunk) {
                    body += chunk;
                });
                res.on('end', function() {
                    socket.emit('get:raids-logs', JSON.parse(body));
                });
            });
        });

    });
}