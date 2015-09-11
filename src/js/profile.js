var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    var ProfileWidgetExt = function(){
    };
    ProfileWidgetExt.prototype = {
        onInitAppWidget: function(err, appInstance){
            if (this.get('userid') === 0){
                this.set('userid', Brick.env.user.id);
            }
            var userid = this.get('userid');

            this.set('waiting', true);
            appInstance.profile(userid, function(err, result){
                this.set('waiting', false);
                this.onInitProfileWidget(err, appInstance);
                if (result.profile){
                    this.renderProfile();
                }
            }, this);
        },
        onInitProfileWidget: function(){
        },
        renderProfile: function(){
        }
    };
    ProfileWidgetExt.NAME = 'profileWidgetExt';
    ProfileWidgetExt.ATTRS = {
        profile: {
            readOnly: true,
            getter: function(){
                var app = this.get('appInstance');
                if (!app){
                    return null;
                }
                return app.get('profileList').getById(this.get('userid'));
            }
        },
        userid: {
            validator: Y.Lang.isNumber
        },
    };
    NS.ProfileWidgetExt = ProfileWidgetExt;

    NS.AvatarWidget = Y.Base.create('avatarWidget', SYS.AppWidget, [
        NS.ProfileWidgetExt
    ], {
        onInitProfileWidget: function(err, appInstance){
            this._idWidget = NS.AvatarWidget._counter++;
            NS.AvatarWidget._activeWidgets[this._idWidget] = this;
        },
        destructor: function(){
            delete NS.AvatarWidget._activeWidgets[this._idWidget];
        },
        renderProfile: function(){
            this.set('waiting', false);
            var profile = this.get('profile');
            if (!profile){
                return;
            }
            var tp = this.template;
            tp.one('avatarSrc').set('src', profile.get('avatarSrc' + this.get('avatarSize')));

            tp.toggleView(profile.isEdit(), 'buttons');
            tp.toggleView(profile.get('avatar') !== '', 'btnRemove,btnUpload', 'btnUploadNew');
        },
        upload: function(){
            var userid = this.get('userid'),
                idWidget = this._idWidget,
                url = '/uprofile/upload/' + userid + '/' + idWidget + '/';

            this.uploadWindow = window.open(
                url, 'catalogimage',
                'statusbar=no,menubar=no,toolbar=no,scrollbars=yes,resizable=yes,width=480,height=270'
            );
        },
        setAvatar: function(avatar){
            this.get('profile').set('avatar', avatar);
            this.renderAvatar();
        },
        remove: function(){
            var profile = this.get('profile');
            if (this.get('waiting')){
                return;
            }
            this.set('waiting', true);
            this.get('appInstance').avatarRemove(profile.get('id'), function(){
                this.set('waiting', false);
                this.renderAvatar();
            }, this);
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'avatar'},
            avatarSize: {
                value: 180
            }
        },
        CLICKS: {
            upload: 'upload',
            remove: 'remove'
        }
    });

    NS.AvatarWidget._counter = 1;
    NS.AvatarWidget._activeWidgets = {};
    NS.AvatarWidget._setAvatar = function(idWidget, avatar){
        var w = NS.AvatarWidget._activeWidgets[idWidget];
        if (!w){
            return;
        }
        w.setAvatar(avatar);
    };

    NS.InfoWidget = Y.Base.create('infoWidget', SYS.AppWidget, [
        NS.ProfileWidgetExt
    ], {
        onInitProfileWidget: function(err, appInstance){
        },
        destructor: function(){
        },
        renderProfile: function(){
            var tp = this.template,
                profile = this.get('profile');

            tp.setHTML({
                username: profile.get('username'),
                email: profile.get('email')
            });

            var rows = 'email'.split(','),
                name, value;

            for (var i = 0; i < rows.length; i++){
                name = rows[i];
                value = profile.get(name);
                tp.toggleView(!!value, name + 'Row');
            }
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'info'},
        }
    });

    NS.ProfileWidget = Y.Base.create('profileWidget', SYS.AppWidget, [
        NS.ProfileWidgetExt
    ], {
        onInitProfileWidget: function(){
            var tp = this.template,
                userid = this.get('userid');

            this.avatarWidget = new NS.AvatarWidget({
                srcNode: tp.one('avatar'),
                userid: userid
            });
            this.infoWidget = new NS.InfoWidget({
                srcNode: tp.one('info'),
                userid: userid
            });
        },
        destructor: function(){
            if (this.avatarWidget){
                this.avatarWidget.destroy();
                this.avatarWidget = null;
            }
        },
        renderProfile: function(){
            var profile = this.get('profile');

            console.log(profile.toJSON());
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
        }
    });

    NS.ProfileWidget.parseURLParam = function(args){
        args = args || [];
        return {
            userid: (args[0] | 0)
        };
    };
};