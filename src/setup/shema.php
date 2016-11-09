<?php
/**
 * @package Abricos
 * @subpackage UProfile
 * @copyright 2009-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$updateManager = Ab_UpdateManager::$current;
$db = Abricos::$db;
$pfx = $db->prefix;

if ($updateManager->isUpdate('0.1.1')){
    Abricos::GetModule('uprofile')->permission->Install();
}

if ($updateManager->isUpdate('0.1.7')){
    $db->query_write("
        CREATE TABLE IF NOT EXISTS ".$pfx."uprofile (
            userid INT(10) UNSIGNED NOT NULL,
            
            sex TINYINT(1) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Пол',
            birthday INT(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Дата рождения',
            site VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Сайт',
            descript TEXT NOT NULL COMMENT 'О себе',

            github VARCHAR(64) NOT NULL DEFAULT '' COMMENT '',

            icq VARCHAR(16) NOT NULL DEFAULT '' COMMENT '',
            twitter VARCHAR(64) NOT NULL DEFAULT '' COMMENT '',
            facebook VARCHAR(64) NOT NULL DEFAULT '' COMMENT '',
            vk VARCHAR(64) NOT NULL DEFAULT '' COMMENT '',
            telegram VARCHAR(64) NOT NULL DEFAULT '' COMMENT '',
            ok VARCHAR(64) NOT NULL DEFAULT '' COMMENT '',
            instagram VARCHAR(64) NOT NULL DEFAULT '' COMMENT '',
            skype VARCHAR(64) NOT NULL DEFAULT '' COMMENT '',

            UNIQUE userid (userid)
        )".$charset
    );
}

if ($updateManager->isUpdate('0.1.7') && !$updateManager->isInstall()){
    $db->query_write("DROP TABLE IF EXISTS ".$pfx."upfl_field");

    $db->query_write("
		INSERT INTO ".$pfx."uprofile 
		    (userid, sex, birthday, site, descript, icq, twitter)  
		SELECT 
			userid, sex, birthday, site, IFNULL(descript, ''), icq, twitter
		FROM ".$pfx."user
	");

    $db->query_write("
      ALTER TABLE ".$pfx."user 
        DROP sex,
        DROP birthday,
        DROP site,
        DROP descript,
        DROP icq,
        DROP twitter
    ");
}