<?php
/**
 * @package Abricos
 * @subpackage UProfile
 * @copyright 2009-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

/** @var UProfileApp $app */
$app = Abricos::GetApp('uprofile');

if (!$app->manager->IsWriteRole()){
    return;
}

$brick = Brick::$builder->brick;
$v = &$brick->param->var;
$v['url'] = Abricos::$adress->requestURI;

$p_act = Abricos::CleanGPC('p', 'act', TYPE_STR);
if ($p_act != "upload"){
    return;
}

$modFM = Abricos::GetModule('filemanager');
if (empty($modFM)){
    return;
}

/** @var FileManager $fmManager */
$fmManager = $modFM->GetFileManager();

// отключить проверку ролей в менеджере файлов
$fmManager->RolesDisable();
// отключить проверку свободного места в профиле пользователя
$fmManager->CheckSizeDisable();

$profile = $app->Profile(Abricos::$user->id);

// проверка, нет ли уже загруженного фото
$avatarid = $profile->avatar;
if (!empty($avatarid)){
    $fmManager->FileRemove($avatarid);
    $app->FieldSetValue('avatar', '');
}

$upload = FileManagerModule::$instance->GetManager()->CreateUploadByVar('file0');
$upload->isOnlyImage = true;
$upload->maxImageWidth = 180;
$upload->maxImageHeight = 180;
$upload->imageConvertTo = 'gif';
$upload->ignoreUploadRole = true;
$upload->filePublicName = 'avatar.gif';

$error = $upload->Upload();

if ($error === 0){
    $app->FieldSetValue('avatar', $upload->uploadFileHash);
}

$dir = Abricos::$adress->dir;

$v['command'] = Brick::ReplaceVarByData($v['ok'], array(
    "idWidget" => isset($dir['3']) ? $dir[3] : '',
    "uid" => intval(Abricos::$user->id),
    "fid" => $upload->uploadFileHash
));
