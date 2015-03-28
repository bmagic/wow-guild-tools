var http = require('http');
var https = require('https');
var async = require('async');
var fs = require('fs');

module.exports = function(config,io,connection){
    io.on('connection', function(socket){

        // Main event about character add
        socket.on('add:character',function(obj){
            connection.query("SELECT * FROM gt_character where name = ? and realm = ?",[obj.name,obj.realm], function(err, rows, fields) {
                // Errors
                if (err) return console.log(err);
                if (rows.length > 0 ){
                    socket.emit('add:character', {"status": "ko", "message": "Personage déjà présent en base"});
                    return;
                }
                // Get profile
                getBattlenetCharacter(obj.name,obj.realm,function(json) {
                    if (json.realm == undefined) {
                        socket.emit('add:character', {"status": "ko", "message": "Personnage introuvable"});
                    }
                    else {
                        connection.query('SELECT * FROM gt_character where uid = ?',socket.request.user.uid, function(err, rows, fields) {
                            if (err) return console.log(err);
                            var main = 0;
                            if (rows.length == 0)
                                main=1;
                            // determine spec
                            if (json.talents.length == 1 || json.talents[0].selected == true){
                                var armory_role = json.talents[0].spec.role;
                                var spec = json.talents[0].spec.name;
                            }
                            else{
                                var armory_role = json.talents[1].spec.role;
                                var spec = json.talents[1].spec.name;
                            }

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
                                "spec = " + connection.escape(spec) + "," +
                                "ilvl = " + connection.escape(json.items.averageItemLevelEquipped);

                            connection.query(sql, function (err, result, fields) {
                                if (err) return console.log(err);
                                downloadImage(config.armory.baseurl+json.thumbnail, '../app/data/thumbnails/'+result.insertId+'.jpg', function(){
                                    console.log('Done downloading image for character '+json.name);
                                });

                                setGear(result.insertId,json,function(){
                                    socket.emit('add:character', {"status": "ok"})
                                });

                            });
                        });
                    }
                });

            });

        });

        function getGemName(gemid,values,callback){
            if (!gemid) {
                callback(values.concat([false]));
            } else {
                getBattlenet(config.battlenet.baseurl+"item/"+gemid+"?locale=fr_FR&apikey="+config.battlenet.apikey,function(json) {
                    var Gem = false
                    if (isset(json,'gemInfo.bonus.name')) Gem = json.gemInfo.bonus.name
                    callback(values.concat([Gem]));
                })
            }
        }

        function getEnchantName(enchantid,values,callback){
            if (!enchantid) {
                callback(values.concat([false]));
            } else {
                sql="SELECT name from gt_enchants where enchant_id = ?"
                connection.query(sql, enchantid, function (err, result, fields) {
                    if (err) return console.log(err);
                    Enchant = "Unknown enchant " + enchantid
                    if (result.length != 0 && isset(result[0],'name')) Enchant = result[0].name
                    callback(values.concat([Enchant]));
                });
            }
        }

        function setGear(id, json, callback){
            items=[]
            for (var item in json.items){
                items=items.concat([item])
            }
            async.each(items,function(item){
                var hasGemSlot = false
                if (json.items[item].constructor === Object){
                    json.items[item].bonusLists.forEach(function(bonus) {
                        if ([563,564,565].indexOf(bonus) != -1) hasGemSlot = true
                    })
                    var isEnchanteable = false
                    if (['neck','back','finger1','finger2','mainHand','offHand'].indexOf(item) != -1) isEnchanteable = true

                    var values = [id, item, json.items[item].id, json.items[item].itemLevel, hasGemSlot, isEnchanteable]
                    getGemName(!isset(json,'items.'+item+'.tooltipParams.gem0')?false:json.items[item].tooltipParams.gem0,values,function(values){
                        values=values.concat([json.items[item].tooltipParams.enchant])
                        var sql = "INSERT INTO gt_character_gear(character_id, slot, item_id, item_lvl, has_gem_slot, is_enchanteable, gem, enchant) " +
                            "VALUES( ?, ?, ?, ?, ?, ?, ?, ? ) " +
                            "ON DUPLICATE KEY UPDATE item_id = ?, item_lvl = ?, has_gem_slot = ?, is_enchanteable = ?, gem = ?, enchant = ?"
                        values = [].concat(values,values.slice(2))
                        connection.query(sql, values, function (err, result, fields) {
                            if (err) return console.log(err);
                        });
                    });
                }
            });

            callback();
        }

        function downloadImage(url, filename, callback){
            try {
                var file = fs.createWriteStream(filename);
                http.get(url, function(res) {
                    res.pipe(file);
                    file.on('finish', function() {
                        file.close(callback);
                    });
                });
            } catch(error) {
                socket.emit('add:character', {"status": "ko", "message": "Impossible de récupérer l'image de profil"});
                console.log('Problem getting profile image : ' + err)
            }
        };

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

        function updateCharacter(id, json, callback){
            console.log('update : '+id);

            downloadImage(config.armory.baseurl+json.thumbnail, '../app/data/thumbnails/'+id+'.jpg', function(){
                console.log('Done downloading image for character '+json.name);
            });

            if (json.talents.length == 1 || json.talents[0].selected == true){
                var armory_role = json.talents[0].spec.role;
                var spec = json.talents[0].spec.name;
            }
            else{
                var armory_role = json.talents[1].spec.role;
                var spec = json.talents[1].spec.name;
            }

            var sql = "UPDATE `gt_character` SET level = " + connection.escape(json.level) + "," +
                "thumbnail = " + connection.escape(json.thumbnail) + "," +
                "ilvl = " + connection.escape(json.items.averageItemLevelEquipped) + "," +
                "armory_role = " + connection.escape(armory_role) + "," +
                "spec = " + connection.escape(spec) + "," +
                "last_update = NOW()" +
                " WHERE id=" + connection.escape(id);

            connection.query(sql, function (err, rows, fields) {
                if (err) return console.log(err);
                setGear(id,json,function(){
                    callback();
                });
            });
        }

        function getBattlenetCharacter(name,realm,callback) {
            qs=require('querystring')
            name=qs.escape(name)
            realm=qs.escape(realm)
            url=config.battlenet.baseurl+"character/"+realm+"/"+name+"?fields=items,talents&locale=fr_FR&apikey="+config.battlenet.apikey
            getBattlenet(url,callback)
        }

        function getBattlenet(url,callback){
            try {
                https.get(url, function(res) {
                    var body = '';
                    res.on('data', function(chunk) {
                        body += chunk;
                    });
                    res.on('end', function() {
                        try {
                            var json = JSON.parse(body);
                            callback(json);
                        } catch(error) {
                            socket.emit('add:character', {"status": "ko", "message": "Impossible de récupérer le profil armory"});
                            console.log('Problem getting profile : ' + error)
                        }
                    });
                });
            } catch(error) {
                socket.emit('add:character', {"status": "ko", "message": "Impossible de récupérer le profil armory"});
                console.log('Problem getting profile : ' + error)
            }
        }


        // EVENTS HANDLE
        socket.on('delete:character', function(character){
            connection.query('DELETE from `gt_character` WHERE name='+connection.escape(character.name) + ' AND uid='+connection.escape(socket.request.user.uid), function(err, rows, fields) {
                if (err) return console.log(err);
                fs.unlinkSync('../app/data/thumbnails/'+character.id+'.jpg');
                socket.emit('delete:character');
            });
        });

        socket.on('update:character', function(character) {
            getBattlenet(config.battlenet.baseurl+"character/"+character.realm+"/"+character.name+"?fields=items,talents&locale=fr_FR&apikey="+config.battlenet.apikey,function(json) {
                if (json.realm == undefined) {
                    socket.emit('add:character', {"status": "ko", "message": "Impossible de contacter l'armory"});
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
                        if (json.realm != undefined){
                            updateCharacter(character.id,json,function(){
                                callback();
                            });
                        }
                        else
                            callback();

                    });
                },function(err){
                    if (err) { console.log(err); }
                    socket.emit('update:all-characters', {"status": "ok"})
                });
            });
        });


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
            connection.query('SELECT * FROM gt_character c INNER JOIN gt_character_gear g ON c.id = g.character_id INNER JOIN gt_user u ON c.uid = u.uid ORDER BY c.name', function(err, rows, fields) {
                if (err) return console.log(err);

                chars={}
                rows.forEach(function(row){


                    if (!isset(chars,row.name)){ row.id = row.character_id;chars[row.name] = row; }
                    if (row.has_gem_slot == 1){
                        if (row.gem == 0 || row.gem.substring(0,3) != '+50' ) chars[row.name].missing_gem = 1
                    }
                    if (row.is_enchanteable == 1 ) {
                        if (row.enchant == 0) { chars[row.name][row.slot] = 0 }
                        else { chars[row.name][row.slot] = row.enchant }
                    }
                })
                list=[]
                for (var car in chars){
                    list=list.concat(chars[car]);
                }
                socket.emit('get:all-characters', list);
            });
        });

        socket.on('set:character-role',function(obj){
            var sql = "UPDATE `gt_character` SET role = "+ connection.escape(obj.role)+" WHERE id=" + connection.escape(obj.character.id) + " AND uid=" + connection.escape(obj.character.uid);
            connection.query(sql, function (err, rows, fields) {
                if (err) return console.log(err);
                socket.emit('set:character-role', rows);
            });
        });

    });
}
