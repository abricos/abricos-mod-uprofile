<?php 
/**
 * @package Abricos
 * @subpackage UProfile
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

UserModule::$instance->GetManager();

class UserProfile extends UserItem {
    public $patronymic;
    public $sex;
    public $birthday;
    public $descript;
    public $site;
    public $icq;
    public $avatar;
    public $twitter;

    public function __construct(UserItem $user) {
        $d = $user->_data;
        parent::__construct($d);

        $this->patronymic = strval($d['patronymic']);
        $this->sex = intval($d['sex']);
        $this->birthday = intval($d['birthday']);
        $this->descript = strval($d['descript']);
        $this->site = strval($d['site']);
        $this->icq = strval($d['icq']);
        $this->avatar = $d['avatar'];
        $this->twitter = strval($d['twitter']);
    }

}


/**
 * Приложение для профиля пользователя
 */
class UProfileAppInfo extends AbricosItem {
	
	private static $idCounter = 1;
	
	/**
	 * Имя модуля
	 * @var string
	 */
	public $moduleName;
	
	/**
	 * Имя приложения
	 * @var string
	 */
	public $name;
	
	/**
	 * Имя виджета
	 * @var string
	 */
	public $widget;
	
	/**
	 * Название приложения
	 * @var string
	 */
	public $title;
	
	public function __construct($modName, $name = '', $widget = '', $title = ''){
		$this->id = UProfileAppInfo::$idCounter++;
		
		if (is_array($modName)){
			$a = $modName;
			$modName = $a['modName'];
			$name = $a['name'];
			$widget = $a['widget'];
			$title = $a['title'];
		}
		
		$this->moduleName = $modName;
		
		if (empty($name)){ $name = $modName; }
		$this->name = $name;
		
		if (empty($widget)){ $widget = $modName; }
		$this->widget = $widget;
		
		$this->title = strval($title);
	}
	
	public function ToAJAX(){
		$ret = parent::ToAJAX();
		$ret->mnm = $this->moduleName;
		$ret->nm = $this->name;
		$ret->w = $this->widget;
		$ret->tl = $this->title;
		return $ret;
	}
}

class UProfileAppInfoList extends AbricosList { }

class UProfileInitData {
	
	/**
	 * Приложения для профиля пользователя
	 * @var UProfileAppInfoList
	 */
	public $appList;
	
	/**
	 * Типы сообществ
	 * @var UProfileTypeInfoList
	 */
	public $typeList;
	
	public function __construct($userid){

		$this->appList = new UProfileAppInfoList();
		
		// зарегистрировать все модули
		$modules = Abricos::$modules->RegisterAllModule();
		
		foreach ($modules as $name => $module){
			if (!method_exists($module, 'UProfile_GetAppInfo')){
				continue;
			}
			$appInfo = $module->UProfile_GetAppInfo($userid);
			$this->RegApp($appInfo);
		}
	}
	
	public function RegApp($appInfo){
		if (is_array($appInfo)){
			foreach($appInfo as $item){
				$this->RegApp($item);
			}
		}else if ($appInfo instanceof UProfileAppInfo){
			$this->appList->Add($appInfo);
		}
	}

	
	public function ToAJAX(){
		$ret = new stdClass();
		
		$apps = $this->appList->ToAJAX();
		$ret->apps = $apps->list;
		
		return $ret;
	}
}

?>