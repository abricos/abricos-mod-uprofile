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

    public function GetViewName(){
        if ($this->firstname === "" && $this->lastname === ""){
            return $this->username;
        }
        return $this->firstname." ".$this->lastname;
    }

    public function URI(){
        return "#";
    }

    /**
     * Get Avatar Image URL
     *
     * @param int $size Avatar size values can be 180,90,45,24
     * @return string
     */
    public function GetAvatar($size){
        switch ($size){
            case 180:
            case 90:
            case 45:
            case 24:
                break;
            default:
                $size = 24;
                break;
        }
        $avatar = $this->avatar;
        if ($avatar === ""){
            return '/modules/uprofile/images/nofoto'.$size.'.gif';
        }

        return '/filemanager/i/'.$avatar.'/w_'.$size.'-h_'.$size.'/avatar.gif';
    }

    public function GetAvatar24(){
        return $this->GetAvatar(24);
    }

    public function GetAvatar45(){
        return $this->GetAvatar(45);
    }

    public function GetAvatar90(){
        return $this->GetAvatar(90);
    }

    public function GetAvatar180(){
        return $this->GetAvatar(180);
    }
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