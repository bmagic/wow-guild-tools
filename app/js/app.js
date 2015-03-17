'use strict';
var guildtoolsApp = angular.module('guildtoolsApp', ['guildtoolsApp.config','ui.router','socket','angularMoment','luegg.directives','angular.filter','ui.bootstrap.datetimepicker']);

guildtoolsApp.config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise("/");

    $stateProvider
        .state('/', {
            url: "/",
            templateUrl: "views/dashboard.html",
            controller: "DashboardController"
        })
        .state('/roster', {
            url: "/roster",
            templateUrl: "views/roster.html",
            controller: "RosterController"
        })
        .state('/raids', {
            url: "/raids",
            templateUrl: "views/raids.html",
            controller: "RaidsController"
        })
        .state('/raids.add', {
            url: "/add",
            templateUrl: "views/raids.add.html",
            controller: "RaidAddController"
        })
        .state('/raids.edit', {
            url: "/raid/edit/:raidId",
            templateUrl: "views/raids.edit.html",
            controller: "RaidEditController"
        })
        .state('/raids.guild', {
            url: "/raid/guild/:raidId",
            templateUrl: "views/raids.guild.html",
            controller: "RaidGuildController"
        })
        .state('/personnages', {
            url: "/personnages",
            templateUrl: "views/characters.html",
            controller: "CharactersController"
        })
        .state('/absences', {
            url: "/absences",
            templateUrl: "views/absences.html"
        });

});

guildtoolsApp.controller('MainController', ['$scope', 'socket','$location','ARMORY_BASEURL','ENCHANTS_LIST',function($scope,socket,$location,ARMORY_BASEURL,ENCHANTS_LIST){

    $scope.$location = $location;
    $scope.enchantsList = ENCHANTS_LIST.enchants;
    $scope.armoryBaseUrl =ARMORY_BASEURL;

    socket.emit('get:user');
    socket.on('get:user', function(user){
        $scope.username = user.username;
        $scope.role = user.role;
        $scope.class = user.class;
        $scope.uid = user.uid;
    });

    socket.on('get:online-users',function(onlineUsers){
        $scope.onlineUsers = onlineUsers;
    });

    socket.on('get:feeds', function(feeds){
        $scope.feeds = feeds;
    });

    socket.on('get:messages', function(messages){
        $scope.messages = messages;
    });

    socket.on('set:message',function(message){
        //socket.emit('get:messages');
        $scope.messages.push(message);
    });

    socket.on('get:characters', function(characters){
        characters.forEach(function(character){
            if(character.main == 1){
                $scope.class = character.class;
                $scope.mainCharacter = character;
            }
        });

        if ($scope.mainCharacter == undefined){
            $scope.class =0;
            $scope.mainCharacter = 0;
        }

        $scope.characters = characters;

    });

    socket.on('get:raids-logs', function(raidsLogs){
        $scope.raidsLogs=raidsLogs.reverse();
    });

    socket.on('get:all-characters', function(characters){
        //Le code suivant est moche je sais ... mon cerveau n'arrive pas à produire un truc plus propre pour le moment ...
        var orderCharacters = [];
        var allRaidCharacters = []
        var charactersById = {};
        characters.forEach(function (character){
            if (orderCharacters[character.uid] == undefined)
                orderCharacters[character.uid] = [];

            charactersById[character.id]=character;
            orderCharacters[character.uid].push(character);

            if(character.urole != 'casu'){
                allRaidCharacters.push(character);
            }
        });
        var orderCharactersByName = {};
        orderCharacters.forEach(function (characters){
            orderCharactersByName[characters[0].name] = {};
            orderCharactersByName[characters[0].name]= characters;
        });

        $scope.orderCharactersByName = orderCharactersByName;
        $scope.charactersByUid = orderCharacters;
        $scope.allRaidCharacters = allRaidCharacters;
        $scope.charactersById =  charactersById;


    });

    socket.on('update:all-characters', function(obj) {
        angular.element('body').removeClass('loading');
        socket.emit('get:all-characters');
    });

    socket.on('add:character', function(obj){
        angular.element('body').removeClass('loading');

        if (obj.status == "ok"){
            socket.emit('get:characters');
            $scope.characterName= '';
            $scope.characterRealm='';
        }
        else
            angular.element('.alert').text(obj.message).show();
    });

    socket.on('delete:character', function(obj) {
        angular.element('body').removeClass('loading');
        socket.emit('get:characters');
    });

    socket.on('update:character', function(obj) {
        angular.element('body').removeClass('loading');
        if (obj.status == "ok"){
            socket.emit('get:characters');
        }
        else
            angular.element('.alert').text(obj.message).show();
    });

    socket.on('set:main-character', function(obj) {
        angular.element('body').removeClass('loading');
        socket.emit('get:characters');
    });

    socket.on('set:character-role', function(obj) {
        angular.element('body').removeClass('loading');
        socket.emit('get:characters');
    });

    socket.on('get:next-raids', function(nextRaids) {
        $scope.nextRaids = nextRaids;
    });

    socket.on('add:raid', function(raid) {
        angular.element('body').removeClass('loading');
        socket.emit('get:next-raids');
        $location.path('/raids/raid/'+raid.type+'/'+raid.id);
        $location.replace();

    });

    socket.on('update:raid', function(raid) {
        angular.element('body').removeClass('loading');
        socket.emit('get:next-raids');
        $location.path('/raids/raid/'+raid.type+'/'+raid.id);
        $location.replace();
    });

    socket.on('get:raid', function(raids) {
        if (raids.length == 0){
            $location.path('/raids');
            $location.replace();
        }
        $scope.raid = raids[0];
    });
    socket.on('get:inscriptions',function(inscriptions){
        var inscriptionsByCharacterId = {};
        inscriptions.forEach(function (inscription) {
            inscriptionsByCharacterId[inscription.character_id]=inscription;
        });
        $scope.inscriptionsByCharacterId = inscriptionsByCharacterId;

    });
    socket.on('get:raid-logs',function(raidLogs){
        $scope.raidLogs = raidLogs;
    });
    socket.on('add:inscription',function(raidId){
        socket.emit('get:inscriptions',raidId);
        socket.emit('get:raid-logs',raidId);
    });
    socket.on('delete:raid',function(raidId){
        socket.emit('get:next-raids');
        $location.path('/raids');
        $location.replace();
    });




}]);


