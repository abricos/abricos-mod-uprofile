<?php
/**
 * @package Abricos
 * @subpackage UProfile
 * @copyright 2009-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */



/**
 * Class UserItem
 * @property string $avatar
 */
class UProfileItem extends AbricosModel {
    protected $_structModule = 'uprofile';
    protected $_structName = 'Profile';
}

/**
 * Class UserList
 */
class UProfileList extends AbricosModelList {
}

?>