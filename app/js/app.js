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

    socket.on('get:feeds', function(feeds){
        $scope.feeds = feeds;
    });

    socket.on('get:messages', function(messages){
        $scope.messages = messages;
    });

    socket.on('set:message',function(message){
        //socket.emit('get:messages');
        if ($scope.messages != undefined)
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
    socket.emit('get:prev-raids');

    socket.forward('get:prev-raids', $scope);
    $scope.$on('socket:get:prev-raids',function(ev,obj){
        $scope.prevRaids = obj;
    });


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

guildtoolsApp.controller('RaidGuildController', ['$scope', 'socket','$stateParams','$location',function($scope,socket,$stateParams,$location){

    $scope.inscriptionState = 'ok';
    $scope.inscriptionMessage = '';


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
    $scope.addRaidInscription = function(inscriptionState,inscriptionMessage){
        socket.emit('add:raid-inscription',{'raid_id':$stateParams.raidId,'state':inscriptionState,'character_id':$scope.mainCharacter.id,'message':inscriptionMessage});
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
        inscriptions.forEach(function (inscription) {
            inscriptionsByCharacterId[inscription.character_id]=inscription;
            if($scope.charactersById[inscription.character_id].main ==1 && inscription.state == 'ok')
                inscriptionsByRole[$scope.charactersById[inscription.character_id].role].push(inscription);
        });
        $scope.inscriptionsByCharacterId = inscriptionsByCharacterId;
        $scope.inscriptionsByRole = inscriptionsByRole;


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
        var allRaidCharactersId =[];
        $scope.allRaidCharacters.forEach(function(character){
            allRaidCharactersId.push(character.id);

        });


        try {



            compositor = JSON.parse(compositor);

            var newCharactersId = allRaidCharactersId;


            // TODO Voir pouquoi ça bug ...
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
            compositor.pool = allRaidCharactersId;
            console.log(allRaidCharactersId);
        }
        return compositor;

    }
}]);
