<?php
/**
 * @version $Id: dbquery.php 572 2010-05-21 12:17:26Z roosit $
 * @package Abricos
 * @subpackage User
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

class UserProfileQuery {
	
	public static function FieldSetValue(CMSDatabase $db, $userid, $varname, $value){
		$sql = "
			UPDATE ".$db->prefix."user
			SET ".bkstr($varname)."='".bkstr($value)."'
			WHERE userid=".bkint($userid)."
		";
		$db->query_write($sql);
	}
	
	public static function Profile(CMSDatabase $db, $userid, $personal = false, $fields = array()){
		if ($personal){
			array_push($fields, 'email as eml');
		}
		array_push($fields, "lastvisit as lv");
		$sql = "
			SELECT
				userid as id, username as unm,
				".implode(",", $fields)."
			FROM ".$db->prefix."user
			WHERE userid=".bkint($userid)."
			LIMIT 1
		";
		return $db->query_read($sql);
	}
	
	public static function ProfileUpdate(CMSDatabase $db, $userid, $upd){
		if (empty($upd)){ return; }
		$fs = array();
		foreach($upd as $key => $value){
			array_push($fs, $key."='".$value."'");
		}
		$sql = "
			UPDATE ".$db->prefix."user
			SET ".implode(',', $fs)."
			WHERE userid=".bkint($userid)."
		";
		$db->query_write($sql);
	}
	
	public static function FieldList(CMSDatabase $db){
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
	
	public static function FieldAppend(CMSDatabase $db, $name, $title, $type, $size = '1', $options){
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
				$sql = "`".$name."` TEXT default '".$defvalue."'";
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
	
	public static function FieldInfoAppend(CMSDatabase $db, $name, $title, $type, $ops){
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
	
	public static function FieldRemove(CMSDatabase $db, $name){
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
	
	public static function FieldAccessUpdate(CMSDatabase $db, $name, $access){
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