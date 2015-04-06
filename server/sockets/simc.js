fs=require('fs')
spawn=require('child_process').spawn
pr=require('path').resolve

module.exports = function(config,connection){

    // DO the maths
    return {
        compute: function(){
            rp=pr('..')
            sim="iterations=1000\nxml="+rp+"/app/data/mbwow.result.xml\n"
            console.log("computeDPS with simc");
            connection.query("SELECT id, name, realm from gt_character where role = 'DPS' and level = 100 and armory_role = 'DPS'", function(err, rows, fields) {
                characters={}
                for (var row in rows){
                    sim+="armory=eu,\""+rows[row]['realm']+"\","+rows[row]['name']+"\n"
                    characters[rows[row]['name']]=rows[row]['id']
                }
                fs.writeFile(rp+"/app/data/mbwow.simc",sim)

                // Purge DB
                connection.query("DELETE FROM gt_character_dps where time < DATE_SUB(SYSDATE(), INTERVAL 60 DAY)")

                var child = spawn('simc',['../app/data/mbwow.simc'])
                child.stdout.on('data', function(buffer) {
                    console.log('SIMC output : ' + buffer.toString())
                });
                child.stdout.on('end', function(){
                    fs.readFile('../app/data/mbwow.result.xml', function(err,data){
                        if(err) {
                            console.log("Simc : could not read XML result file : " + err);
                        } else {

                            var parseString = require('xml2js').parseString;
                            parseString(data,function(err,result){
                                if (err) return false
                                result.simulationcraft.players.forEach(function(player){
                                    for (var res_id in player.player){
                                        if (characters[player.player[res_id].$.name]) {
                                            console.log("Insert SIMC result : "+player.player[res_id].$.name+" = "+player.player[res_id].dps[0].$.value)
                                            insertSim(characters[player.player[res_id].$.name],player.player[res_id].dps[0].$.value)
                                        }
                                    }
                                })
                            })
                        }
                    })
                })
            })
        }
    };

    // Decode result

    // Store result
    function insertSim(Charid, DPS){
        connection.query("INSERT INTO gt_character_dps (character_id, dps, time) VALUES (?,?,NOW())",[Charid,DPS],function(err){ if (err) console.log(err) })
    }

};

