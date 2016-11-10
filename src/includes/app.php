<?php
/**
 * @package Abricos
 * @subpackage UProfile
 * @copyright 2009-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

/**
 * Class UProfileApp
 *
 * @property UProfileManager $manager
 */
class UProfileApp extends AbricosApplication {
    protected function GetClasses(){
        return array(
            'User' => 'UProfileUser',
            'UserList' => 'UProfileUserList',
            'Profile' => 'UProfile',
            'ProfileList' => 'UProfileList',
            'ProfileSave' => 'UProfileSave'
        );
    }

    protected function GetStructures(){
        return 'User,Profile';
    }

    public function ResponseToJSON($d){
        switch ($d->do){
            case "profile":
                return $this->ProfileToJSON($d->userid);
            case "profileSave":
                return $this->ProfileSaveToJSON($d->profile);
            case "passwordSave":
                return $this->PasswordSaveToJSON($d->password);
            case "avatarRemove":
                return $this->AvatarRemoveToJSON($d->userid);
            case "friendList":
                return $this->FriendListToJSON();
            case "userSearch":
                return $this->UserSearchToJSON($d->search);
            case "user":
                return $this->UserToJSON($d->userid);
            case "userListByIds":
                return $this->UserListByIdsToJSON($d->userids);
        }
    }

    /*
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
    /**/

    public function ProfileToJSON($userid){
        $res = $this->Profile($userid);
        return $this->ResultToJSON('profile', $res);
    }

    /**
     * @param $userid
     * @return UProfile
     */
    public function Profile($userid){
        if (!$this->manager->IsViewRole()){
            return AbricosResponse::ERR_FORBIDDEN;
        }

        $d = UProfileQuery::Profile($this->db, $userid);
        if (empty($d)){
            sleep(3);
            return AbricosResponse::ERR_FORBIDDEN;
        }
        return $this->InstanceClass('Profile', $d);
    }

    public function ProfileSaveToJSON($d){
        $ret = $this->ProfileSave($d);
        if (!$ret->IsSetCode(UProfileSave::CODE_OK)){
            return $ret;
        }

        return $this->ImplodeJSON(
            $this->ProfileToJSON($ret->userid),
            $this->ResultToJSON('profileSave', $ret)
        );
    }

    public function ProfileSave($d){
        /** @var UProfileSave $ret */
        $ret = $this->InstanceClass('ProfileSave', $d);
        $vars = $ret->vars;

        if (!$this->manager->IsPersonalEditRole($vars->userid)){
            return $ret->SetError(AbricosResponse::ERR_FORBIDDEN);
        }

        UProfileQuery::ProfileUpdate($this->db, $ret);

        if ($this->manager->IsAdminRole()){
            UProfileQuery::ProfileEmailUpdate($this->db, $ret);
        }

        $ret->AddCode(UProfileSave::CODE_OK);
        $ret->userid = $vars->userid;

        return $ret;
    }

    public function PasswordSaveToJSON($d){
        $userid = intval($d->id);
        $res = $this->PasswordSave($d);
        return $this->ImplodeJSON(
            $this->ProfileToJSON($userid),
            $this->ResultToJSON('passwordSave', $res)
        );
    }

