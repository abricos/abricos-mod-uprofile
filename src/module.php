<?php
/**
 * @package Abricos
 * @subpackage UProfile
 * @copyright 2009-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

/**
 * Модуль "Профиль пользователя"
 *
 * @method UProfileManager GetManager()
 */
class UProfileModule extends Ab_Module {

    /**
     * @var UProfileModule
     */
    public static $instance = null;

    function __construct(){
        $this->version = "0.1.7";
        $this->name = "uprofile";
        $this->takelink = "uprofile";

        $this->permission = new UProfilePermission($this);
    }

    public function GetManagerClassName(){
        return 'UProfileManager';
    }

    public function GetContentName(){
        $contentName = 'index';
        $adress = Abricos::$adress;

        if ($adress->level >= 2 && $adress->dir[1] == 'upload'){
            $contentName = "upload";
        }
        return $contentName;
    }
}


/**
 * Приоритет знакомых
 */
class UserFriendPriority {
    /**
     * Прямое отношение этого пользователя к другим (например сотрудники одной организации, друзья в соцсетях)
     *
     * @var integer 0
     */
    const DIRECT = 0;

    /**
     * Посредственное отношение этого пользователя к другим (например: участник в одной группе на доске проектов)
     *
     * @var integer 1
     */
    const MIDDLING = 1;

    /**
     * Случайные встречи (например ответ на комментарий этого пользователя, гости в профиле соц сети и т.п.)
     *
     * @var integer 9
     */
    const RANDOM = 9;
}

class UProfileAction {
    // Просмотр профиля пользователя
    const VIEW = 10;

    // изменение своего профиля
    const WRITE = 30;

    // администрирование настройки профиля
    const ADMIN = 50;
}

class UProfilePermission extends Ab_UserPermission {

    public function __construct(UProfileModule $module){
        $defRoles = array(
            new Ab_UserRole(UProfileAction::VIEW, Ab_UserGroup::GUEST),
            new Ab_UserRole(UProfileAction::VIEW, Ab_UserGroup::REGISTERED),
            new Ab_UserRole(UProfileAction::VIEW, Ab_UserGroup::ADMIN),

            new Ab_UserRole(UProfileAction::WRITE, Ab_UserGroup::REGISTERED),
            new Ab_UserRole(UProfileAction::WRITE, Ab_UserGroup::ADMIN),

            new Ab_UserRole(UProfileAction::ADMIN, Ab_UserGroup::ADMIN)
        );
        parent::__construct($module, $defRoles);
    }

    public function GetRoles(){
        return array(
            UProfileAction::VIEW => $this->CheckAction(UProfileAction::VIEW),
            UProfileAction::WRITE => $this->CheckAction(UProfileAction::WRITE),
            UProfileAction::ADMIN => $this->CheckAction(UProfileAction::ADMIN)
        );
    }
}

Abricos::ModuleRegister(new UProfileModule());
