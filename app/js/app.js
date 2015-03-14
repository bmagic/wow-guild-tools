'use strict';
var guildtoolsApp = angular.module('guildtoolsApp', ['guildtoolsApp.config','ngRoute','socket','angularMoment','luegg.directives','angular.filter']);

guildtoolsApp.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
            when('/', {
                templateUrl: 'views/dashboard.html',
                controller: 'DashboardController'
            }).
            when('/roster', {
                templateUrl: 'views/roster.html',
                controller: 'RosterController'
            }).
            when('/raids', {
                templateUrl: 'views/raids.html'
            }).
            when('/personnages', {
                templateUrl: 'views/characters.html',
                controller: 'CharactersController'
            }).
            when('/absences', {
                templateUrl: 'views/absences.html'
            }).
            otherwise({
                redirectTo: '/'
            });
    }]);

guildtoolsApp.controller('MainController', ['$scope', 'socket','$location','ARMORY_BASEURL','ENCHANTS_LIST',function($scope,socket,$location,ARMORY_BASEURL,ENCHANTS_LIST){

    $scope.$location = $location;
    $scope.enchantsList = ENCHANTS_LIST.enchants;
    $scope.armoryBaseUrl =ARMORY_BASEURL;

    socket.emit('get:user');
    socket.on('get:user', function(user){
        $scope.username = user.username;
        $scope.role = user.role;
        $scope.class = user.class;
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
        socket.emit('get:messages');
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
        characters.forEach(function (character){
            if (orderCharacters[character.uid] == undefined)
                orderCharacters[character.uid] = [];
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
        $scope.allRaidCharacters = allRaidCharacters;


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



}]);


guildtoolsApp.controller('DashboardController', ['$scope', 'socket',function($scope,socket){

    socket.emit('get:feeds');

    socket.emit('get:messages');

    socket.emit('get:characters');

    socket.emit('get:raids-logs');

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

    $scope.updateAllCharacters = function(){
        angular.element('body').addClass('loading');
        socket.emit('update:all-characters');
    }
}]);

