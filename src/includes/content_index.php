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

$userid = Abricos::$user->id;

if (isset(Abricos::$adress->dir[1])){
    $userid = intval(Abricos::$adress->dir[1]);
}

$brick->content = Brick::ReplaceVarByData($brick->content, array(
    "userid" => $userid
));

?>