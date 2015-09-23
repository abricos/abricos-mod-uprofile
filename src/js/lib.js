var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['application.js']},
        {name: '{C#MODNAME}', files: ['base.js', 'model.js']}
    ]
};
Component.entryPoint = function(NS){

    var COMPONENT = this,
        SYS = Brick.mod.sys,
        UID = Brick.env.user.id;

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
            var userList = this.get('userList'),
                user,
                retUserList;

            for (var i = 0; i < userids.length; i++){
                user = userList.getById(userids[i] | 0);
                if (!user){
                    return null;
                }
                if (!retUserList){
                    retUserList = new NS.UserList({appInstance: this});
                }
                retUserList.add(user);
            }
            return retUserList;
        },
        _addUsersToCache: function(userList){
            if (!userList){
                return;
            }
            userList.each(function(user){
                this._addUserToCache(user);
            }, this);
        },
        _addUserToCache: function(user){
            if (!user){
                return;
            }
            var cacheUserList = this.get('userList'),
                userid = user.get('id');

            if (cacheUserList.getById(userid)){
                cacheUserList.removeById(userid);
            }
            cacheUserList.add(user);
        },
        initializer: function(){
            NS.roles.load(function(){
                if (UID > 0){
                    this.user(UID, function(err, result){
                        this.initCallbackFire();
                    }, this);
                } else {
                    this.initCallbackFire();
                }
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
                        this._profileList = new NS.ProfileList({appInstance: this});
                    }
                    return this._profileList;
                }
            },
            userList: {
                readOnly: true,
                getter: function(){
                    if (!this._userList){
                        this._userList = new NS.UserList({appInstance: this});
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
                type: 'modelList:UserList',
                onResponse: function(userList){
                    this._addUsersToCache(userList);
                    return userList;
                }
            },
            userSearch: {
                args: ['search'],
                type: 'modelList:UserList',
                onResponse: function(userList){
                    this._addUsersToCache(userList);
                    return userList;
                }
            },
            user: {
                args: ['userid'],
                type: 'model:User',
                cache: function(userid){
                    var userList = this._checkUsersInCache([userid]),
                        user = userList ? userList.getById(userid) : null;
                    return user;
                },
                onResponse: function(user){
                    this._addUserToCache(user);
                    return user;
                }
            },
            userListByIds: {
                args: ['userids'],
                type: 'modelList:UserList',
                cache: function(userids){
                    return this._checkUsersInCache(userids);
                },
                onResponse: function(userList){
                    this._addUsersToCache(userList);
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