module.exports = function(config,io,connection){
    io.on('connection', function(socket){
        socket.on('get:messages', function() {
            connection.query('SELECT * from `gt_message` WHERE date > DATE_SUB(NOW(), INTERVAL 24 HOUR) ORDER BY `date` DESC', function (err, rows, fields) {
                if (err) return console.log(err);
                socket.emit('get:messages', rows.reverse());
            });
        });
        socket.on('set:message', function(message) {
            if (message.message == undefined|| message.message.length > 250)
                return;

            var sql = "INSERT INTO gt_message SET username = "+connection.escape(message.username)+", message = "+connection.escape(message.message)+", class = "+connection.escape(message.class);

            connection.query(sql, function (err, result, fields) {
                if (err) return console.log(err);
                connection.query('SELECT * from `gt_message` WHERE id='+result.insertId, function (err, row, fields) {
                    io.sockets.emit('set:message', row[0]);
                });
            });

        });

    });

}