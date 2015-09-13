<?php
/**
 * @package Abricos
 * @subpackage UProfile
 * @copyright 2009-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

/**
 * Class UProfileUser
 *
 * @property string $userid
 * @property string $username
 * @property string $firstname
 * @property string $lastname
 * @property string $avatar
 * @property integer $lastvisit
 */
class UProfileUser extends AbricosModel {
    protected $_structModule = 'uprofile';
    protected $_structName = 'User';
}

/**
 * Class UProfileUserList
 */
class UProfileUserList extends AbricosModelList {
}

/**
 * Class UProfileItem
 */
class UProfileItem extends UProfileUser {
    protected $_structModule = 'uprofile';
    protected $_structName = 'Profile';
}

/**
 * Class UProfileList
 */
class UProfileList extends AbricosModelList {
}


?>