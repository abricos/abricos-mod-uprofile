var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['application.js']},
        {name: '{C#MODNAME}', files: ['base.js', 'model.js']}
    ]
};
Component.entryPoint = function(NS){

    var COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.roles = new Brick.AppRoles('{C#MODNAME}', {
        isAdmin: 50,
        isWrite: 30,
        isView: 10
    });

    SYS.Application.build(COMPONENT, {}, {
        _checkUsersInCache: function(userids){
            if (!Y.Lang.isArray(userids)){
                userids = [userids];
            }
            var userList = this.get('userList');
            for (var i = 0; i < userids.length; i++){
                if (!userList.getById(userids[i] | 0)){
                    return false;
                }
            }
            return true;
        },
        _setUsersToCache: function(userList){
            if (!userList){
                return;
            }
            var cacheUserList = this.get('userList');
            userList.each(function(user){

                var userid = user.get('id');

                if (cacheUserList.getById(userid)){
                    cacheUserList.removeById(userid);
                }
                cacheUserList.add(user);
            }, this);
        },
        initializer: function(){
            NS.roles.load(function(){
                this.initCallbackFire();
            }, this);
        }
    }, [], {
        ATTRS: {
            isLoadAppStructure: {value: true},
            User: {value: NS.User},
            UserList: {value: NS.UserList},
            Profile: {value: NS.Profile},
            profileList: {
                readOnly: true,
                getter: function(){
                    if (!this._profileList){
                        this._profileList = new NS.ProfileList({appInstance: this})
                    }
                    return this._profileList;
                }
            },
            userList: {
                readOnly: true,
                getter: function(){
                    if (!this._userList){
                        this._userList = new NS.UserList({appInstance: this})
                    }
                    return this._userList;
                }
            }
        },
        REQS: {
            profile: {
                args: ['userid'],
                attribute: false,
                type: 'model:Profile',
                cache: function(userid){
                    return this.get('profileList').getById(userid);
                },
                onResponse: function(profile){
                    if (!profile){
                        return;
                    }
                    var userid = profile.get('id'),
                        profileList = this.get('profileList');

                    if (profileList.getById(userid)){
                        profileList.removeById(userid);
                    }
                    profileList.add(profile);
                    return profile;
                }
            },
            profileSave: {
                args: ['profile']
            },
            avatarRemove: {
                args: ['userid']
            },
            friendList: {
                attribute: true,
                type: 'modelList:UserList'
            },
            userSearch: {
                args: ['search'],
                type: 'modelList:UserList'
            },
            userListByIds: {
                args: ['userids'],
                type: 'modelList:UserList',
                cache: function(userids){
                    return this._checkUsersInCache(userids);
                },
                onResponse: function(userList){
                    this._setUsersToCache(userList);
                    return userList;
                }
            }
        },
        URLS: {
            ws: "#app={C#MODNAMEURI}/wspace/ws/",
            profile: {
                view: function(userid){
                    return this.getURL('ws') + 'profile/ProfileWidget/' + (userid | 0) + '/'
                }
            }
        }
    });
};