guildtoolsApp.controller('DashboardController', ['$scope', 'socket',function($scope,socket){

    socket.emit('get:feeds');

    socket.emit('get:messages');

    socket.emit('get:characters');

    socket.emit('get:raids-logs');

    socket.emit('get:next-raids');

    $scope.chatSubmit = function(){
        if ($scope.text != ''){
            if($scope.mainCharacter == 0 )
                var message = {'username':$scope.username,'message':$scope.text,'class':$scope.class};
            else
                var message = {'username':$scope.mainCharacter.name,'message':$scope.text,'class':$scope.class};
            socket.emit('set:message',message);
            $scope.text = '';
        }
    }



}]);
guildtoolsApp.controller('CharactersController', ['$scope', 'socket',function($scope,socket){

    //Load feeds
    socket.emit('get:characters');


    $scope.characterSubmit = function(){
        angular.element('body').addClass('loading');

        if ($scope.characterRealm != '' && $scope.characterName !=''){
            socket.emit('add:character',{"name":$scope.characterName, "realm":$scope.characterRealm});
        }
    }

    $scope.deleteCharacter = function(character){
        angular.element('body').addClass('loading');
        socket.emit('delete:character', character);
    }

    $scope.updateCharacter = function(character){
        angular.element('body').addClass('loading');
        socket.emit('update:character', character);
    }

    $scope.setMainCharacter = function(character){
        angular.element('body').addClass('loading');
        socket.emit('set:main-character', character);
    }

    $scope.setCharacterRole = function(role,character){
        angular.element('body').addClass('loading');
        socket.emit('set:character-role', {'role':role,'character':character});
    }



}]);

guildtoolsApp.controller('RosterController', ['$scope', 'socket',function($scope,socket){

    socket.emit('get:all-characters');
    $scope.showReroll = false;

    $scope.updateAllCharacters = function(){
        angular.element('body').addClass('loading');
        socket.emit('update:all-characters');
    }
}]);

guildtoolsApp.controller('RaidsController', ['$scope', 'socket',function($scope,socket){

    socket.emit('get:next-raids');


}]);
guildtoolsApp.controller('RaidAddController', ['$scope', 'socket',function($scope,socket){
    $scope.raidName = '';
    $scope.raidDate = Date().toString();
    $scope.raidType = 'guild';
    $scope.raidDescription = '';

    $scope.raidSubmit = function(raidName,raidDate,raidType,raidDescription){
        angular.element('body').addClass('loading');
        socket.emit('add:raid',{'name':raidName,'date':raidDate,'type':raidType,'description':raidDescription})
    }



}]);

guildtoolsApp.controller('RaidEditController', ['$scope', 'socket','$stateParams',function($scope,socket,$stateParams){

    socket.emit('get:raid',$stateParams.raidId);

    $scope.raidSubmit = function(raidId,raidName,raidDate,raidType,raidDescription){

        angular.element('body').addClass('loading');
        socket.emit('update:raid',{'id':raidId,'name':raidName,'date':raidDate,'type':raidType,'description':raidDescription})
    }

}]);

guildtoolsApp.controller('RaidGuildController', ['$scope', 'socket','$stateParams',function($scope,socket,$stateParams){

    $scope.inscriptionState = 'ok';
    $scope.inscriptionMessage = '';
    socket.emit('get:raid',$stateParams.raidId);
    socket.emit('get:all-characters');
    socket.emit('get:inscriptions',$stateParams.raidId);
    socket.emit('get:characters');
    socket.emit('get:raid-logs',$stateParams.raidId);


    $scope.deleteRaid = function(raidId){
        socket.emit('delete:raid',raidId);
    };

    $scope.addInscription = function(inscriptionState,inscriptionMessage){
        socket.emit('add:inscription',{'raid_id':$stateParams.raidId,'state':inscriptionState,'character_id':$scope.mainCharacter.id,'message':inscriptionMessage});
    }

}]);

