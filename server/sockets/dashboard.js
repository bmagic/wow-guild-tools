
module.exports = function(config,io,connection){

    io.on('connection', function(socket){
        socket.on('get:feeds', function(msg){

                connection.query('SELECT * from `gt_feed` ORDER BY time DESC LIMIT 30', function(err, rows, fields) {
                    if (err) return done(err);
                    socket.emit('get:feeds', rows);

                });

        });
    });

}