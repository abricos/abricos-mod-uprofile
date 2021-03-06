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

    public function ProfileToJSON($userid, $isUserName = false){
        $res = $this->Profile($userid, $isUserName);
        return $this->ResultToJSON('profile', $res);
    }

    /**
     * @param $userid
     * @return UProfile
     */
    public function Profile($userid, $isUserName = false){
        if (!$this->manager->IsViewRole()){
            return AbricosResponse::ERR_FORBIDDEN;
        }

        if ($isUserName){
            $d = UProfileQuery::ProfileByUserName($this->db, $userid);
        } else {
            $d = UProfileQuery::Profile($this->db, $userid);
        }

        if (empty($d)){
            sleep(3);
            return AbricosResponse::ERR_FORBIDDEN;
        }

        /** @var UProfile $profile */
        $profile = $this->InstanceClass('Profile', $d);

        /** @var URatingApp $uratingApp */
        $uratingApp = Abricos::GetApp('urating');
        if (!empty($uratingApp)){
            $profile->voting = $uratingApp->Voting('uprofile', 'user', $profile->id);
            $profile->voting->userid = $profile->id;
        }

        return $profile;
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

        UProfileQuery::ProfileSave($this->db, $ret);

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

        UProfileQuery::ProfileAvatarUpdate($this->db, $userid, '');

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

    /* * * * * * * * * * * * * * * * * * * * * * * * * * */
    /*                        User                       */
    /* * * * * * * * * * * * * * * * * * * * * * * * * * */

    private $_userPreload = array();
    private $_userPreloadMap = array();

    public function UserAddToPreload($userid){
        $userid = intval($userid);
        if ($userid === 0){
            return;
        }

        if (isset($this->_userPreloadMap[$userid])){
            return;
        }

        $this->_userPreload[] = $userid;
        $this->_userPreloadMap[$userid] = true;
    }

    private function UserPreloadClean(){
        $this->_userPreload = array();
        $this->_userPreloadMap = array();
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
            return AbricosResponse::ERR_BAD_REQUEST;
        }

        $distinct = new stdClass();
        $userids = array();
        $count = count($d);
        for ($i = 0; $i < $count; $i++){
            $userid = intval($d[$i]);

            if ($this->CacheExists('User', $userid)){
                $list->Add($this->Cache('User', $userid));
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
            $this->SetCache('User', $user->id, $user);
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
        $userid = intval($userid);
        if ($this->CacheExists('User', $userid)){
            return $this->Cache('User', $userid);
        }

        if (count($this->_userPreload) > 0){
            $this->UserAddToPreload($userid);

            $userids = $this->_userPreload;
            $this->UserPreloadClean();
            $list = $this->UserListByIds($userids);
            return $list->Get($userid);
        }

        $d = UProfileQuery::User($this, $userid);
        if (empty($d)){
            return AbricosResponse::ERR_NOT_FOUND;
        }

        /** @var UProfileUser $user */
        $user = $this->InstanceClass('User', $d);
        $user->email = $d['email'];
        $this->SetCache('User', $user->id, $user);

        return $user;
    }

    /* * * * * * * * * * * * * * * * * * * * * * * * * * */
    /*                        URating                    */
    /* * * * * * * * * * * * * * * * * * * * * * * * * * */

    /**
     * @param URatingOwner $owner
     * @param URatingVoting $voting
     * @return bool
     */
    public function URating_IsToVote($owner, $voting){
        return true;
    }

}
