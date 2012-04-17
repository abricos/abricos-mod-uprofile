<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage User
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

class UserProfileQuery {
	
	public static function Profile(Ab_Database $db, $userid, $personal = false){
		$sql = "
			SELECT
				userid as id, 
				username as unm,
				firstname as fnm,
				lastname as lnm,
				avatar as avt,
				descript as dsc,
				birthday as bd,
				site,
				sex,
				lastvisit as lv,
				joindate as dl
				".($personal ? ",email as eml" : "")."
			FROM ".$db->prefix."user
			WHERE userid=".bkint($userid)."
			LIMIT 1
		";
		return $db->query_read($sql);
	}
	
	public static function ProfileUpdate(Ab_Database $db, $userid, $d, $isAdmin = false){
		$sql = "
			UPDATE ".$db->prefix."user
			SET
				".($isAdmin ? "email='".bkstr($d->eml)."'," : "")."
				firstname='".bkstr($d->fnm)."',
				lastname='".bkstr($d->lnm)."',
				descript='".bkstr($d->dsc)."',
				site='".bkstr($d->site)."',
				sex=".bkint($d->sex).",
				birthday=".bkint($d->bd)."
			WHERE userid=".bkint($userid)."
		";
		$db->query_write($sql);
	}
	
	
	/**
	 * Поиск пользователя по имени, фамилии или логину
	 * 
	 * @param Ab_Database $db
	 * @param integer $userid
	 * @param string $firstname
	 * @param string $lastname
	 * @param string $username
	 */
	public static function FindUser(Ab_Database $db, $userid, $firstname, $lastname, $username){
		$where = array();
		if (!empty($firstname)){
			array_push($where, " UPPER(u.firstname)=UPPER('".bkstr($firstname)."') ");
		}
		if (!empty($lastname)){
			array_push($where, " UPPER(u.lastname)=UPPER('".bkstr($lastname)."') ");
		}
		if (!empty($username)){
			array_push($where, " UPPER(u.username)=UPPER('".bkstr($username)."') ");
		}
		array_push($where, " u.userid<>".bkint($userid));
		
		$sql = "
			SELECT
			 	u.userid as id,
				u.username as unm,
				u.firstname as fnm,
				u.lastname as lnm,
				u.avatar as avt
			FROM ".$db->prefix."user u
			WHERE ".implode(" AND ", $where)."
			LIMIT 50
		";
		return $db->query_read($sql);
	}
	
	public static function FieldSetValue(Ab_Database $db, $userid, $varname, $value){
		$sql = "
			UPDATE ".$db->prefix."user
			SET ".bkstr($varname)."='".bkstr($value)."'
			WHERE userid=".bkint($userid)."
		";
		$db->query_write($sql);
	}
	
	public static function FieldList(Ab_Database $db){
		$sql = "
			SELECT
				fieldid as id, 
				fieldname as nm,
				fieldtype as ft,
				fieldaccess as fa,
				options as ops,
				title as tl,
				ord
			FROM ".$db->prefix."upfl_field
			WHERE fieldaccess<>".UserFieldAccess::SYSTEM."
			ORDER BY ord
		";
		return $db->query_read($sql);
	}
	
	public static function FieldAppend(Ab_Database $db, $name, $title, $type, $size = '1', $options){
		$name = bkstr($name);
		$title = bkstr($title);
		$size = bkstr($size);
		$unsignedStr = $options['unsigned'] ? 'unsigned' : '';
		$defvalue = bkstr($options['default']);
		$sql = "";
		switch($type){
			case UserFieldType::BOOLEAN:
				$sql = "`".$name."` tinyint(1) unsigned NOT NULL default ".bkint($defvalue);
				break;
			case UserFieldType::INTEGER:
				$sql = "`".$name."` int(".$size.") ".$unsignedStr." NOT NULL default ".intval($defvalue)."";
				break;
			case UserFieldType::STRING:
				$sql = "`".$name."` varchar(".$size.") NOT NULL default '".$defvalue."'";
				break;
			case UserFieldType::DOUBLE:
				$sql = "`".$name."` double(".$size.") ".$unsignedStr." NOT NULL default ".doubleval($defvalue)."";
				break;
			case UserFieldType::TEXT:
				$sql = "`".$name."` TEXT";
				break;
			case UserFieldType::DATETIME:
				$sql = "`".$name."` int(10) unsigned NOT NULL default 0";
				break;
			case UserFieldType::ENUM:
				$sql = "`".$name."` int(".$size.") unsigned NOT NULL default 0";
				break;
			case UserFieldType::TABLE:
				$sql = "`".$name."id` int(".$size.") unsigned NOT NULL default 0";
				break;
		}
		if (empty($sql)){ return; }
		$sql = "ALTER TABLE `".$db->prefix."user` ADD ".$sql." COMMENT '".$title."'"; 
		$db->query_write($sql);
	}
	
	public static function FieldInfoAppend(Ab_Database $db, $name, $title, $type, $ops){
		$sql = "
			INSERT INTO ".$db->prefix."upfl_field (fieldname, title, fieldtype, fieldaccess, options, ord) VALUES (
				'".bkstr($name)."',
				'".bkstr($title)."',
				".bkint($type).",
				".bkint($ops['access']).",
				'".bkstr($ops['options'])."',
				".bkint($ops['order'])."
			)
		";
		$db->query_write($sql);
	}
	
	public static function FieldRemove(Ab_Database $db, $name){
		$sql = "
			ALTER TABLE `".$db->prefix."user` DROP `".bkstr($name)."`
		";
		$db->query_write($sql);
		$sql = "
			DELETE FROM ".$db->prefix."upfl_field
			WHERE fieldname='".bkstr($name)."'
		";
		$db->query_write($sql);
	}
	
	public static function FieldAccessUpdate(Ab_Database $db, $name, $access){
		$sql = "
			UPDATE ".$db->prefix."upfl_field
			SET fieldaccess=".bkint($access)."
			WHERE fieldname='".bkstr($fieldname)."'
			LIMIT 1
		";
		$db->query_write($sql);
	}
	
}

?>