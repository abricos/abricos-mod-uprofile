<?php

/**
 * @version $Id: dbquery.php 600 2010-07-08 05:56:37Z roosit $
 * @package Abricos
 * @subpackage UserProfile
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

/**
 * Модуль "Профиль пользователя" 
 */

$mod = new UserProfileModule();
CMSRegistry::$instance->modules->Register($mod);

class UserProfileModule extends CMSModule {
	
	private $_manager;
	
	function __construct(){
		$this->version = "0.1.1.3";
		$this->name = "uprofile";
		$this->takelink = "uprofile";
		
		$this->permission = new UserProfilePermission($this);
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
		$cname = '';
		$adress = $this->registry->adress;
		
		if ($adress->level >= 2 && $adress->dir[1] == 'upload'){
			$cname = "upload";
		}
		return $cname;
	}	
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


?>