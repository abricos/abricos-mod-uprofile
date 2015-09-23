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

/**
 * Class UProfileManager
 *
 * @property UProfileModule $module
 */
class UProfileManager extends Ab_ModuleManager {

    /**
     * @var UProfileManager
     */
    public static $instance = null;

    public function __construct(UProfileModule $module){
        UProfileManager::$instance = $this;
        parent::__construct($module);
    }

    public function IsAdminRole(){
        return $this->IsRoleEnable(UProfileAction::ADMIN);
    }

    public function IsWriteRole(){
        if ($this->IsAdminRole()){
            return true;
        }
        return $this->IsRoleEnable(UProfileAction::WRITE);
    }

    public function IsViewRole(){
        if ($this->IsWriteRole()){
            return true;
        }
        return $this->IsRoleEnable(UProfileAction::VIEW);
    }

    public function IsPersonalEditRole($userid){
        return ($this->IsWriteRole() && intval(Abricos::$user->id) === intval($userid)) || $this->IsAdminRole();
    }

    private $_uprofile = null;

    /**
     * @return UProfile
     */
    public function GetUProfile(){
        if (!is_null($this->_uprofile)){
            return $this->_uprofile;
        }
        require_once 'classes/uprofile.php';
        return $this->_uprofile = new UProfile($this);
    }

    public function AJAX($d){
        return $this->GetUProfile()->AJAX($d);
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

    public function FieldList(){
        return UProfileQuery::FieldList($this->db);
    }

    private $_userFields = null;

    public function SysFieldList(){
        if (!is_null($this->_userFields)){
            return $this->_userFields;
        }
        $rows = UProfileQuery::FieldList($this->db);
        $ret = array();
        while (($row = $this->db->fetch_array($rows))){
            $ret[$row['nm']] = $row;
        }
        $this->_userFields = $ret;
        return $this->_userFields;
    }

    public function FieldRemove($name){
        UProfileQuery::FieldRemove($this->db, $name);
    }

    public function FieldAppend($name, $title, $type, $size = '1', $options = array()){
        $options = array_merge(array(
            "order" => 0,
            "default" => '',
            "options" => '',
            "unsigned" => true,
            "access" => UserFieldAccess::VIEW_ALL
        ), $options);

        if ($type == UProfileFieldType::TABLE && empty($options['options'])){
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

        UProfileQuery::FieldAppend($this->db, $name, $title, $type, $size, $options);
        UProfileQuery::FieldInfoAppend($this->db, $name, $title, $type, $options);
    }


    public function FieldAccessUpdate($name, $access){
        UProfileQuery::FieldAccessUpdate($this->db, $name, $access);
    }

    public function FieldCacheClear(){
        $this->_userFields = null;
        UserModule::$instance->GetManager()->UserFieldCacheClear();
    }

}

?>