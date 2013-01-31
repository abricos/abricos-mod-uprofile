<?php
/**
 * @package Abricos
 * @subpackage UProfile
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

/**
 * Модуль "Профиль пользователя" 
 */
class UserProfileModule extends Ab_Module {
	
	private $_manager;
	
	/**
	 * @var UserProfileModule
	 */
	public static $instance = null;
	
	function __construct(){
		$this->version = "0.1.4.2";
		$this->name = "uprofile";
		$this->takelink = "uprofile";
		
		$this->permission = new UserProfilePermission($this);
		
		UserProfileModule::$instance = $this;
	}
	
	/**
	 * Получить менеджер
	 *
	 * @return UserProfileManager
	 */
	public function GetManager(){
		if (is_null($this->_manager)){
			require_once 'includes/manager.php';
			$this->_manager = new UserProfileManager($this);
		}
		return $this->_manager;
	}
	
	public function GetContentName(){
		$cname = 'index';
		$adress = $this->registry->adress;
		
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
	 * @var integer 0
	 */
	const DIRECT = 0;

	/**
	 * Посредственное отношение этого пользователя к другим (например: участник в одной группе на доске проектов)
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
class UserFieldType {
	
	/**
	 * Тип BOOLEAN
	 * @var integer
	 */
	const BOOLEAN = 0;
	/**
	 * Тип INTEGER
	 * @var integer
	 */
	const INTEGER = 1;
	/**
	 * Тип STRING 
	 * @var integer
	 */
	const STRING = 2;
	/**
	 * Тип DOUBLE 
	 * @var integer
	 */
	const DOUBLE = 3;
	/**
	 * Тип TEXT 
	 * @var integer
	 */
	const TEXT = 4;
	
	/**
	 * Тип DATETIME 
	 * @var integer
	 */
	const DATETIME = 5;

	/**
	 * Тип ENUM
	 * @var integer
	 */
	const ENUM = 6;
	
	/**
	 * Тип TABLE
	 * @var integer
	 */
	const TABLE = 7;
}

class UserFieldAccess {
	const VIEW_ALL 			= 0;
	const PERSONAL_VIEW 	= 1;
	const PERSONAL_WRITE 	= 2;
	const ADMIN_VIEW 		= 3;
	const ADMIN_WRITE 		= 4;
	const SYSTEM 			= 9;
}

class UserProfileAction {
	// Просмотр профиля пользователя
	const PROFILE_VIEW		= 10;
	
	// изменение своего профиля
	const PROFILE_WRITE		= 30;
	
	// администрирование настройки профиля
	const PROFILE_ADMIN		= 50;
}

class UserProfilePermission extends CMSPermission {
	
	public function UserProfilePermission(UserProfileModule $module){
		$defRoles = array(
			new CMSRole(UserProfileAction::PROFILE_VIEW, 1, User::UG_GUEST),
			new CMSRole(UserProfileAction::PROFILE_VIEW, 1, User::UG_REGISTERED),
			new CMSRole(UserProfileAction::PROFILE_VIEW, 1, User::UG_ADMIN),

			new CMSRole(UserProfileAction::PROFILE_WRITE, 1, User::UG_REGISTERED),
			new CMSRole(UserProfileAction::PROFILE_WRITE, 1, User::UG_ADMIN),
			
			new CMSRole(UserProfileAction::PROFILE_ADMIN, 1, User::UG_ADMIN)
		);
		parent::CMSPermission($module, $defRoles);
	}
	
	public function GetRoles(){
		return array(
			UserProfileAction::PROFILE_VIEW => $this->CheckAction(UserProfileAction::PROFILE_VIEW),
			UserProfileAction::PROFILE_WRITE => $this->CheckAction(UserProfileAction::PROFILE_WRITE), 
			UserProfileAction::PROFILE_ADMIN => $this->CheckAction(UserProfileAction::PROFILE_ADMIN) 
		);
	}
}
Abricos::ModuleRegister(new UserProfileModule());

?>