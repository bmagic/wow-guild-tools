'use strict';
var guildtoolsApp = angular.module('guildtoolsApp', ['guildtoolsApp.config','ui.router','btford.socket-io','angularMoment','luegg.directives','angular.filter','ui.bootstrap.datetimepicker','ui.bootstrap','ui.sortable']);

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
            controller: "RaidController"
        })
        .state('/raids.open', {
            url: "/raid/open/:raidId",
            templateUrl: "views/raids.open.html",
            controller: "RaidController"
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

guildtoolsApp.factory('socket', function (socketFactory) {
    return socketFactory();
});

guildtoolsApp.controller('MainController', ['$scope', 'socket','$location','$stateParams','ARMORY_BASEURL','ENCHANTS_LIST','SPEC_DPS_LIST',function($scope,socket,$location,$stateParams,ARMORY_BASEURL,ENCHANTS_LIST,SPEC_DPS_LIST){

    $scope.$location = $location;
    $scope.enchantsList = ENCHANTS_LIST.enchants;
    $scope.dps_distant = SPEC_DPS_LIST.dps_distant;
    $scope.dps_cac = SPEC_DPS_LIST.dps_cac;
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

    socket.on('get:all-characters', function(characters){

        //Le code suivant est moche je sais ... mon cerveau n'arrive pas à produire un truc plus propre pour le moment ...
        var orderCharacters = [];
        var allRaidCharacters = [];
        var charactersById = {};
        var charactersByDpsRole = {};
        charactersByDpsRole.dps_cac =[];
        charactersByDpsRole.dps_distant = [];
        characters.forEach(function (character){
            if (orderCharacters[character.uid] == undefined)
                orderCharacters[character.uid] = [];

            charactersById[character.id]=character;
            orderCharacters[character.uid].push(character);

            if(character.urole != 'casu' && character.main ==1){
                allRaidCharacters.push(character);
                if(SPEC_DPS_LIST.dps_cac.indexOf(character.spec) != -1 && character.role =="DPS" && character.class != 8)
                    charactersByDpsRole.dps_cac.push(character);
                if(SPEC_DPS_LIST.dps_distant.indexOf(character.spec) != -1 && character.role =="DPS" && character.class != 6)
                    charactersByDpsRole.dps_distant.push(character);
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
        $scope.charactersByDpsRole = charactersByDpsRole;

    });

    socket.on('get:next-raids', function(nextRaids) {
        $scope.nextRaids = nextRaids;
    });

    socket.on('get:raid', function(raids) {
        if (raids.length == 0){
            $location.path('/raids');
            $location.replace();
        }
        $scope.raid = raids[0];
    });

}]);


guildtoolsApp.controller('DashboardController', ['$scope', 'socket',function($scope,socket){

    socket.emit('get:feeds');
    socket.emit('get:messages');
    socket.emit('get:characters');
    socket.emit('get:raids-logs');
    socket.emit('get:next-raids');


    socket.forward('get:feeds', $scope);
    $scope.$on('socket:get:feeds',function(ev,feeds){
        $scope.feeds = feeds;
    });

    socket.forward('get:messages', $scope);
    $scope.$on('socket:get:messages',function(ev,messages){
        $scope.messages = messages;
    });

    socket.forward('set:message', $scope);
    $scope.$on('socket:set:message',function(ev,message){
        if ($scope.messages != undefined)
            $scope.messages.push(message);
    });

    socket.forward('get:raids-logs', $scope);
    $scope.$on('socket:get:raids-logs', function(ev,raidsLogs){
        $scope.raidsLogs=raidsLogs.reverse();
    });

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


    socket.forward('add:character', $scope);
    $scope.$on('socket:add:character', function(ev,obj){
        angular.element('body').removeClass('loading');

        if (obj.status == "ok"){
            socket.emit('get:characters');
            $scope.characterName= '';
            $scope.characterRealm='';
        }
        else
            angular.element('.alert').text(obj.message).show();
    });

    socket.forward('delete:character', $scope);
    $scope.$on('socket:delete:character', function(ev,obj) {
        angular.element('body').removeClass('loading');
        socket.emit('get:characters');
    });

    socket.forward('update:character', $scope);
    $scope.$on('socket:update:character', function(ev,obj) {
        angular.element('body').removeClass('loading');
        if (obj.status == "ok"){
            socket.emit('get:characters');
        }
        else
            angular.element('.alert').text(obj.message).show();
    });

    socket.forward('set:main-character', $scope);
    $scope.$on('socket:set:main-character', function(ev,obj) {
        angular.element('body').removeClass('loading');
        socket.emit('get:characters');
    });

    socket.forward('set:character-role', $scope);
    $scope.$on('socket:set:character-role', function(ev,obj) {
        angular.element('body').removeClass('loading');
        socket.emit('get:characters');
    });


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

    socket.forward('update:all-characters', $scope);
    $scope.$on('socket:update:all-characters', function(ev,obj) {
        angular.element('body').removeClass('loading');
        socket.emit('get:all-characters');
    });


    $scope.updateAllCharacters = function(){
        angular.element('body').addClass('loading');
        socket.emit('update:all-characters');
    }
}]);

guildtoolsApp.controller('RaidsController', ['$scope', 'socket',function($scope,socket){

    socket.emit('get:next-raids');
    socket.emit('get:prev-raids');

    socket.forward('get:prev-raids', $scope);
    $scope.$on('socket:get:prev-raids',function(ev,obj){
        $scope.prevRaids = obj;
    });


}]);



guildtoolsApp.controller('RaidAddController', ['$scope', 'socket','$location',function($scope,socket,$location){
    $scope.raidName = '';
    $scope.raidDate = Date().toString();

    $scope.raidType = 'open';


    $scope.raidDescription = '';


    socket.forward('add:raid', $scope);
    $scope.$on('socket:add:raid', function(ev,raid) {
        angular.element('body').removeClass('loading');
        socket.emit('get:next-raids');
        $location.path('/raids/raid/'+raid.type+'/'+raid.id);
        $location.replace();

    });


    $scope.raidSubmit = function(raidName,raidDate,raidType,raidDescription){
        angular.element('body').addClass('loading');
        socket.emit('add:raid',{'name':raidName,'date':raidDate,'type':raidType,'description':raidDescription})
    }



}]);

guildtoolsApp.controller('RaidEditController', ['$scope', 'socket','$stateParams','$location',function($scope,socket,$stateParams,$location){

    socket.emit('get:raid',$stateParams.raidId);

    socket.forward('update:raid', $scope);
    $scope.$on('socket:update:raid', function(ev,raid) {
        angular.element('body').removeClass('loading');
        socket.emit('get:next-raids');
        $location.path('/raids/raid/'+raid.type+'/'+raid.id);
        $location.replace();
    });

    $scope.raidSubmit = function(raidId,raidName,raidDate,raidType,raidDescription){

        angular.element('body').addClass('loading');
        socket.emit('update:raid',{'id':raidId,'name':raidName,'date':raidDate,'type':raidType,'description':raidDescription})
    }

}]);

guildtoolsApp.controller('RaidController', ['$scope', 'socket','$stateParams','$location','$filter',function($scope,socket,$stateParams,$location,$filter){

    $scope.inscriptionState = 'ok';
    $scope.inscriptionMessage = '';
    $scope.inscriptionCharacterId = '';


    socket.emit('get:all-characters');
    socket.emit('get:characters');

    socket.emit('get:raid',$stateParams.raidId);
    socket.emit('get:raid-inscriptions',$stateParams.raidId);
    socket.emit('get:raid-logs',$stateParams.raidId);
    socket.emit('get:raid-tabs',$stateParams.raidId);



    $scope.compositorListeners = {
        itemMoved:function(obj) {
            $scope.saveCompositor();
        },
        orderChanged: function (obj) {
            $scope.saveCompositor();
        }
    };

    $scope.saveCompositor = function(){
        $scope.raidTabs.forEach(function(raidTab){
            if (raidTab.active == true )
                $scope.updateRaidTab(raidTab.id,raidTab.title,raidTab.content,raidTab.compositor);
        });
    }


    /** Functions **/
    $scope.addRaidInscription = function(inscriptionState,inscriptionMessage,inscriptionCharacterId){
        socket.emit('add:raid-inscription',{'raid_id':$stateParams.raidId,'state':inscriptionState,'character_id':inscriptionCharacterId,'message':inscriptionMessage});
    }

    $scope.addRaidTab = function(){
        socket.emit('add:raid-tab',$stateParams.raidId)
    }

    $scope.updateRaidTab = function(id,title,content,compositor){
        socket.emit('update:raid-tab',{id:id, title:title,content:content,compositor:JSON.stringify(compositor)});
    }

    $scope.deleteRaid = function(raidId){
        socket.emit('delete:raid',raidId);
    };

    $scope.deleteRaidTab = function(raidTabId){
        socket.emit('delete:raid-tab',raidTabId);
    };


    /** Socket ON **/
    socket.forward('get:raid-inscriptions', $scope);
    $scope.$on('socket:get:raid-inscriptions',function(ev,inscriptions){
        var inscriptionsByCharacterId = {};
        var inscriptionsByRole = {};
        inscriptionsByRole.TANK =[];
        inscriptionsByRole.HEALING =[];
        inscriptionsByRole.DPS =[];

        var allInscriptionsByRole = {};
        allInscriptionsByRole.TANK =[];
        allInscriptionsByRole.HEALING =[];
        allInscriptionsByRole.DPS =[];

        inscriptions.forEach(function (inscription) {
            inscriptionsByCharacterId[inscription.character_id]=inscription;

            allInscriptionsByRole[$scope.charactersById[inscription.character_id].role].push(inscription);

            if($scope.charactersById[inscription.character_id].main ==1 && inscription.state == 'ok')
                inscriptionsByRole[$scope.charactersById[inscription.character_id].role].push(inscription);
        });
        $scope.inscriptionsByCharacterId = inscriptionsByCharacterId;
        $scope.inscriptionsByRole = inscriptionsByRole;
        $scope.allInscriptionsByRole = allInscriptionsByRole;
        $scope.allInscriptions = inscriptions;

    });


    socket.forward('get:raid-logs', $scope);
    $scope.$on('socket:get:raid-logs',function(ev,raidLogs){
        $scope.raidLogs = raidLogs;
    });

    socket.forward('get:raid-tabs', $scope);
    $scope.$on('socket:get:raid-tabs',function(ev,raidTabs){

        raidTabs.forEach(function(raidTab){
            raidTab.compositor =  $scope.parseCompositor(raidTab.compositor);
        });

        $scope.raidTabs = raidTabs;

    });

    socket.forward('delete:raid', $scope);
    $scope.$on('socket:delete:raid',function(ev,raidId){
        socket.emit('get:next-raids');
        socket.emit('get:prev-raids');
        $location.path('/raids');
        $location.replace();
    });

    socket.forward('delete:raid-tab', $scope);
    $scope.$on('socket:delete:raid-tab',function(ev,raidId){
        socket.emit('get:raid-tabs',$stateParams.raidId);
    });

    socket.forward('add:raid-inscription', $scope);
    $scope.$on('socket:add:raid-inscription',function(ev,raidId){
        socket.emit('get:raid-inscriptions',raidId);
        socket.emit('get:raid-logs',raidId);
    });

    socket.forward('add:raid-tab', $scope);
    $scope.$on('socket:add:raid-tab',function(ev,raidTab){
        if (raidTab.raid_id == $stateParams.raidId)
        {

            $scope.raidTabs.push(raidTab);
            raidTab.compositor = $scope.parseCompositor("")

        }
    });

    socket.forward('update:raid-tab', $scope);
    $scope.$on('socket:update:raid-tab',function(ev,obj){
        $scope.raidTabs.forEach(function(raidTab){
            if (raidTab.id == obj.id ){
                raidTab.title = obj.title;
                raidTab.content = obj.content;
                raidTab.compositor = $scope.parseCompositor(obj.compositor)
            }
        });
    });

    $scope.parseCompositor = function(compositor){
        var allCharactersId =[];
        if ($scope.raid.type == "guild") {
            $scope.allRaidCharacters.forEach(function (character) {
                allCharactersId.push(character.id);
            });
        }
        else {
             $scope.allInscriptions.forEach(function (inscription){
                 allCharactersId.push(inscription.character_id);
             });
        }
        try {

            compositor = JSON.parse(compositor);

            var newCharactersId = allCharactersId;
            compositor.pool = $filter('unique')(compositor.pool);
            compositor.group1 = $filter('unique')(compositor.group1);
            compositor.group2 = $filter('unique')(compositor.group2);
            compositor.group3 = $filter('unique')(compositor.group3);
            compositor.group4 = $filter('unique')(compositor.group4);
            compositor.group5 = $filter('unique')(compositor.group5);
            compositor.group6 = $filter('unique')(compositor.group6);


            // C'est super moche mais it's working
            compositor.pool.forEach(function(id){
                newCharactersId.splice(newCharactersId.indexOf(id), 1);
                if ($scope.charactersById[id] == undefined)
                    compositor.pool.splice(compositor.pool.indexOf(id), 1);

            });
            compositor.group1.forEach(function(id){
                newCharactersId.splice(newCharactersId.indexOf(id), 1);
                if ($scope.charactersById[id] == undefined)
                    compositor.group1.splice(compositor.group1.indexOf(id), 1);
            });

            compositor.group2.forEach(function(id){
                newCharactersId.splice(newCharactersId.indexOf(id), 1);
                if ($scope.charactersById[id] == undefined)
                    compositor.group2.splice(compositor.group2.indexOf(id), 1);
            });

            compositor.group3.forEach(function(id){
                newCharactersId.splice(newCharactersId.indexOf(id), 1);
                if ($scope.charactersById[id] == undefined)
                    compositor.group3.splice(compositor.group3.indexOf(id), 1);
            });

            compositor.group4.forEach(function(id){
                newCharactersId.splice(newCharactersId.indexOf(id), 1);
                if ($scope.charactersById[id] == undefined)
                    compositor.group4.splice(compositor.group4.indexOf(id), 1);
            });

            compositor.group5.forEach(function(id){
                newCharactersId.splice(newCharactersId.indexOf(id), 1);
                if ($scope.charactersById[id] == undefined)
                    compositor.group5.splice(compositor.group5.indexOf(id), 1);
            });

            compositor.group6.forEach(function(id){
                newCharactersId.splice(newCharactersId.indexOf(id), 1);
                if ($scope.charactersById[id] == undefined)
                    compositor.group6.splice(compositor.group6.indexOf(id), 1);
            });

            newCharactersId.forEach(function(id){
                compositor.pool.push(id);
            });
        }
        catch (e){
            compositor = {};
            compositor.pool = allCharactersId;
        }
        return compositor;

    }
}]);
