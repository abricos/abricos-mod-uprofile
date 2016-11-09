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

// $app->User()

print_r($username);
exit;

/*

$brick->content = Brick::ReplaceVarByData($brick->content, array(
    "userid" => $userid
));

/**/