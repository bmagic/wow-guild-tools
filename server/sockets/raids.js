module.exports = function(config,io,connection) {

    io.on('connection', function(socket) {

        socket.on('get:next-raids', function () {
            getNextRaids(function(nextRaids){
                socket.emit('get:next-raids', nextRaids);
            })
        });

        socket.on('get:prev-raids', function () {
            getPrevRaids(function(prevRaids){
                socket.emit('get:prev-raids', prevRaids);
            })
        });

        socket.on('add:raid', function(obj){
            addRaid(obj,function(result){
                io.sockets.emit('add:raid',{'id':result.insertId,'type':obj.type});
            });
        });
        socket.on('update:raid', function(obj){
            getRaid(obj.id, function(raid){
                if (!(socket.request.user.uid == raid.uid || socket.request.user.role == 'officier')){
                    return;
                }
                updateRaid(obj,function(raid){
                    socket.emit('update:raid',obj);
                });
            });

        });
        socket.on('delete:raid', function(raidId){
            deleteRaid(raidId,function(){
                io.sockets.emit('delete:raid');
            });
        });

        socket.on('get:raid', function(id){
            getRaid(id,function(raids){
                socket.emit('get:raid',raids);
            });
        });
        socket.on('get:raid-inscriptions', function(raidId){
            getInscriptions(raidId,function(inscriptions){
                socket.emit('get:raid-inscriptions',inscriptions);
            });
        });
        socket.on('add:raid-inscription', function(obj){
            addUpdateInscription(obj,function(){
                socket.emit('add:raid-inscription',obj.raid_id);
            });
        });
        socket.on('get:raid-logs', function(raidId){
            getRaidLogs(raidId,function(raidLogs){
                socket.emit('get:raid-logs',raidLogs);
            });
        });
        socket.on('add:raid-tab', function(raidId){

            getRaid(raidId, function(raid){
                if ( !(socket.request.user.uid == raid.uid || socket.request.user.role == 'officier')){
                    return;
                }
                addRaidTab(raidId,function(raidTab){
                    io.sockets.emit('add:raid-tab',raidTab);
                });
            });
        });
        socket.on('get:raid-tabs', function(raidId){
            getRaidTabs(raidId,function(raidTabs){
                socket.emit('get:raid-tabs',raidTabs);
            });
        });
        socket.on('update:raid-tab', function(obj){
            getTab(obj.id,function (raidTab){
                getRaid(raidTab.raid_id, function(raid){
                    if (!(socket.request.user.uid == raid.uid || socket.request.user.role == 'officier')){
                        return;
                    }
                    updateRaidTab(obj,function(){
                        socket.broadcast.emit('update:raid-tab',obj);
                    });
                });
            });

        });
        socket.on('delete:raid-tab', function(raidTabId){
            deleteRaidTab(raidTabId,function(){
                io.sockets.emit('delete:raid-tab');
            });
        });




        function getNextRaids(callback){
            var sql = "SELECT * FROM gt_raid WHERE date > NOW() ORDER BY date";
            connection.query(sql, function (err, raids, fields) {
                if (err) return console.log(err);
                callback(raids);
            });
        }

        function getPrevRaids(callback){
            var sql = "SELECT * FROM gt_raid WHERE date < NOW() ORDER BY date LIMIT 5";
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
            var sql = "SELECT * FROM gt_raid_inscription WHERE raid_id=?";
            connection.query(sql,[raidId], function (err, inscriptions, fields) {
                if (err) return console.log(err);
                callback(inscriptions);
            });
        }

        function addUpdateInscription(obj,callback){
            var sql = "SELECT * FROM gt_raid_inscription WHERE raid_id=? AND uid=?";
            connection.query(sql,[obj.raid_id,socket.request.user.uid], function (err, inscription, fields) {
                if (err) return console.log(err);

                if (inscription.length == 0 )
                {

                    connection.query('SELECT * from `gt_character` WHERE `uid`='+socket.request.user.uid+' AND id='+connection.escape(obj.character_id), function(err, characters, fields) {
                        if (err) return console.log(err);

                        if(characters.length == 0)
                            return;
                        //Add new inscription & set logs.
                        var sql = "INSERT INTO gt_raid_inscription(uid, character_id, raid_id, state) " +
                            "VALUES(" + connection.escape(socket.request.user.uid) + ", " +
                            connection.escape(obj.character_id) + ", " +
                            connection.escape(obj.raid_id) + ", " +
                            connection.escape(obj.state) + ")";
                    });
                }
                else
                {
                    if (inscription[0].state == obj.state && inscription[0].character_id == obj.character_id ){
                        return;
                    }


                    var sql = "UPDATE gt_raid_inscription SET character_id = " + connection.escape(obj.character_id) + ", " +
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

        function addRaidTab(raidId,callback){
            var sql = "INSERT INTO gt_raid_tab(raid_id,title) "+
                "VALUES("+connection.escape(raidId)+", " +
                connection.escape('compo')+")";
            connection.query(sql, function (err, result, fields) {
                if (err) return console.log(err);
                var sql = "SELECT * FROM gt_raid_tab WHERE id=?";
                connection.query(sql,[result.insertId], function (err,raidTabs , fields) {
                    if (err) return console.log(err);
                    callback(raidTabs[0]);
                });
            });
        }

        function getRaidTabs(raidId,callback){
            var sql = "SELECT * FROM gt_raid_tab WHERE raid_id=? ORDER BY id";
            connection.query(sql,[raidId], function (err, raidTabs, fields) {
                if (err) return console.log(err);
                callback(raidTabs);
            });
        }
        function getTab(tabId,callback){
            var sql = "SELECT * FROM gt_raid_tab WHERE id=? ORDER BY id";
            connection.query(sql,[tabId], function (err, raidTabs, fields) {
                if (err) return console.log(err);
                callback(raidTabs[0]);
            });
        }

        function updateRaidTab(obj,callback){
            var sql = "UPDATE gt_raid_tab SET title = " + connection.escape(obj.title) + ", " +
                "content = " + connection.escape(obj.content) + ", " +
                "compositor = " + connection.escape(obj.compositor) + " " +
                "WHERE id=" + connection.escape(obj.id);
            connection.query(sql, function (err, result, fields) {
                if (err) return console.log(err);
                callback();

            });

        }

        function deleteRaidTab(raidTabId,callback){

            if (socket.request.user.role == 'officier')
                var sql = "DELETE FROM gt_raid_tab WHERE id=" + connection.escape(raidTabId);
            else
                var sql = "DELETE FROM gt_raid_tab WHERE id=" + connection.escape(raidTabId) +" AND uid="+socket.request.user.uid;
            connection.query(sql, function (err, row, fields) {
                if (err) return console.log(err);
                callback();
            });

        }


    });


};