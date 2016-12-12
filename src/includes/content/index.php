<?php
/**
 * @package Abricos
 * @subpackage UProfile
 * @copyright 2009-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

$brick = Brick::$builder->brick;
$p = &$brick->param->param;
$v = &$brick->param->var;

$dir = Abricos::$adress->dir;
if (!isset($dir[1])){
    $brick->content = '';
    return;
}

$username = urldecode($dir[1]);

/** @var UProfileApp $app */
$app = Abricos::GetApp('uprofile');

$profile = $app->Profile($username, true);

if (AbricosResponse::IsError($profile)){
    return $profile;
}

$tplEditorLink = "";
if ($app->manager->IsPersonalEditRole($profile->id)){
    $tplEditorLink = $v['editorLink'];
}

$replace = array(
    "editorLink" => $tplEditorLink,
    "avatar24" => $profile->GetAvatar24(),
    "avatar180" => $profile->GetAvatar180(),
    "userURL" => $profile->URL(),
    "voting" => ""
);

$fields = $profile->ToArray();

foreach ($fields as $name => $value){
    $replace[$name] = '';

    if (!isset($v[$name.'Field']) || empty($value)){
        continue;
    }

    $replace[$name] = Brick::ReplaceVarByData($v[$name.'Field'], array(
        $name => $value,
        "birthday" => date('d.m.Y', $profile->birthday),
        "lastvisit" => date('d.m.Y H:i', $profile->lastvisit),
        "joindate" => date('d.m.Y', $profile->joindate)
    ));
}

$replace["viewName"] = $profile->GetViewName();
$replace["username"] = $profile->username;
$replace["userid"] = $profile->id;

/** @var URatingApp $uratingApp */
$uratingApp = Abricos::GetApp('urating');
if (!empty($uratingApp)){
    $replace['voting'] = Brick::ReplaceVarByData($v['voting'], array(
        "voting" => $uratingApp->VotingHTML($profile->voting)
    ));
}

$brick->content = Brick::ReplaceVarByData($brick->content, $replace);
