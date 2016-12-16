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

    public static function User(UProfileApp $app, $userid){
        $db = $app->db;
        $sql = "
			SELECT *
			FROM ".$db->prefix."user
			WHERE userid=".intval($userid)."
			LIMIT 1
		";
        return $db->query_first($sql);
    }

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
			    u.userid as id,
			    u.*, p.*
			FROM ".$db->prefix."user u
			LEFT JOIN ".$db->prefix."uprofile p ON u.userid=p.userid 
			WHERE u.userid=".bkint($userid)."
			LIMIT 1
		";
        return $db->query_first($sql);
    }

    public static function ProfileByUserName(Ab_Database $db, $userName){
        $sql = "
			SELECT
			    u.userid as id,
			    u.*, p.*
			FROM ".$db->prefix."user u
			LEFT JOIN ".$db->prefix."uprofile p ON u.userid=p.userid 
			WHERE u.username='".bkstr($userName)."'
			LIMIT 1
		";
        return $db->query_first($sql);
    }


    public static function ProfileSave(Ab_Database $db, UProfileSave $save){
        $d = $save->vars;
        $sql = "
			UPDATE ".$db->prefix."user
			SET
				firstname='".bkstr($d->firstname)."',
				lastname='".bkstr($d->lastname)."',
				patronymic='".bkstr($d->patronymic)."',
				upddate=".TIMENOW."
			WHERE userid=".bkint($d->userid)."
			LIMIT 1
		";
        $db->query_write($sql);

        $sql = "
            INSERT INTO ".$db->prefix."uprofile (
                userid, sex, birthday, site, descript, github, 
                twitter, facebook, telegram, skype, instagram, 
                vk, ok
            ) VALUES (
                ".bkint($d->userid).",
				".bkint($d->sex).",
				".bkint($d->birthday).",
				'".bkstr($d->site)."',
				'".bkstr($d->descript)."',
				'".bkstr($d->github)."',
				'".bkstr($d->twitter)."',
				'".bkstr($d->facebook)."',
				'".bkstr($d->telegram)."',
				'".bkstr($d->skype)."',
				'".bkstr($d->instagram)."',
				'".bkstr($d->vk)."',
				'".bkstr($d->ok)."'
            ) 
            ON DUPLICATE KEY UPDATE 
				sex=".bkint($d->sex).",
				birthday=".bkint($d->birthday).",
				site='".bkstr($d->site)."',
				descript='".bkstr($d->descript)."',
				github='".bkstr($d->github)."',
				twitter='".bkstr($d->twitter)."',
				facebook='".bkstr($d->facebook)."',
				telegram='".bkstr($d->telegram)."',
				skype='".bkstr($d->skype)."',
				instagram='".bkstr($d->instagram)."',
				vk='".bkstr($d->vk)."',
				ok='".bkstr($d->ok)."'
		";
        $db->query_write($sql);
    }

    public static function ProfileEmailUpdate(Ab_Database $db, UProfileSave $save){
        $d = $save->vars;
        $sql = "
			UPDATE ".$db->prefix."user
			SET email='".bkstr($d->email)."'
			WHERE userid=".bkint($d->userid)."
			LIMIT 1
		";
        $db->query_write($sql);
    }

    public static function ProfileAvatarUpdate(Ab_Database $db, $userid, $avatar){
        $sql = "
			UPDATE ".$db->prefix."user
			SET avatar='".bkstr($avatar)."'
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
}
