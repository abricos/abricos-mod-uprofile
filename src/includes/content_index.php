<?php
/**
 * @package Abricos
 * @subpackage UProfile
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
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