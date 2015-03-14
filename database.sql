-- phpMyAdmin SQL Dump
-- version 4.0.10deb1
-- http://www.phpmyadmin.net
--
-- Client: localhost
-- Généré le: Sam 14 Mars 2015 à 14:23
-- Version du serveur: 5.5.41-0ubuntu0.14.04.1
-- Version de PHP: 5.5.9-1ubuntu4.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Base de données: `gt`
--
CREATE DATABASE IF NOT EXISTS `gt` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `gt`;

-- --------------------------------------------------------

--
-- Structure de la table `gt_character`
--

DROP TABLE IF EXISTS `gt_character`;
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
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=75 ;

-- --------------------------------------------------------

--
-- Structure de la table `gt_character_enchant`
--

DROP TABLE IF EXISTS `gt_character_enchant`;
CREATE TABLE IF NOT EXISTS `gt_character_enchant` (
  `id` int(11) NOT NULL,
  `neck` int(11) NOT NULL,
  `back` int(11) NOT NULL,
  `finger1` int(11) NOT NULL,
  `finger2` int(11) NOT NULL,
  `mainHand` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Structure de la table `gt_feed`
--

DROP TABLE IF EXISTS `gt_feed`;
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

DROP TABLE IF EXISTS `gt_message`;
CREATE TABLE IF NOT EXISTS `gt_message` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` text CHARACTER SET latin1 NOT NULL,
  `class` int(11) NOT NULL,
  `message` text CHARACTER SET latin1 NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=698 ;

-- --------------------------------------------------------

--
-- Structure de la table `gt_user`
--

DROP TABLE IF EXISTS `gt_user`;
CREATE TABLE IF NOT EXISTS `gt_user` (
  `uid` int(11) NOT NULL,
  `role` text NOT NULL,
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Structure de la table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
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
-- Contraintes pour la table `gt_character_enchant`
--
ALTER TABLE `gt_character_enchant`
  ADD CONSTRAINT `gt_character_enchant_ibfk_1` FOREIGN KEY (`id`) REFERENCES `gt_character` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
