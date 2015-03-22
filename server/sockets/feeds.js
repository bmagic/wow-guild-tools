var http = require('http');
var parseString = require('xml2js').parseString;
var sha1 = require('sha1');


module.exports = function(config,io,connection){

    io.on('connection', function(socket){
        socket.on('get:feeds', function(msg){

            connection.query('SELECT * from `gt_feed` ORDER BY time DESC LIMIT 30', function(err, rows, fields) {
                if (err) return coneole.log(err);
                socket.emit('get:feeds', rows);

            });

        });
    });

    return {
        fetchFeeds: function(){
            console.log("fetchfeed");
            fetchMMOChampion();
            fetchJudgehype();
        }

    };
    function getFeed(url,callback){
        http.get(url, function(res) {
            var body = '';
            res.on('data', function(chunk) {
                body += chunk;
            });
            res.on('end', function() {
                parseString(body, function (err, result) {
                    callback(result);
                });
            });
        })
    }
    function fetchMMOChampion(){
        getFeed(config.feeds.mmochampion, function(feed){
            feed.rss.channel[0].item.forEach(function(item){

                var guid = sha1(item.guid[0]);
                var source = "MMO";
                var title = item.title[0].trim();
                var link = item.link[0].trim();
                var time = new Date(item.pubDate[0]).getTime();

                insertFeed(guid,source,title,link,time);


            });
        });
    }
    function fetchJudgehype(){
        getFeed(config.feeds.judgehype, function(feed){
            feed.rss.channel[0].item.forEach(function(item){

                var guid = sha1(item.guid[0]);
                var source = "JH";
                var title = item.title[0].trim();
                var link = item.link[0].trim();
                var time = new Date(item.pubDate[0]).getTime();

                insertFeed(guid,source,title,link,time);
            });
        });
    }
    function insertFeed(guid, source,title,link,time){
        var sql = "INSERT INTO gt_feed SET guid = "+connection.escape(guid)+", source = "+connection.escape(source)+", title = "+connection.escape(title)+", link = "+connection.escape(link)+", time =  FROM_UNIXTIME("+connection.escape(time/1000) +") ON DUPLICATE KEY UPDATE title = VALUES(title), link = VALUES(link), time = VALUES(time)"
        connection.query(sql);
    }





};



