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

    public static function UserListById(UProfileApp $app, $ids){
        $db = $app->db;

        $limit = 500;
        $sa = array("u.userid=0");
        for ($i = 0; $i < min(count($ids), $limit); $i++){
            array_push($sa, " u.userid=".bkint($ids[$i]));
        }
        $sql = "
			SELECT
				DISTINCT
				u.*
			FROM ".$db->prefix."user u
			WHERE ".implode(" OR ", $sa)."
			LIMIT ".bkint($limit)."
		";
        return $db->query_read($sql);
    }

    public static function Profile(Ab_Database $db, $userid){
        $sql = "
			SELECT 
			    u.*, p.*
			FROM ".$db->prefix."user u
			LEFT JOIN ".$db->prefix."uprofile p ON u.userid=p.userid 
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

        $sql = "
			SELECT
			    DISTINCT
			 	u.*
			FROM ".$db->prefix."user u
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
}
