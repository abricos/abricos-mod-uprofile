<?php
/**
 * @package Abricos
 * @subpackage UProfile
 * @copyright 2009-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

$user = Abricos::$user;

$userid = $user->id;
if (empty($userid)){
    return;
}

$brick = Brick::$builder->brick;
$brick->param->var['url'] = Abricos::$adress->requestURI;

$p_act = Abricos::CleanGPC('p', 'act', TYPE_STR);
if ($p_act != "upload"){
    return;
}

$modFM = Abricos::GetModule('filemanager');
if (empty($modFM)){
    return;
}

$fmManager = $modFM->GetFileManager();

/** @var UProfile $uprofile */
$uprofile = Abricos::GetModule('uprofile')->GetManager()->GetUProfile();

// отключить проверку ролей в менеджере файлов
$fmManager->RolesDisable();
// отключить проверку свободного места в профиле пользователя
$fmManager->CheckSizeDisable();

$profile = $uprofile->Profile($userid);

// проверка, нет ли уже загруженного фото
$avatarid = $profile->avatar;
if (!empty($avatarid)){
    $fmManager->FileRemove($avatarid);
    $uprofile->FieldSetValue('avatar', '');
}

$upload = FileManagerModule::$instance->GetManager()->CreateUploadByVar('file0');
$upload->isOnlyImage = true;
$upload->maxImageWidth = 180;
$upload->maxImageHeight = 180;
$upload->imageConvertTo = 'gif';
$upload->ignoreUploadRole = true;
$upload->filePublicName = 'avatar.gif';

$errornum = $upload->Upload();

if ($errornum === 0){
    $uprofile->FieldSetValue('avatar', $upload->uploadFileHash);
}

$dir = Abricos::$adress->dir;

$brick->param->var['command'] = Brick::ReplaceVarByData($brick->param->var['ok'], array(
    "idWidget" => isset($dir['3']) ? $dir[3] : '',
    "uid" => intval($userid),
    "fid" => $upload->uploadFileHash
));

?>