<?php
/**
 * @package Abricos
 * @subpackage UProfile
 * @copyright 2009-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */


require_once 'classes.php';
require_once 'dbquery.php';

class UserProfileManager extends Ab_ModuleManager {

    /**
     *
     * @var UserProfileModule
     */
    public $module = null;

    /**
     * @var UserProfileManager
     */
    public static $instance = null;


    public function __construct(UserProfileModule $module){
        UserProfileManager::$instance = $this;
        parent::__construct($module);
    }

    public function IsAdminRole(){
        return $this->IsRoleEnable(UserProfileAction::PROFILE_ADMIN);
    }

    public function IsWriteRole(){
        return $this->IsRoleEnable(UserProfileAction::PROFILE_WRITE);
    }

    public function IsViewRole(){
        return $this->IsRoleEnable(UserProfileAction::PROFILE_VIEW);
    }

    public function IsPersonalEditRole($userid){
        return ($this->IsWriteRole() && Abricos::$user->id == $userid) || $this->IsAdminRole();
    }

    public function AJAX($d){
        switch ($d->do){

            case "viewprofile":
                return $this->Profile($d->userid, true);
            case 'profilesave':
                return $this->ProfileSave($d->userid, $d->data);
            case 'passwordsave':
                return $this->PasswordSave($d->userid, $d->data);

            case 'finduser':
                return $this->FindUser($d->firstname, $d->lastname, $d->username, true);
            case "friends":
                return $this->FriendListBuild($d->over);

            case "pubcheck":
                $ret = new stdClass();
                $ret->userid = $d->userid;
                $ret->result = $this->UserPublicityCheck($d->userid);
                return $ret;
        }
        return -1;
    }

    public function IsUserRating(){
        $modURating = Abricos::GetModule('urating');
        return !empty($modURating);
    }

    public function UsersRatingCheck($isClear = false){
        $modURating = Abricos::GetModule('urating');
        if (!empty($modURating)){
            URatingModule::$instance->GetManager()->Calculate($isClear);
        }
    }

    public function Profile($userid, $retarray = false, $recalcRating = false){
        $this->UsersRatingCheck($recalcRating);
        $res = UserProfileQuery::Profile($this->db, $userid, $this->IsPersonalEditRole($userid));

        if (!$retarray){
            return $res;
        }

        $ret = $this->db->fetch_array($res);

        $initData = new UProfileInitData($userid);
        $ret['initdata'] = $initData->ToAJAX();

        return $ret;
    }

    public function PasswordSave($userid, $d){
        if (!$this->IsPersonalEditRole($userid)){
            return null;
        }
        $ret = new stdClass();
        $ret->err = 0;

        $uman = Abricos::$user->GetManager();
        $ret->err = $uman->UserPasswordChange($userid, $d->new, $d->old);

        return $ret;
    }

    public function ProfileSave($userid, $d){
        if (!$this->IsPersonalEditRole($userid)){
            return null;
        }
        $ret = new stdClass();
        $ret->err = 0;

        $utmf = Abricos::TextParser(true);
        $d->fnm = $utmf->Parser($d->fnm);
        $d->lnm = $utmf->Parser($d->lnm);
        $d->site = $utmf->Parser($d->site);
        $d->twt = $utmf->Parser($d->twt);
        $d->dsc = $utmf->Parser($d->dsc);
        $d->sex = intval($d->sex);
        $d->bd = intval($d->bd);
        UserProfileQuery::ProfileUpdate($this->db, $userid, $d, $this->IsAdminRole());

        $ret->udata = $this->Profile($userid, true, true);
        return $ret;
    }

    /**
     * Расчет рейтинга пользователя
     *
     * Метод запрашивает модуль URating
     *
     * +25 - за заполненное имя и фамилию
     * +25 - за указанный аватар
     * +25 - за заполненное поле "О себе"
     *
     * @param integer $userid
     */
    public function URating_UserCalculate($userid){
        $uMan = UserModule::$instance->GetManager();
        $user = $uMan->User($userid);
        if (empty($user)){
            return;
        }
        $user = new UserProfile($user);

        $skill = 0;

        if (!empty($user->firstname) && !empty($user->lastname)){
            $skill += 25;
        }

        if (!empty($user->avatar)){
            $skill += 25;
        }

        if (!empty($user->descript)){
            $skill += 25;
        }

        $ret = new stdClass();
        $ret->skill = $skill;
        return $ret;
    }

