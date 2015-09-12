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
        initializer: function(){
            NS.roles.load(function(){
                this.initCallbackFire();
            }, this);
        }
    }, [], {
        ATTRS: {
            isLoadAppStructure: {value: true},
            Profile: {value: NS.Profile},
            profileList: {
                readOnly: true,
                getter: function(){
                    if (!this._profileList){
                        this._profileList = new NS.ProfileList({
                            appInstance: this
                        })
                    }
                    return this._profileList;
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
                args: ['userid'],
                attribute: false
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