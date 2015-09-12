<?php
/**
 * @package Abricos
 * @subpackage UProfile
 * @copyright 2009-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

require_once 'models.php';

/**
 * Class UProfile
 *
 * @property UProfileManager $manager
 */
class UProfile extends AbricosApplication {
    protected function GetClasses(){
        return array(
            'Profile' => 'UProfileItem',
            'ProfileList' => 'UProfileList'
        );
    }

    protected function GetStructures(){
        return 'Profile';
    }

    public function ResponseToJSON($d){
        switch ($d->do){
            case "profile":
                return $this->ProfileToJSON($d->userid);
            case "profileSave":
                return $this->ProfileSaveToJSON($d->profile);
            case "avatarRemove":
                return $this->AvatarRemoveToJSON($d->userid);
        }
    }

    public function IsUserRating(){
        $modURating = Abricos::GetModule('urating');
        return !empty($modURating);
    }

    public function UsersRatingCheck($isClear = false){
        if (!$this->IsUserRating()){
            return;
        }
        URatingModule::$instance->GetManager()->Calculate($isClear);
    }

    protected $_cache = array();

    public function ClearCache(){
        $this->_cache = array();
    }

    public function ProfileToJSON($userid){
        $res = $this->Profile($userid);
        return $this->ResultToJSON('profile', $res);
    }

    /**
     * @param $userid
     * @param bool|false $recalcRating
     * @return UProfileItem
     */
    public function Profile($userid, $recalcRating = false){
        if (!$this->manager->IsViewRole()){
            return 403;
        }
        $this->UsersRatingCheck($recalcRating);

        $d = UProfileQuery::Profile($this->db, $userid);
        if (empty($d)){
            sleep(3);
            return 403;
        }
        return $this->models->InstanceClass('Profile', $d);
    }

    public function FieldSetValue($varname, $value){
        $userid = Abricos::$user->id;
        if (!$this->manager->IsPersonalEditRole($userid)){
            return 403;
        }

        UProfileQuery::FieldSetValue($this->db, $userid, $varname, $value);
    }

    public function ProfileSaveToJSON($d){
        $userid = intval($d->id);
        $res = $this->ProfileSave($d);
        return $this->ImplodeJSON(
            $this->ProfileToJSON($userid),
            $this->ResultToJSON('profileSave', $res)
        );
    }

    public function ProfileSave($d){
        $userid = intval($d->id);
        if (!$this->manager->IsPersonalEditRole($userid)){
            return 403;
        }

        $utmf = Abricos::TextParser(true);
        $d->firstname = $utmf->Parser($d->firstname);
        $d->lastname = $utmf->Parser($d->lastname);
        $d->site = $utmf->Parser($d->site);
        $d->twitter = $utmf->Parser($d->twitter);
        $d->descript = $utmf->Parser($d->descript);
        $d->sex = intval($d->sex);
        $d->birthday = intval($d->birthday);

        UProfileQuery::ProfileUpdate($this->db, $userid, $d, $this->manager->IsAdminRole());

        $ret = new stdClass();
        $ret->userid = $userid;
        return $ret;
    }

    public function AvatarRemoveToJSON($userid){
        $res = $this->AvatarRemove($userid);
        return $this->ImplodeJSON(
            $this->ProfileToJSON($userid),
            $this->ResultToJSON('avatarRemove', $res)
        );
    }

    public function AvatarRemove($userid){
        if (!$this->manager->IsPersonalEditRole($userid)){
            return 403;
        }

        $profile = $this->Profile($userid);
        $ret = new stdClass();
        $ret->userid = $userid;

        $fileModule = Abricos::GetModule('filemanager');

        $avatar = $profile->avatar;

        if (empty($avatar) || empty($fileModule)){
            return $ret;
        }
        $fileManager = $fileModule->GetFileManager();

        $fileManager->FileRemove($avatar);

        UProfileQuery::FieldSetValue($this->db, $userid, 'avatar', '');

        return $ret;
    }


}

?>