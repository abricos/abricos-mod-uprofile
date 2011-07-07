<?php
/**
* @version $Id$
* @package Abricos
* @copyright Copyright (C) 2011 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

$user = CMSRegistry::$instance->user;

$userid = $user->info['userid'];
$db = CMSRegistry::$instance->db;
if (empty($userid)){ return;  }

$modFM = Brick::$modules->GetModule('filemanager');
if (empty($modFM)){ return; }

$brick = Brick::$builder->brick;
$brick->param->var['url'] = Brick::$cms->adress->requestURI; 

$fmManager = $modFM->GetFileManager();

$manager = Brick::$modules->GetModule('uprofile')->GetManager();

$p_act = Brick::$cms->input->clean_gpc('p', 'act', TYPE_STR);
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

$p_file = Brick::$cms->input->clean_gpc('f', 'file0', TYPE_FILE);

$file = trim($p_file['tmp_name']);

// если картинка, ужать до размера 180x180
$upload = $fmManager->GetUploadLib($file);

if (!$upload->file_is_image){
	return;
}

if ($upload->image_src_x > 180 || $upload->image_src_y > 180){
	
	$dir = CWD."/cache";
	$upload->image_resize = true;
	$upload->image_x = 180;
	$upload->image_y = 180;
	$upload->image_ratio_fill = true;
				
	// необходимо ли конвертировать картинку
	$upload->image_convert = 'gif';
	$upload->file_new_name_body = "avatar".$userid;
	$upload->process($dir);
	
	if (!file_exists($upload->file_dst_pathname)){ 
		return; 
	}
	$file = $upload->file_dst_pathname;
}

// загрузка фото в обход установленных ролей менеджера файлов
$folderId = CMSQFileManager::FolderAdd($db, 0, $userid, 'avatar');
$errornum = $fmManager->UploadFile($folderId, $file, 
		'avatar.gif', 'gif', filesize($file), $atrribute = 0, 
		true, true, true);
if ($errornum == 0){
	$fh = $fmManager->lastUploadFileHash;
	$manager->FieldSetValue('avatar', $fmManager->lastUploadFileHash);
}
unlink($file);

$brick->param->var['command'] = Brick::ReplaceVarByData($brick->param->var['ok'], array(
	"uid" => intval($userid),
	"fid" => $fmManager->lastUploadFileHash
));

	
?>