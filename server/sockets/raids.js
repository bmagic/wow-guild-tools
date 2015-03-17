module.exports = function(config,io,connection) {

    io.on('connection', function(socket) {

        socket.on('get:next-raids', function () {
            getNextRaids(function(nextRaids){
                socket.emit('get:next-raids', nextRaids);
            })
        });

        socket.on('add:raid', function(obj){
            addRaid(obj,function(result){
                socket.emit('add:raid',{'id':result.insertId,'type':obj.type});
            });
        });
        socket.on('update:raid', function(obj){
            getRaid(obj.id, function(raid){
                if (socket.request.user.uid != raid.uid && socket.request.user.role != 'officier'){
                    socket.emit('error','Vous n\'avez pas les permissions de modifier ce raid');
                    return;
                }
                updateRaid(obj,function(raid){
                    socket.emit('update:raid',obj);
                });
            });

        });
        socket.on('delete:raid', function(raidId){
            deleteRaid(raidId,function(){
                socket.emit('delete:raid');
            });
        });

        socket.on('get:raid', function(id){
            getRaid(id,function(raids){
                socket.emit('get:raid',raids);
            });
        });
        socket.on('get:inscriptions', function(raidId){
            getInscriptions(raidId,function(inscriptions){
                socket.emit('get:inscriptions',inscriptions);
            });
        });
        socket.on('add:inscription', function(obj){
            addUpdateInscription(obj,function(){
                socket.emit('add:inscription',obj.raid_id);
            });
        });
        socket.on('get:raid-logs', function(raidId){
            getRaidLogs(raidId,function(raidLogs){
                socket.emit('get:raid-logs',raidLogs);
            });
        });


        function getNextRaids(callback){
            var sql = "SELECT * FROM gt_raid WHERE date > NOW() ORDER BY date";
            connection.query(sql, function (err, raids, fields) {
                if (err) return console.log(err);
                callback(raids);
            });
        }

        function addRaid(obj,callback){
            var time = new Date(obj.date).getTime();


            var sql = "INSERT INTO gt_raid(uid, name, description, date, type) "+
                "VALUES("+connection.escape(socket.request.user.uid)+", " +
                connection.escape(obj.name)+", " +
                connection.escape(obj.description)+", " +
                "FROM_UNIXTIME("+connection.escape(time/1000) +"), " +
                connection.escape(obj.type)+")";
            connection.query(sql, function (err, rows, fields) {
                if (err) return console.log(err);
                callback(rows);
            });
        }
        function updateRaid(obj,callback){
            var time = new Date(obj.date).getTime();
            var sql = "UPDATE gt_raid SET name = " + connection.escape(obj.name) + ", " +
                "description = " + connection.escape(obj.description) + ", " +
                "date = FROM_UNIXTIME("+connection.escape(time/1000) +") " +
                "WHERE id=" + connection.escape(obj.id);

            connection.query(sql, function (err, raid, fields) {
                if (err) return console.log(err);
                callback(raid);
            });
        }

        function deleteRaid(raidId,callback){

            if (socket.request.user.role == 'officier')
                var sql = "DELETE FROM gt_raid WHERE id=" + connection.escape(raidId);
            else
                var sql = "DELETE FROM gt_raid WHERE id=" + connection.escape(raidId) +" AND uid="+socket.request.user.uid;
            connection.query(sql, function (err, row, fields) {
                if (err) return console.log(err);
                callback();
            });

        }

        function getRaid(id,callback){
            var sql = "SELECT * FROM gt_raid WHERE id=?";
            connection.query(sql,[id], function (err, raids, fields) {
                if (err) return console.log(err);
                callback(raids);
            });
        }

        function getInscriptions(raidId,callback){
            var sql = "SELECT * FROM gt_inscription WHERE raid_id=?";
            connection.query(sql,[raidId], function (err, inscriptions, fields) {
                if (err) return console.log(err);
                callback(inscriptions);
            });
        }

        function addUpdateInscription(obj,callback){
            var sql = "SELECT * FROM gt_inscription WHERE raid_id=? AND uid=?";
            connection.query(sql,[obj.raid_id,socket.request.user.uid], function (err, inscription, fields) {
                if (err) return console.log(err);

                if (inscription.length == 0 )
                {
                    //Add new inscription & set logs.
                    var sql = "INSERT INTO gt_inscription(uid, character_id, raid_id, state) "+
                        "VALUES("+connection.escape(socket.request.user.uid)+", " +
                        connection.escape(obj.character_id)+", " +
                        connection.escape(obj.raid_id)+", " +
                        connection.escape(obj.state)+")";
                }
                else
                {
                    if (inscription[0].state == obj.state){
                        return;
                    }


                    var sql = "UPDATE gt_inscription SET character_id = " + connection.escape(obj.character_id) + ", " +
                        "state = " + connection.escape(obj.state) + " " +
                        "WHERE uid=" + connection.escape(socket.request.user.uid) +" " +
                        "AND raid_id="+ connection.escape(obj.raid_id);
                }

                connection.query(sql, function (err, result, fields) {
                    if (err) return console.log(err);

                    var sql = "INSERT INTO gt_raid_log(character_id, raid_id, state, message) "+
                        "VALUES("+connection.escape(obj.character_id)+", " +
                        connection.escape(obj.raid_id)+", " +
                        connection.escape(obj.state)+", " +
                        connection.escape(obj.message)+")";
                    connection.query(sql, function (err, result, fields) {
                        if (err) return console.log(err);
                        callback();

                    });

                });
            });
        }
        function getRaidLogs(raidId,callback){
            var sql = "SELECT * FROM gt_raid_log WHERE raid_id=? ORDER BY date DESC";
            connection.query(sql,[raidId], function (err, raidLogs, fields) {
                if (err) return console.log(err);
                callback(raidLogs);
            });
        }

    });


};