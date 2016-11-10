var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['appModel.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        SYS = Brick.mod.sys,
        UID = Brick.env.user.id | 0;

    var _getterAvatar24 = function(){
            return NS.User.avatarSrc(this, 24);
        },
        _getterAvatar45 = function(){
            return NS.User.avatarSrc(this, 45);
        },
        _getterAvatar90 = function(){
            return NS.User.avatarSrc(this, 90);
        },
        _getterAvatar180 = function(){
            return NS.User.avatarSrc(this, 180);
        },
        _getterViewName = function(){
            return NS.User.viewName(this);
        },
        _getterViewNameAbbr = function(){
            return NS.User.viewName(this, true);
        },
        _getterViewURL = function(){
            return NS.User.viewURL(this);
        };

    var UserExt = function(){
    };
    UserExt.ATTRS = {
        avatarSrc24: {readOnly: true, getter: _getterAvatar24},
        avatarSrc45: {readOnly: true, getter: _getterAvatar45},
        avatarSrc90: {readOnly: true, getter: _getterAvatar90},
        avatarSrc180: {readOnly: true, getter: _getterAvatar180},
        viewName: {readOnly: true, getter: _getterViewName},
        viewNameAbbr: {readOnly: true, getter: _getterViewNameAbbr},
        viewURL: {readOnly: true, getter: _getterViewURL},
    };
    UserExt.prototype = {
        isEdit: function(){
            return NS.roles.isAdmin || (NS.roles.isWrite && this.get('id') === UID);
        }
    };
    NS.UserExt = UserExt;

    NS.User = Y.Base.create('user', SYS.AppModel, [
        NS.UserExt
    ], {
        structureName: 'User',
    });

    NS.User.avatarSrc = function(avatar, size){
        if (Y.Lang.isObject(avatar) && Y.Lang.isFunction(avatar.toJSON)){
            avatar = avatar.get('avatar');
        }
        switch (size) {
            case 180:
            case 90:
            case 45:
            case 24:
                break;
            default:
                size = 24;
                break;
        }

        var nourl = '/modules/uprofile/images/nofoto' + size + '.gif';

        if (avatar === ''){
            return nourl;
        }

        return '/filemanager/i/' + avatar + '/w_' + size + '-h_' + size + '/avatar.gif';
    };

    NS.User.viewName = function(profile, isAbbr){
        if (!Y.Lang.isObject(profile) || !Y.Lang.isFunction(profile.toJSON)){
            return '';
        }

        var unm = profile.get('username'),
            fnm = profile.get('firstname'),
            lnm = profile.get('lastname');

        if (fnm === '' && lnm === ''){
            return unm;
        }
        if (isAbbr){
            if (fnm.length > 1){
                fnm = fnm.substring(0, 1) + '.';
            }
            return lnm + ' ' + fnm;
        }

        return fnm + ' ' + lnm;
    };

    NS.User.viewURL = function(profile){
        if (!Y.Lang.isObject(profile) || !Y.Lang.isFunction(profile.toJSON)){
            return '';
        }
        return profile.appInstance.getURL('profile.view', profile.get('id'));
    };

    NS.UserList = Y.Base.create('userList', SYS.AppModelList, [], {
        appItem: NS.User,
        updateByData: function(d){
            d = Y.merge({}, d || {});

            d.username = d.username || d.unm || '';
            d.id = (d.userid || d.id) | 0;
            if (d.username === '' || d.id === 0){
                return null;
            }

            var user = this.getById(d.id);
            if (user){
                return user;
            }
            var User = this.appInstance.get('User'),
                user = new User(d, {
                    appInstance: this.appInstance
                });
            this.add(user);
            return user;
        }

    });

    NS.Profile = Y.Base.create('profile', NS.User, [
        NS.UserExt
    ], {
        structureName: 'Profile'
    }, {
        ATTRS: {
            siteURL: {
                readOnly: true,
                getter: function(){
                    var site = this.get('site');
                    return site ? 'http://' + site : '';
                }
            },
            twitterURL: {
                readOnly: true,
                getter: function(){
                    var name = this.get('twitter');
                    return name ? 'https://twitter.com/' + name : '';
                }
            },
            facebookURL: {
                readOnly: true,
                getter: function(){
                    var name = this.get('facebook');
                    return name ? 'https://www.facebook.com/' + name : '';
                }
            },
            vkURL: {
                readOnly: true,
                getter: function(){
                    var name = this.get('vk');
                    return name ? 'https://vk.com/' + name : '';
                }
            },
            okURL: {
                readOnly: true,
                getter: function(){
                    var name = this.get('ok');
                    return name ? 'https://ok.com/' + name : '';
                }
            },
            githubURL: {
                readOnly: true,
                getter: function(){
                    var name = this.get('github');
                    return name ? 'https://github.com/' + name : '';
                }
            },
            instagramURL: {
                readOnly: true,
                getter: function(){
                    var name = this.get('instagram');
                    return name ? 'https://www.instagram.com/' + name : '';
                }
            },
        }
    });

    NS.ProfileList = Y.Base.create('profileList', NS.UserList, [], {
        appItem: NS.Profile
    });
};