    public function User_OptionNames(){
        return array(
            "pubconftype",
            "pubconfusers"
        );
    }

    public function User_OptionNamesOtherUser($userid){
        return array(
            "pubconftype",
            "pubconfusers"
        );
    }

    /**
     * Проверка возможности отправки приглашения пользователю
     *
     * @param integer $userid
     */
    public function UserPublicityCheck($userid){
        $userid = intval($userid);
        if ($userid === Abricos::$user->id){
            return true;
        }

        $options = UserModule::$instance->GetManager()->GetPersonalManager()->UserOptionList('uprofile', $userid);
        if (empty($options)){
            return false;
        }
        $optPubConfType = $options->Get('pubconftype');
        if (empty($optPubConfType->value)){
            return true; // все могут отправлять ему приглашения
        }

        $optPubConfUsers = $options->Get('pubconfusers');

        $arr = explode(",", $optPubConfUsers->value);
        foreach ($arr as $id){
            if (Abricos::$user->id == $id){
                return true;
            }
        }
        return false;
    }

    /**
     * Поиск пользователя в базе
     *
     * @param string $firstname
     * @param string $lastname
     * @param string $username
     * @param boolean $retarray
     */
    public function FindUser($firstname, $lastname, $username, $retarray = false){
        if (!(!empty($firstname) || !empty($lastname) || !empty($username))){
            return null;
        }

        if (!$this->IsViewRole()){
            return null;
        }
        $rows = UserProfileQuery::FindUser($this->db, Abricos::$user->id, $firstname, $lastname, $username);
        if (!$retarray){
            return $rows;
        }
        $ret = array();
        while (($row = $this->db->fetch_array($rows))){
            $ret[$row['id']] = $row;
        }
        return $ret;
    }


    /**
     * Построить список знакомых
     */
    public function FriendListBuild($over){
        $ret = array();

        $modules = Abricos::$modules->RegisterAllModule();

        if (is_array($over) && count($over) > 0){
            $rows = UserProfileQuery::UserListById($this->db, $over);
            while (($row = $this->db->fetch_array($rows))){
                if (intval($row['id']) === intval(Abricos::$user->id)){
                    continue;
                }
                $ret[$row['id']] = $row;
            }
        }

        foreach ($modules as $name => $module){
            if (!method_exists($module, 'UProfile_UserFriendList')){
                continue;
            }
            $o = $module->UProfile_UserFriendList();
            if (is_null($o)){
                continue;
            }
            $o->mod = $name;
            foreach ($o->users as $key => $user){
                $ret[$key] = $user;
            }
        }

        return $ret;
    }

    public function FieldList(){
        return UserProfileQuery::FieldList($this->db);
    }

    private $_userFields = null;

    public function SysFieldList(){
        if (!is_null($this->_userFields)){
            return $this->_userFields;
        }
        $rows = UserProfileQuery::FieldList($this->db);
        $ret = array();
        while (($row = $this->db->fetch_array($rows))){
            $ret[$row['nm']] = $row;
        }
        $this->_userFields = $ret;
        return $this->_userFields;
    }

    public function FieldRemove($name){
        UserProfileQuery::FieldRemove($this->db, $name);
    }

    public function FieldAppend($name, $title, $type, $size = '1', $options = array()){
        $options = array_merge(array(
            "order" => 0,
            "default" => '',
            "options" => '',
            "unsigned" => true,
            "access" => UserFieldAccess::VIEW_ALL
        ), $options);

        if ($type == UserFieldType::TABLE && empty($options['options'])){
            // настройка опций для типа Таблица
            $options['options'] = $name."|title";
        }

        $fields = $this->SysFieldList();
        if (!empty($fields[$name])){
            return;
        }
        if (UserModule::$instance->GetManager()->UserFieldCheck($name)){
            return;
        }

        UserProfileQuery::FieldAppend($this->db, $name, $title, $type, $size, $options);
        UserProfileQuery::FieldInfoAppend($this->db, $name, $title, $type, $options);
    }


    public function FieldAccessUpdate($name, $access){
        UserProfileQuery::FieldAccessUpdate($this->db, $name, $access);
    }

    public function FieldCacheClear(){
        $this->_userFields = null;
        UserModule::$instance->GetManager()->UserFieldCacheClear();
    }

    public function FieldSetValue($varname, $value){
        UserProfileQuery::FieldSetValue($this->db, Abricos::$user->id, $varname, $value);
    }
}

?>