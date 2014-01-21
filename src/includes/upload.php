<?php
/**
 * @package Abricos
 * @subpackage UProfile
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

$user = Abricos::$user;

$userid = $user->id;
$db = Abricos::$db;
if (empty($userid)){ return;  }

$modFM = Abricos::GetModule('filemanager');
if (empty($modFM)){ return; }

$brick = Brick::$builder->brick;
$brick->param->var['url'] = Abricos::$adress->requestURI; 

$fmManager = $modFM->GetFileManager();

$manager = Abricos::GetModule('uprofile')->GetManager();

$p_act = Abricos::CleanGPC('p', 'act', TYPE_STR);
if ($p_act != "upload"){ return; }

// отключить проверку ролей в менеджере файлов
$fmManager->RolesDisable();
// отключить проверку свободного места в профиле пользователя
$fmManager->CheckSizeDisable();

// проверка, нет ли уже загруженного фото
$avatarid = $user->info['avatar'];
if (!empty($avatarid)){
	$fmManager->FileRemove($avatarid);
	$manager->FieldSetValue('avatar', '');
}

$upload = FileManagerModule::$instance->GetManager()->CreateUploadByVar('file0');
$upload->isOnlyImage = true;
$upload->maxImageWidth = 180;
$upload->maxImageHeight = 180;
$upload->imageConvertTo = 'gif';
$upload->ignoreUploadRole = true;
$upload->filePublicName = 'avatar.gif';

$errornum = $upload->Upload();

if ($errornum == 0){
	$manager->FieldSetValue('avatar', $upload->uploadFileHash);
}

$brick->param->var['command'] = Brick::ReplaceVarByData($brick->param->var['ok'], array(
	"uid" => intval($userid),
	"fid" => $upload->uploadFileHash
));

	
?>