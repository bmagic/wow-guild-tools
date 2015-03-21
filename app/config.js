var config_module = angular.module('guildtoolsApp.config', [])
        .constant('ARMORY_BASEURL','http://eu.battle.net/')
        .constant('ENCHANTS_LIST',{enchants:[3368,5324,5325,5326,5327,5328,5317,5318,5319,5320,5321,5310,5311,5312,5313,5314,5330,5331,5335,5336,5337,5334,5383,5384,5275 ]})
        .constant('SPEC_DPS_LIST',{dps_distant:['Élémentaire','Restauration','Maîtrise des bêtes','Précision','Survie','Affliction','Démonologie','Destruction','Équilibre','Arcanes','Feu','Givre','Tisse-brume','Discipline','Sacré','Ombre'],
            dps_cac:['Amélioration','Sang','Impie','Givre','Farouche','Gardien','Armes','Fureur','Protection','Marche-vent','Maître brasseur','Vindicte','Protection','Sacré','Assassinat','Combat','Finesse']});