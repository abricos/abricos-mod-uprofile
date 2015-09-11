var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['appModel.js']},
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        SYS = Brick.mod.sys,
        UID = Brick.env.user.id | 0;

    var _getterAvatar24 = function(){
            return NS.Profile.avatarSrc(this, 24);
        },
        _getterAvatar45 = function(){
            return NS.Profile.avatarSrc(this, 45);
        },
        _getterAvatar90 = function(){
            return NS.Profile.avatarSrc(this, 90);
        },
        _getterAvatar180 = function(){
            return NS.Profile.avatarSrc(this, 180);
        },
        _getterViewName = function(){
            return NS.Profile.viewName(this);
        },
        _getterViewNameAbbr = function(){
            return NS.Profile.viewName(this, true);
        },
        _getterViewURL = function(){
            return NS.Profile.viewURL(this);
        };

    NS.Profile = Y.Base.create('profile', SYS.AppModel, [], {
        structureName: 'Profile',
        isEdit: function(){
            return NS.roles.isAdmin || (NS.roles.isWrite && this.get('id') === UID);
        }
    }, {
        ATTRS: {
            avatarSrc24: {readOnly: true, getter: _getterAvatar24},
            avatarSrc45: {readOnly: true, getter: _getterAvatar45},
            avatarSrc90: {readOnly: true, getter: _getterAvatar90},
            avatarSrc180: {readOnly: true, getter: _getterAvatar180},
            viewName: {readOnly: true, getter: _getterViewName},
            viewNameAbbr: {readOnly: true, getter: _getterViewNameAbbr},
            viewURL: {readOnly: true, getter: _getterViewURL},
        }
    });

    NS.Profile.avatarSrc = function(avatar, size){
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

    NS.Profile.viewName = function(profile, isAbbr){
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

    NS.Profile.viewURL = function(profile){
        if (!Y.Lang.isObject(profile) || !Y.Lang.isFunction(profile.toJSON)){
            return '';
        }
        return profile.appInstance.getURL('profile.view', profile.get('id'));
    };


    NS.ProfileList = Y.Base.create('profileList', SYS.AppModelList, [], {
        appItem: NS.Profile
    });
};