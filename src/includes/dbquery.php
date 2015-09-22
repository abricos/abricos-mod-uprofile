<?php
/**
 * @package Abricos
 * @subpackage UProfile
 * @copyright 2009-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

/**
 * Class UProfileQuery
 */
class UProfileQuery {

    public static function UserRatingSQLExt(Ab_Database $db){
        $ret = new stdClass();
        $ret->fld = "";
        $ret->tbl = "";
        if (UProfileManager::$instance->GetUProfile()->IsUserRating()){
            $ret->fld = "
				,
				IF(ISNULL(urt.reputation), 0, urt.reputation) as rep,
				IF(ISNULL(urt.votecount), 0, urt.votecount) as repcnt,
				IF(ISNULL(urt.skill), 0, urt.skill) as rtg
			";

            $ret->tbl = "
				LEFT JOIN ".$db->prefix."urating_user urt ON u.userid=urt.userid
			";

            $userid = Abricos::$user->id;
            if ($userid > 0){ // необходимо показать отношение к пользователю
                $ret->fld .= "
					,IF(ISNULL(vt.userid), null, IF(vt.voteup>0, 1, IF(vt.votedown>0, -1, 0))) as repmy
				";
                $ret->tbl .= "
					LEFT JOIN ".$db->prefix."urating_vote vt ON vt.module='urating' 
						AND vt.elementtype='user' AND vt.elementid=u.userid AND vt.userid=".bkint($userid)."
				";
            }
        }
        return $ret;
    }


    public static function UserListById(Ab_Database $db, $ids){
        $urt = UProfileQuery::UserRatingSQLExt($db);

        $limit = 10;
        $sa = array("u.userid=0");
        for ($i = 0; $i < min(count($ids), $limit); $i++){
            array_push($sa, " u.userid=".bkint($ids[$i]));
        }
        $sql = "
			SELECT
				DISTINCT
				u.*
				".$urt->fld."
			FROM ".$db->prefix."user u
			".$urt->tbl."
			WHERE ".implode(" OR ", $sa)."
			LIMIT ".bkint($limit)."
		";
        return $db->query_read($sql);
    }

    public static function Profile(Ab_Database $db, $userid){
        $urt = UProfileQuery::UserRatingSQLExt($db);
        $sql = "
			SELECT u.*
				".$urt->fld."
			FROM ".$db->prefix."user u
			".$urt->tbl."
			WHERE u.userid=".bkint($userid)."
			LIMIT 1
		";
        return $db->query_first($sql);
    }

    public static function ProfileUpdate(Ab_Database $db, $userid, $d, $isAdmin = false){
        $sql = "
			UPDATE ".$db->prefix."user
			SET
				".($isAdmin ? "email='".bkstr($d->email)."'," : "")."
				firstname='".bkstr($d->firstname)."',
				lastname='".bkstr($d->lastname)."',
				descript='".bkstr($d->descript)."',
				site='".bkstr($d->site)."',
				twitter='".bkstr($d->twitter)."',
				sex=".bkint($d->sex).",
				birthday=".bkint($d->birthday).",
				upddate=".TIMENOW."
			WHERE userid=".bkint($userid)."
			LIMIT 1
		";
        $db->query_write($sql);
    }

    public static function UserSearch(Ab_Database $db, $d){
        $where = array();
        if (!empty($d->firstname)){
            array_push($where, " UPPER(u.firstname)=UPPER('".bkstr($d->firstname)."') ");
        }
        if (!empty($d->lastname)){
            array_push($where, " UPPER(u.lastname)=UPPER('".bkstr($d->lastname)."') ");
        }
        if (!empty($d->username)){
            array_push($where, " UPPER(u.username)=UPPER('".bkstr($d->username)."') ");
        }
        array_push($where, " u.userid<>".bkint(Abricos::$user->id));

        $urt = UProfileQuery::UserRatingSQLExt($db);

        $sql = "
			SELECT
			    DISTINCT
			 	u.*
				".$urt->fld."
			FROM ".$db->prefix."user u
			".$urt->tbl."
			WHERE ".implode(" AND ", $where)."
			LIMIT 25
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
        switch ($type){
            case UProfileFieldType::BOOLEAN:
                $sql = "`".$name."` tinyint(1) unsigned NOT NULL default ".bkint($defvalue);
                break;
            case UProfileFieldType::INTEGER:
                $sql = "`".$name."` int(".$size.") ".$unsignedStr." NOT NULL default ".intval($defvalue)."";
                break;
            case UProfileFieldType::STRING:
                $sql = "`".$name."` varchar(".$size.") NOT NULL default '".$defvalue."'";
                break;
            case UProfileFieldType::DOUBLE:
                $sql = "`".$name."` double(".$size.") ".$unsignedStr." NOT NULL default ".doubleval($defvalue)."";
                break;
            case UProfileFieldType::TEXT:
                $sql = "`".$name."` TEXT";
                break;
            case UProfileFieldType::DATETIME:
                $sql = "`".$name."` int(10) unsigned NOT NULL default 0";
                break;
            case UProfileFieldType::ENUM:
                $sql = "`".$name."` int(".$size.") unsigned NOT NULL default 0";
                break;
            case UProfileFieldType::TABLE:
                $sql = "`".$name."id` int(".$size.") unsigned NOT NULL default 0";
                break;
        }
        if (empty($sql)){
            return;
        }
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
			WHERE fieldname='".bkstr($name)."'
			LIMIT 1
		";
        $db->query_write($sql);
    }

}

?>