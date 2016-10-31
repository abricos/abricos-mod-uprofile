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
            passwordSave: {
                args: ['password']
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
                    return this.get('userList').getById(userid | 0);
                },
                onResponse: function(user){
                    this._addUserToCache(user);
                    return user;
                }
            },
            userListByIds: {
                args: ['userids'],
                type: 'modelList:UserList',
                requestDataHandle: function(rData){
                    var userList = this.get('userList'),
                        orig = rData.userids,
                        userids = [],
                        cacheUsers = new NS.UserList({appInstance: this});

                    for (var i = 0, userid, user; i < orig.length; i++){
                        userid = orig[i] | 0;
                        if (userid === 0){
                            continue;
                        }
                        user = userList.getById(userid);
                        if (user){
                            cacheUsers.add(user);
                        } else {
                            userids[userids.length] = userid;
                        }
                    }
                    this._tempCacheUsers = cacheUsers;

                    rData.userids = userids;
                    return rData;
                },
                cache: function(userids){
                    var retUserList = this._tempCacheUsers;

                    if (userids.length === 0){
                        this._tempCacheUsers = null;
                        return retUserList;
                    }

                    return null;
                },
                onResponse: function(userList){
                    this._addUsersToCache(userList);

                    if (this._tempCacheUsers){
                        this._tempCacheUsers.each(function(user){
                            userList.add(user);
                        });
                    }

                    this._tempCacheUsers = null;

                    return userList;
                }
            }
        },
        URLS: {
            ws: "#app={C#MODNAMEURI}/wspace/ws/",
            profile: {
                view: function(userid){
                    return this.getURL('ws') + 'profile/ProfileWidget/' + (userid | 0) + '/';
                }
            },
            config: {
                subscribe: function(){
                    return this.getURL('ws') + 'subscribe/SubscribeConfigWidget/';
                },
                publicity: function(){
                    return this.getURL('ws') + 'publicity/PublicityConfigWidget/';
                },
            }
        }
    });
};