<?php
/**
 * Схема таблиц данного модуля.
 *
 * @package Abricos
 * @subpackage UProfile
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author  Alexander Kuzmin <roosit@abricos.org>
 */

$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$updateManager = Ab_UpdateManager::$current;
$db = Abricos::$db;
$pfx = $db->prefix;

$uprofileManager = $updateManager->module->GetManager();

if ($updateManager->isInstall()) {

    // дополнительные поля в таблице пользователей (описание этих полей)
    $db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."upfl_field (
		  `fieldid` int(10) unsigned NOT NULL auto_increment,
		  `fieldname` varchar(250) NOT NULL DEFAULT '' COMMENT 'Имя поля',
		  `fieldtype` int(2) unsigned NOT NULL DEFAULT 0 COMMENT 'Тип поля',
		  `fieldaccess` int(2) unsigned NOT NULL DEFAULT 0 COMMENT 'Уровень доступа к полю',
		  `options` TEXT COMMENT 'Опции',
		  `title` varchar(250) NOT NULL DEFAULT '' COMMENT 'Заголовок',
		  `ord` int(3) unsigned NOT NULL DEFAULT 0 COMMENT 'Сортировка',
		  PRIMARY KEY  (`fieldid`),
		  UNIQUE `fieldname` (`fieldname`)
		)".$charset
    );
    // TODO: необходимо создать таблицу для персональной настройки дополнительных полей учетной записи пользователя

    $uprofileManager->FieldAppend('lastname', 'Фамилия', UserFieldType::STRING, 100);
    $uprofileManager->FieldAppend('firstname', 'Имя', UserFieldType::STRING, 100);
    $uprofileManager->FieldAppend('patronymic', 'Отчество', UserFieldType::STRING, 100);
    $uprofileManager->FieldAppend('sex', 'Пол', UserFieldType::ENUM, 1, array("options" => "мужской|женский"));
    $uprofileManager->FieldAppend('birthday', 'Дата рождения', UserFieldType::DATETIME);
    $uprofileManager->FieldAppend('descript', 'О себе', UserFieldType::TEXT);
    $uprofileManager->FieldAppend('site', 'Сайт', UserFieldType::STRING, 100);
    $uprofileManager->FieldAppend('icq', 'ICQ', UserFieldType::STRING, 10);
    $uprofileManager->FieldCacheClear();
}

if ($updateManager->isUpdate('0.1.1')) {
    Abricos::GetModule('uprofile')->permission->Install();
}

if ($updateManager->isUpdate('0.1.1.2') && !$updateManager->isInstall()) {
    $db->query_write("ALTER TABLE `".$pfx."upfl_field` CHANGE `enumvalue` `options` TEXT DEFAULT '' COMMENT 'Опции'");
}

if ($updateManager->isUpdate('0.1.1.3')) {
    $uprofileManager->FieldAppend('avatar', 'avatar', UserFieldType::STRING, 8, array("access" => UserFieldAccess::SYSTEM));
    $uprofileManager->FieldCacheClear();
}

if ($updateManager->isUpdate('0.1.4.1')) {
    $uprofileManager->FieldAppend('twitter', 'Twitter', UserFieldType::STRING, 50);
    $uprofileManager->FieldCacheClear();
}


?>