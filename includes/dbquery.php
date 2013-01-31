<?php
/**
 * @package Abricos
 * @subpackage UProfile
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

class UserProfileQuery {
	
	public static function UserRatingSQLExt(Ab_Database $db){
		$ret = new stdClass();
		$ret->fld = "";
		$ret->tbl = "";
		if (UserProfileManager::$instance->IsUserRating()){
			$ret->fld = "
				, IF(ISNULL(urt.skill), 0, urt.skill) as rtg
			";
				
			$ret->tbl = "
				LEFT JOIN ".$db->prefix."urating_user urt ON u.userid=urt.userid
			";
		}
		return $ret;
	}
	
	
	public static function UserListById(Ab_Database $db, $ids){
		$urt = UserProfileQuery::UserRatingSQLExt($db);
		
		$limit = 10;
		$where = " ";
		$sa = array("u.userid=0");
		for ($i=0; $i<min(count($ids), $limit); $i++){
			array_push($sa, " u.userid=".bkint($ids[$i]));
		}
		$sql = "
			SELECT
				DISTINCT
				u.userid as id,
				u.username as unm,
				u.firstname as fnm,
				u.lastname as lnm,
				u.avatar as avt
				".$urt->fld."
			FROM ".$db->prefix."user u
			".$urt->tbl."
			WHERE ".implode(" OR ", $sa)."
			LIMIT ".bkint($limit)."
		";
		return $db->query_read($sql);
	}
		
	public static function Profile(Ab_Database $db, $userid, $personal = false){
		$urt = UserProfileQuery::UserRatingSQLExt($db);
		$sql = "
			SELECT
				u.userid as id, 
				u.username as unm,
				u.firstname as fnm,
				u.lastname as lnm,
				u.avatar as avt,
				u.descript as dsc,
				u.birthday as bd,
				u.site,
				u.twitter as twt,
				u.sex,
				u.lastvisit as lv,
				u.joindate as dl
				".($personal ? ",u.email as eml" : "")."
				".$urt->fld."
			FROM ".$db->prefix."user u
			".$urt->tbl."
			WHERE u.userid=".bkint($userid)."
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
				twitter='".bkstr($d->twt)."',
				sex=".bkint($d->sex).",
				birthday=".bkint($d->bd).",
				upddate=".TIMENOW."
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
		
		$urt = UserProfileQuery::UserRatingSQLExt($db);
		
		$sql = "
			SELECT
			 	u.userid as id,
				u.username as unm,
				u.firstname as fnm,
				u.lastname as lnm,
				u.avatar as avt
				".$urt->fld."
			FROM ".$db->prefix."user u
			".$urt->tbl."
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