<?php
/**
 * @package Abricos
 * @subpackage UProfile
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

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
	
	private $_userFields = null;
	
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
		return ($this->IsWriteRole() && $this->userid == $userid) || $this->IsAdminRole(); 
	}

	public function DSProcess($name, $rows){ }
	
	public function DSGetData($name, $rows){ return null; }
	
	public function AJAX($d){
		switch($d->do){
			
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

			case "pubconf":
				return $this->UserPublicityConfig($d->userid);
			case 'pubconfsave': 
				return $this->UserPublicityConfigSave($d->userid, $d->data);
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
		$res = UserProfileQuery::Profile($this->db, $userid,  $this->IsPersonalEditRole($userid));
		return $retarray ? $this->db->fetch_array($res) : $res;
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
	
	public function UserSkillCalculate($userid){
		Abricos::$user->GetManager();
		$user = UserQueryExt::User($this->db, $userid);
		
		$skill = 0;
		
		if (!empty($user['firstname']) && !empty($user['lastname'])){
			$skill += 25;
		}

			if (!empty($user['avatar'])){
			$skill += 25;
		}
		
		if (!empty($user['descript'])){
			$skill += 25;
		}
		
		return $skill;
	}
	
	private function UserPublicityConfigMethod($userid){
		$ret = new stdClass();
		$ret->userid = $userid;
		$ret->values = array(
			"pubconftype" => 0, 
			"pubconfusers" => ""
		);
		
		$userMan = Abricos::$user->GetManager();
		$userMan->DisableRoles();
		$rows = $userMan->UserConfigList($userid, 'uprofile');
		$userMan->EnableRoles();
				
		while (($row = $this->db->fetch_array($rows))){
			$ret->values[$row['nm']] = $row['vl'];
		}
		return $ret;
	}
	
	/**
	 * Данные настройка публичности
	 */
	public function UserPublicityConfig($userid){
		if (!$this->IsPersonalEditRole($userid)){ 
			return null;
		}
		return $this->UserPublicityConfigMethod($userid);
	}
	
	public function UserPublicityConfigSave($userid, $data){
		$userid = intval($userid);
		if (!$this->IsPersonalEditRole($userid)){ 
			return null;
		}
		
		$pubtype = intval($data->pubconftype) == 1 ? 1 : 0;
		$arr = explode(",", $data->pubconfusers);
		$narr = array();
		foreach ($arr as $id){
			array_push($narr, intval($id));
		}
		$pubusers = implode(",", $narr);
		
		Abricos::$user->GetManager()->UserConfigValueSave($userid, 'uprofile', 'pubconftype', $pubtype);
		Abricos::$user->GetManager()->UserConfigValueSave($userid, 'uprofile', 'pubconfusers', $pubusers);
		
		return $this->UserPublicityConfig($userid);
	}
	
	/**
	 * Проверка возможности отправки приглашения пользователю
	 * 
	 * @param unknown_type $userid
	 */
	public function UserPublicityCheck($userid){
		if ($userid == $this->userid){ return true; }
		
		$cfg = $this->UserPublicityConfigMethod($userid);
		$v = $cfg->values;
		if ($v['pubconftype'] == 0){ // все могут отправлять ему приглашения
			return true;
		}
		
		$arr = explode(",", $v['pubconfusers']);
		foreach($arr as $id){
			if ($this->userid == $id){ 
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
	
	/*
	public function UProfile_UserFriendList(){
		if (!$this->IsViewRole()){
			return null;
		}
	
		/*
		$users = array();
		$rows = BotaskQuery::BoardUsers($this->db, $this->userid);
		while (($row = $this->db->fetch_array($rows))){
			if ($row['id']*1 == $this->userid*1){
				continue;
			}
			$users[$row['id']] = $row;
		}
	
		$o = new stdClass();
		$o->p = UserFriendPriority::MIDDLING;
		$o->users = $users;
	
		return $o;
	}
	/**/
	
	
	/**
	 * Построить список знакомых
	 */
	public function FriendListBuild($over){
		$ret = array();

		Abricos::$instance->modules->RegisterAllModule();
		$modules = Abricos::$instance->modules->GetModules();
		
		if(is_array($over) && count($over) > 0){
			$rows = UserProfileQuery::UserListById($this->db, $over);
			while (($row = $this->db->fetch_array($rows))){
				if ($row['id']*1 == $this->userid*1){
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