-- phpMyAdmin SQL Dump
-- version 4.0.10deb1
-- http://www.phpmyadmin.net
--
-- Client: localhost
-- Généré le: Lun 23 Mars 2015 à 17:53
-- Version du serveur: 5.5.41-0ubuntu0.14.04.1
-- Version de PHP: 5.5.9-1ubuntu4.7

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Base de données: `gt`
--

-- --------------------------------------------------------

--
-- Structure de la table `gt_character`
--

CREATE TABLE IF NOT EXISTS `gt_character` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` int(11) NOT NULL,
  `name` text COLLATE utf8_bin NOT NULL,
  `realm` text COLLATE utf8_bin NOT NULL,
  `main` tinyint(1) NOT NULL,
  `class` int(11) NOT NULL,
  `race` int(11) NOT NULL,
  `gender` int(11) NOT NULL,
  `level` int(11) NOT NULL,
  `thumbnail` text COLLATE utf8_bin NOT NULL,
  `ilvl` int(11) NOT NULL,
  `role` text COLLATE utf8_bin NOT NULL,
  `spec` text COLLATE utf8_bin NOT NULL,
  `armory_role` text COLLATE utf8_bin NOT NULL,
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=135 ;

-- --------------------------------------------------------

--
-- Structure de la table `gt_character_dps`
--

DROP TABLE IF EXISTS `gt_character_dps`;
CREATE TABLE IF NOT EXISTS `gt_character_dps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `character_id` int(11) NOT NULL,
  `dps` int(11) NOT NULL,
  `time` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `time` (`time`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `gt_character_gear`
--

CREATE TABLE IF NOT EXISTS `gt_character_gear` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `character_id` int(11) NOT NULL,
  `slot` text COLLATE utf8_bin NOT NULL,
  `item_id` int(11) NOT NULL,
  `item_lvl` int(11) NOT NULL,
  `has_gem_slot` int(2) NOT NULL,
  `is_enchanteable` int(2) NOT NULL,
  `gem` text COLLATE utf8_bin,
  `enchant` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `gt_character_gear_uqidx1` (`character_id`,`slot`(15))
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=6225 ;

-- --------------------------------------------------------

--
-- Structure de la table `gt_feed`
--

CREATE TABLE IF NOT EXISTS `gt_feed` (
  `guid` varchar(40) COLLATE utf8_bin NOT NULL,
  `source` text COLLATE utf8_bin NOT NULL,
  `title` text COLLATE utf8_bin NOT NULL,
  `link` text COLLATE utf8_bin NOT NULL,
  `time` datetime NOT NULL,
  PRIMARY KEY (`guid`),
  KEY `time` (`time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Structure de la table `gt_message`
--

CREATE TABLE IF NOT EXISTS `gt_message` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` text COLLATE utf8_bin NOT NULL,
  `class` int(11) NOT NULL,
  `message` text COLLATE utf8_bin NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=2953 ;

-- --------------------------------------------------------

--
-- Structure de la table `gt_raid`
--

CREATE TABLE IF NOT EXISTS `gt_raid` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` int(11) NOT NULL,
  `name` text COLLATE utf8_bin NOT NULL,
  `description` text COLLATE utf8_bin NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `type` text COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=50 ;

-- --------------------------------------------------------

--
-- Structure de la table `gt_raid_inscription`
--

CREATE TABLE IF NOT EXISTS `gt_raid_inscription` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` int(11) NOT NULL,
  `character_id` int(11) NOT NULL,
  `raid_id` int(11) NOT NULL,
  `state` text COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`id`),
  KEY `raid_id` (`raid_id`),
  KEY `character_id` (`character_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=69 ;

-- --------------------------------------------------------

--
-- Structure de la table `gt_raid_log`
--

CREATE TABLE IF NOT EXISTS `gt_raid_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `character_id` int(11) NOT NULL,
  `raid_id` int(11) NOT NULL,
  `state` text COLLATE utf8_bin NOT NULL,
  `message` text COLLATE utf8_bin,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `raid_id` (`raid_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=161 ;

-- --------------------------------------------------------

--
-- Structure de la table `gt_raid_tab`
--

CREATE TABLE IF NOT EXISTS `gt_raid_tab` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `raid_id` int(11) NOT NULL,
  `title` text COLLATE utf8_bin NOT NULL,
  `content` text COLLATE utf8_bin NOT NULL,
  `compositor` text COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`id`),
  KEY `raid_id` (`raid_id`),
  KEY `raid_id_2` (`raid_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=142 ;

-- --------------------------------------------------------

--
-- Structure de la table `gt_user`
--

CREATE TABLE IF NOT EXISTS `gt_user` (
  `uid` int(11) NOT NULL,
  `urole` text COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Structure de la table `sessions`
--

CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` varchar(255) COLLATE utf8_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` text COLLATE utf8_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Contraintes pour les tables exportées
--

--
-- Contraintes pour la table `gt_character_gear`
--
ALTER TABLE `gt_character_gear`
  ADD CONSTRAINT `gt_character_gear_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `gt_character` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `gt_character_enchant`
--
ALTER TABLE `gt_character_dps`
  ADD CONSTRAINT `gt_character_dps_ibfk_1` FOREIGN KEY (`character_id`) REFERENCES `gt_character` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `gt_raid_inscription`
--
ALTER TABLE `gt_raid_inscription`
  ADD CONSTRAINT `gt_raid_inscription_ibfk_2` FOREIGN KEY (`character_id`) REFERENCES `gt_character` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `gt_raid_inscription_ibfk_1` FOREIGN KEY (`raid_id`) REFERENCES `gt_raid` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `gt_raid_log`
--
ALTER TABLE `gt_raid_log`
  ADD CONSTRAINT `gt_raid_log_ibfk_1` FOREIGN KEY (`raid_id`) REFERENCES `gt_raid` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `gt_raid_tab`
--
ALTER TABLE `gt_raid_tab`
  ADD CONSTRAINT `gt_raid_tab_ibfk_1` FOREIGN KEY (`raid_id`) REFERENCES `gt_raid` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
