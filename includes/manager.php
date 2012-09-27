<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage User
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

require_once 'dbquery.php';

class UserProfileManager extends Ab_ModuleManager {
	
	/**
	 * 
	 * @var UserProfileModule
	 */
	public $module = null;
	
	private $_userFields = null;
	
	public function __construct(UserProfileModule $module){
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
		return $this->IsWriteRole() && ($this->IsAdminRole() || $this->userid == $userid); 
	}

	public function DSProcess($name, $rows){
		/*
		$p = $rows->p;
		$db = $this->db;
		
		switch ($name){
			case 'profile':
				foreach ($rows->r as $r){
					if ($r->f == 'u'){ $this->ProfileUpdate($r->d); }
				}
				return;
		}
		/**/
	}
	
	public function DSGetData($name, $rows){
		/*
		$p = $rows->p;
		switch ($name){
			case 'profile': return $this->Profile($p->userid);
			case 'fieldlist': return $this->FieldList();
		}
		/**/
		return null;
		
	}
	
	public function AJAX($d){
		switch($d->do){
			
			case "viewprofile":
				return $this->Profile($d->userid, true);
				
			case 'profilesave': 
				return $this->ProfileSave($d->userid, $d->data);
				
			case 'finduser': 
				return $this->FindUser($d->firstname, $d->lastname, $d->username, true);
			case "friends": 
				return $this->FriendListBuild();
		}
		return -1;
	}
	
	public function Profile($userid, $retarray = false){
		$res = UserProfileQuery::Profile($this->db, $userid,  $this->IsPersonalEditRole($userid));
		return $retarray ? $this->db->fetch_array($res) : $res;
	}
	
	public function ProfileSave($userid, $d){
		if ($userid != $this->userid && !$this->IsAdminRole()){
			return null;
		}
		$ret = new stdClass();
		$ret->err = 0;
		if (!is_null($d->pass)){ // смена пароля
			
			$uman = Abricos::$user->GetManager();
			$ret->err = $uman->UserPasswordChange($userid, $d->pass->new, $d->pass->old);
			if ($ret->err > 0){
				return $ret;
			}
		}
		$utmf = Abricos::TextParser(true);
		$d->fnm = $utmf->Parser($d->fnm);
		$d->lnm = $utmf->Parser($d->lnm);
		$d->site = $utmf->Parser($d->site);
		$d->twt = $utmf->Parser($d->twt);
		$d->dsc = $utmf->Parser($d->dsc);
		$d->sex = intval($d->sex);
		$d->bd = intval($d->bd);
		UserProfileQuery::ProfileUpdate($this->db, $userid, $d, $this->IsAdminRole());
	
		$ret->udata = $this->Profile($userid, true);
		return $ret;
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
		if (!(!empty($firstname) || !empty($lastname) || !empty($username))){ return null; }
		
		if (!$this->IsViewRole()){ return null; }
		$rows = UserProfileQuery::FindUser($this->db, $this->userid, $firstname, $lastname, $username);
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
	public function FriendListBuild(){
		$ret = array();

		Abricos::$instance->modules->RegisterAllModule();
		$modules = Abricos::$instance->modules->GetModules();
		
		foreach ($modules as $name => $module){
			if (!method_exists($module, 'UProfile_UserFriendList')){
				continue;
			}
			$o = $module->UProfile_UserFriendList();
			if (is_null($o)){ continue; }
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
	
	public function SysFieldList(){
		if (!is_null($this->_userFields)){ return $this->_userFields; }
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
			$options['options'] = $name."|title" ;
		}
		
		$fields = $this->SysFieldList();
		if (!empty($fields[$name])){ return; }
		if ($this->user->GetManager()->UserFieldCheck($name)){ return; }
		
		UserProfileQuery::FieldAppend($this->db, $name, $title, $type, $size, $options);
		UserProfileQuery::FieldInfoAppend($this->db, $name, $title, $type, $options);
	}

	
	public function FieldAccessUpdate($name, $access){
		UserProfileQuery::FieldAccessUpdate($this->db, $name, $access);
	}
	
	public function FieldCacheClear(){
		$this->_userFields = null;
		$this->user->GetManager()->UserFieldCacheClear();
	}
	
	/*
	public function ProfileUpdate($d){
		if (!$this->IsPersonalEditRole($d->id)){
			return;
		}
		
		$utmanager = Abricos::TextParser(true);
		
		$upd = array();
		$fs = $this->SysFieldList();
		foreach ($fs as $fname => $frow){
			$val = $d->$fname;
			$nval = null;
			switch (intval($frow['ft'])){
			case UserFieldType::BOOLEAN:
			case UserFieldType::INTEGER:
			case UserFieldType::DATETIME:
			case UserFieldType::ENUM:
				$nval = intval($val);
				break;
			case UserFieldType::STRING:
			case UserFieldType::TEXT:
				
				$val = $utmanager->Parser($val);
				$nval = bkstr($val);
				break;
			case UserFieldType::DOUBLE:
				$nval = doubleval($val);
			}
			if (!is_null($nval)){
				$upd[$fname] = $nval;
			}
		}
		UserProfileQuery::ProfileUpdate($this->db, $d->id, $upd);
	}
	/**/
	
	public function FieldSetValue($varname, $value){
		UserProfileQuery::FieldSetValue($this->db, $this->userid, $varname, $value);
	}
}

?>