    public function PasswordSave($d){
        $userid = intval($d->id);
        if (!$this->manager->IsPersonalEditRole($userid)){
            return AbricosResponse::ERR_FORBIDDEN;
        }

        $d->currentPassword = isset($d->currentPassword) ? $d->currentPassword : "";
        $d->password = isset($d->password) ? $d->password : "";
        $d->checkPassword = isset($d->checkPassword) ? $d->checkPassword : "";

        if ($d->password !== $d->checkPassword){
            return AbricosResponse::ERR_BAD_REQUEST;
        }

        /** @var UserModule $module */
        $module = Abricos::GetModule('user');
        $isChange = $module->GetManager()->GetPasswordManager()->PasswordChange($userid, $d->currentPassword, $d->password);

        if (!$isChange){
            return AbricosResponse::ERR_BAD_REQUEST;
        }

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
            return AbricosResponse::ERR_FORBIDDEN;
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

    public function FriendListToJSON(){
        $ret = $this->FriendList();
        return $this->ResultToJSON('friendList', $ret);
    }

    public function FriendList(){
        if (isset($this->_cache['FriendList'])){
            return $this->_cache['FriendList'];
        }
        $userid = Abricos::$user->id;
        if (empty($userid)){
            return AbricosResponse::ERR_FORBIDDEN;
        }

        $modules = Abricos::$modules->RegisterAllModule();

        $friendIds = array();
        /**
         * @var string $name
         * @var Ab_Module $module
         */
        foreach ($modules as $name => $module){
            if (!method_exists($module, 'UProfile_IsFriendIds')){
                continue;
            }
            if (!$module->UProfile_IsFriendIds()){
                continue;
            }

            $app = Abricos::GetApp($name);
            if (empty($app) || !method_exists($app, 'UProfile_FriendIds')){
                continue;
            }
            $ids = $app->UProfile_FriendIds();
            if (!is_array($ids)){
                continue;
            }
            for ($i = 0; $i < count($ids); $i++){
                $friendIds[$ids[$i]] = true;
            }
        }

        $uids = array();
        foreach ($friendIds as $uid => $key){
            $uid = intval($uid);
            if ($userid === $uid){
                continue;
            }
            $uids[] = $uid;
        }

        /** @var UProfileUserList $list */
        $list = $this->InstanceClass('UserList');

        $rows = UProfileQuery::UserListById($this, $uids);
        while (($d = $this->db->fetch_array($rows))){
            $list->Add($this->InstanceClass('User', $d));
        }

        return $this->_cache['FriendList'] = $list;
    }

    public function UserSearchToJSON($d){
        $ret = $this->UserSearch($d);
        return $this->ResultToJSON('userSearch', $ret);
    }

    public function UserSearch($d){
        if (!$this->manager->IsViewRole()){
            return AbricosResponse::ERR_FORBIDDEN;
        }

        $utmf = Abricos::TextParser(true);
        $d->username = $utmf->Parser($d->username);
        $d->firstname = $utmf->Parser($d->firstname);
        $d->lastname = $utmf->Parser($d->lastname);

        $list = $this->InstanceClass('UserList');

        if (empty($d->username) && empty($d->firstname) && empty($d->lastname)){
            return $list;
        }

        $rows = UProfileQuery::UserSearch($this->db, $d);
        while (($d = $this->db->fetch_array($rows))){
            $list->Add($this->InstanceClass('User', $d));
        }
        return $list;
    }

    public function UserListByIdsToJSON($d){
        $ret = $this->UserListByIds($d);
        return $this->ResultToJSON('userListByIds', $ret);
    }

    /**
     * @param array|int $d
     * @return UProfileUserList
     */
    public function UserListByIds($d){
        if (!$this->manager->IsViewRole()){
            return AbricosResponse::ERR_FORBIDDEN;
        }

        /** @var UProfileUserList $list */
        $list = $this->InstanceClass('UserList');
        if (is_integer($d)){
            $d = array($d);
        } else if (!is_array($d)){
            return 400;
        }
        if (!isset($this->_cache['User'])){
            $this->_cache['User'] = array();
        }
        $distinct = new stdClass();
        $userids = array();
        $count = count($d);
        for ($i = 0; $i < $count; $i++){
            $userid = intval($d[$i]);

            if (isset($this->_cache['User'][$userid])){
                $list->Add($this->_cache['User'][$userid]);
            } else if (!isset($distinct->$userid)){
                $userids[] = $userid;
                $distinct->$userid = $userid;
            }
        }

        if (count($userids) === 0){
            return $list;
        }

        $rows = UProfileQuery::UserListById($this, $userids);
        while (($d = $this->db->fetch_array($rows))){
            /** @var UProfileUser $user */
            $user = $this->InstanceClass('User', $d);
            $user->email = $d['email'];
            $this->_cache['User'][$user->id] = $user;
            $list->Add($user);
        }
        return $list;
    }

    public function UserToJSON($userid){
        $ret = $this->User($userid);
        return $this->ResultToJSON('user', $ret);
    }

    /**
     * @param $userid
     * @return UProfileUser|int
     */
    public function User($userid){
        $list = $this->UserListByIds(array($userid));
        if (is_integer($list)){
            return $list;
        }
        $user = $list->Get($userid);
        if (empty($user)){
            return 404;
        }
        return $user;
    }
}
