<?php
/**
 * @package Abricos
 * @subpackage UProfile
 * @copyright 2009-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

/**
 * Class UProfileManager
 *
 * @property UProfileModule $module
 * @method UProfileApp GetApp()
 */
class UProfileManager extends Ab_ModuleManager {

    public function GetAppClassName(){
        return 'UProfileApp';
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

    public function AJAX($d){
        return $this->GetApp()->AJAX($d);
    }

    public function URating_GetTypes(){
        return 'user';
    }

    public function URating_GetDefaultConfig($type){
        return array(
            'votingPeriod' => 0,
            'showResult' => true
        );
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
    /*
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
    /**/

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
}
