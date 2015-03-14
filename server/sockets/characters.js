var https = require('https');
var async = require('async');

module.exports = function(config,io,connection){
    io.on('connection', function(socket){

        socket.on('add:character',function(obj){

            var sql = "SELECT * FROM gt_character where `name`="+connection.escape(obj.name)+" AND `realm`="+connection.escape(obj.realm);
            connection.query(sql, function(err, rows, fields) {
                if (err) return console.log(err);

                if (rows.length > 0 ){
                    socket.emit('add:character', {"status": "ko", "message": "Personage déjà présent en base"});
                    return;
                }


                getBattlenet(config.battlenet.baseurl+"character/"+obj.realm+"/"+obj.name+"?fields=items,talents&locale=fr_FR&apikey="+config.battlenet.apikey,function(json) {
                    if (json.realm == undefined) {
                        socket.emit('add:character', {"status": "ko", "message": "Personnage introuvable"});
                    }
                    else {
                        var sql = "SELECT * FROM gt_character where `uid`="+connection.escape(socket.request.user.uid);
                        connection.query(sql, function(err, rows, fields) {
                            if (err) return console.log(err);
                            var main = 0;
                            if (rows.length == 0)
                                main=1;

                            if (json.talents.length == 1 || json.talents[0].selected == true)
                                var armory_role = json.talents[0].spec.role;
                            else
                                var armory_role = json.talents[1].spec.role;


                            var sql = "INSERT INTO gt_character SET uid = " + connection.escape(socket.request.user.uid) + ", " +
                                "name = " + connection.escape(json.name) + "," +
                                "realm = " + connection.escape(json.realm) + "," +
                                "main = " + connection.escape(main) + "," +
                                "class = " + connection.escape(json.class) + "," +
                                "race = " + connection.escape(json.race) + "," +
                                "gender = " + connection.escape(json.gender) + "," +
                                "level = " + connection.escape(json.level) + "," +
                                "thumbnail = " + connection.escape(json.thumbnail) + "," +
                                "role = " + connection.escape("DPS") + "," +
                                "armory_role = " + connection.escape(armory_role) + "," +

                                "ilvl = " + connection.escape(json.items.averageItemLevelEquipped);
                            connection.query(sql, function (err, result, fields) {
                                if (err) return console.log(err);

                                setEnchant(result.insertId,json,function(){
                                    socket.emit('add:character', {"status": "ok"})
                                });

                            });
                        });
                    }
                });

            });

        });


        function setEnchant(id, json,callback){
            var sql = "INSERT INTO gt_character_enchant(id, neck, back, finger1, finger2, mainHand) "+
                "VALUES("+connection.escape(id)+", " +
                connection.escape(!isset(json,'items.neck.tooltipParams.enchant')?0:json.items.neck.tooltipParams.enchant)+", " +
                connection.escape(!isset(json,'items.back.tooltipParams.enchant')?0:json.items.back.tooltipParams.enchant)+", " +
                connection.escape(!isset(json,'items.finger1.tooltipParams.enchant')?0:json.items.finger1.tooltipParams.enchant)+", " +
                connection.escape(!isset(json,'items.finger2.tooltipParams.enchant')?0:json.items.finger2.tooltipParams.enchant)+", " +
                connection.escape(!isset(json,'items.mainHand.tooltipParams.enchant')?0:json.items.mainHand.tooltipParams.enchant)+") " +
                "ON DUPLICATE KEY UPDATE id="+connection.escape(id)+", "+
                "neck="+connection.escape(!isset(json,'items.neck.tooltipParams.enchant')?0:json.items.neck.tooltipParams.enchant)+", "+
                "back="+connection.escape(!isset(json,'items.back.tooltipParams.enchant')?0:json.items.back.tooltipParams.enchant)+", "+
                "finger1="+connection.escape(!isset(json,'items.finger1.tooltipParams.enchant')?0:json.items.finger1.tooltipParams.enchant)+", "+
                "finger2="+connection.escape(!isset(json,'items.finger2.tooltipParams.enchant')?0:json.items.finger2.tooltipParams.enchant)+", "+
                "mainHand="+connection.escape(!isset(json,'items.mainHand.tooltipParams.enchant')?0:json.items.mainHand.tooltipParams.enchant);

            connection.query(sql, function (err, result, fields) {
                if (err) return console.log(err);
                callback();
            });

        }


        function isset(obj, path) {
            var stone;

            path = path || '';

            if (path.indexOf('[') !== -1) {
                throw new Error('Unsupported object path notation.');
            }


            path = path.split('.');

            do {
                if (obj === undefined) {
                    return false;
                }

                stone = path.shift();

                if (!obj.hasOwnProperty(stone)) {
                    return false;
                }

                obj = obj[stone];

            } while (path.length);

            return true;
        }
        socket.on('delete:character', function(character){

            connection.query('DELETE from `gt_character` WHERE name='+connection.escape(character.name) + ' AND uid='+connection.escape(socket.request.user.uid), function(err, rows, fields) {
                if (err) return console.log(err);
                socket.emit('delete:character');

            });
        });

        socket.on('update:character', function(character) {
            getBattlenet(config.battlenet.baseurl+"character/"+character.realm+"/"+character.name+"?fields=items,talents&locale=fr_FR&apikey="+config.battlenet.apikey,function(json) {
                if (json.realm == undefined) {
                    socket.emit('add:character', {"status": "ko", "message": "Une erreur est survenue"});
                }
                else {
                    updateCharacter(character.id,json,function(){
                        socket.emit('update:character', {"status": "ok"})
                    });
                }
            });

        });

        socket.on('update:all-characters',function(){

            if (socket.request.user.role != 'officier') {
                socket.emit('update:all-characters', {"status": "ko"})
                return;
            }
            connection.query('SELECT * from `gt_character`', function(err, rows, fields) {
                if (err) return console.log(err);
                async.eachSeries(rows, function(character,callback){
                    getBattlenet(config.battlenet.baseurl+"character/"+character.realm+"/"+character.name+"?fields=items,talents&locale=fr_FR&apikey="+config.battlenet.apikey,function(json) {
                        updateCharacter(character.id,json,function(){
                            callback();
                        });
                    });
                },function(err){
                    if (err) { console.log(err); }
                    socket.emit('update:all-characters', {"status": "ok"})
                });

            });
        });

        function updateCharacter(id, json, callback){

            console.log('update : '+id);

            if (json.talents.length == 1 || json.talents[0].selected == true)
                var armory_role = json.talents[0].spec.role;
            else
                var armory_role = json.talents[1].spec.role;

            var sql = "UPDATE `gt_character` SET level = " + connection.escape(json.level) + "," +
                "thumbnail = " + connection.escape(json.thumbnail) + "," +
                "ilvl = " + connection.escape(json.items.averageItemLevelEquipped) + "," +
                "armory_role = " + connection.escape(armory_role) + "," +
                "last_update = NOW()" +
                " WHERE id=" + connection.escape(id);

            connection.query(sql, function (err, rows, fields) {
                if (err) return console.log(err);
                setEnchant(id,json,function(){
                    callback();
                });
            });

        }

        socket.on('set:main-character', function(character) {
            var sql = "UPDATE `gt_character` SET main = 0 WHERE uid=" + connection.escape(character.uid);
            connection.query(sql, function (err, rows, fields) {
                if (err) return console.log(err);
                var sql = "UPDATE `gt_character` SET main = 1 WHERE id=" + connection.escape(character.id) + " AND uid=" + connection.escape(socket.request.user.uid);
                connection.query(sql, function (err, rows, fields) {
                    if (err) return console.log(err);
                    socket.emit('set:main-character');
                });
            });
        });

        socket.on('get:characters', function(){

            connection.query('SELECT * from `gt_character` WHERE `uid`='+socket.request.user.uid+' ORDER BY main DESC', function(err, rows, fields) {
                if (err) return console.log(err);
                socket.emit('get:characters', rows);

            });
        });
        socket.on('get:all-characters', function(){

            connection.query('SELECT * FROM gt_character INNER JOIN gt_character_enchant ON gt_character.id = gt_character_enchant.id INNER JOIN gt_user ON gt_character.uid = gt_user.uid ORDER BY name', function(err, rows, fields) {
                if (err) return console.log(err);

                socket.emit('get:all-characters', rows);

            });
        });

        socket.on('set:character-role',function(obj){
            var sql = "UPDATE `gt_character` SET role = "+ connection.escape(obj.role)+" WHERE id=" + connection.escape(obj.character.id) + " AND uid=" + connection.escape(obj.character.uid);
            connection.query(sql, function (err, rows, fields) {
                if (err) return console.log(err);
                socket.emit('set:character-role', rows);
            });

        });

        function getBattlenet(url,callback){

            https.get(url, function(res) {
                var body = '';
                res.on('data', function(chunk) {
                    body += chunk;
                });
                res.on('end', function() {
                    var json = JSON.parse(body);
                    callback(json);
                });
            });
        }

    });

}