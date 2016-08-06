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
 */
class UProfileModule extends Ab_Module {

    private $_manager;

    /**
     * @var UProfileModule
     */
    public static $instance = null;

    function __construct(){
        $this->version = "0.1.6";
        $this->name = "uprofile";
        $this->takelink = "uprofile";

        $this->permission = new UProfilePermission($this);

        UProfileModule::$instance = $this;
    }

    /**
     * Получить менеджер
     *
     * @return UProfileManager
     */
    public function GetManager(){
        if (is_null($this->_manager)){
            require_once 'includes/manager.php';
            $this->_manager = new UProfileManager($this);
        }
        return $this->_manager;
    }

    public function GetContentName(){
        $cname = 'index';
        $adress = Abricos::$adress;

        if ($adress->level >= 2 && $adress->dir[1] == 'upload'){
            $cname = "upload";
        }
        return $cname;
    }

    /**
     * Модуль URating запросил SQL скрипт по форме, который ему нужен для того,
     * чтобы определить какие пользователи и их данные в модулях нуждаются
     * в пересчете рейтинга
     */
    public function URating_SQLCheckCalculate(){
        $db = Abricos::$db;
        return "
			SELECT 
				DISTINCT u.userid as uid,
				'".$this->name."' as m
			FROM ".$db->prefix."user u
			LEFT JOIN ".$db->prefix."urating_modcalc mc ON u.userid=mc.userid 
				AND mc.module='".bkstr($this->name)."'
			WHERE u.lastvisit > 0 
				AND ((mc.upddate + ".URatingModule::PERIOD_CHECK." < u.upddate)
					OR ISNULL(mc.upddate))
			LIMIT 30
		";
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

/**
 * Типы дополнительных полей учетной записи пользователя
 */
class UProfileFieldType {

    /**
     * Тип BOOLEAN
     *
     * @var integer
     */
    const BOOLEAN = 0;
    /**
     * Тип INTEGER
     *
     * @var integer
     */
    const INTEGER = 1;
    /**
     * Тип STRING
     *
     * @var integer
     */
    const STRING = 2;
    /**
     * Тип DOUBLE
     *
     * @var integer
     */
    const DOUBLE = 3;
    /**
     * Тип TEXT
     *
     * @var integer
     */
    const TEXT = 4;

    /**
     * Тип DATETIME
     *
     * @var integer
     */
    const DATETIME = 5;

    /**
     * Тип ENUM
     *
     * @var integer
     */
    const ENUM = 6;

    /**
     * Тип TABLE
     *
     * @var integer
     */
    const TABLE = 7;
}

class UserFieldAccess {
    const VIEW_ALL = 0;
    const PERSONAL_VIEW = 1;
    const PERSONAL_WRITE = 2;
    const ADMIN_VIEW = 3;
    const ADMIN_WRITE = 4;
    const SYSTEM = 9;
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
