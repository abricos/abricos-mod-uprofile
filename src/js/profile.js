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

    NS.AvatarWidget = Y.Base.create('avatarWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            this._idWidget = NS.AvatarWidget._counter++;
            NS.AvatarWidget._activeWidgets[this._idWidget] = this;

            this.set('waiting', true);

            if (this.get('userid') === 0){
                this.set('userid', Brick.env.user.id);
            }
            var userid = this.get('userid');
            appInstance.profile(userid, function(err, result){
                this.renderAvatar();
            }, this);
        },
        destructor: function(){
            delete NS.AvatarWidget._activeWidgets[this._idWidget];
        },
        renderAvatar: function(){
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

    NS.ProfileWidget = Y.Base.create('profileWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            this.set('waiting', true);

            if (this.get('userid') === 0){
                this.set('userid', Brick.env.user.id);
            }
            var userid = this.get('userid');

            appInstance.profile(userid, function(err, result){
                if (!err){
                    this.set('profile', result.profile);
                }
                this.onLoadProfile();
            }, this);
        },
        destructor: function(){
            if (this.avatarWidget){
                this.avatarWidget.destroy();
                this.avatarWidget = null;
            }
        },
        onLoadProfile: function(){
            var tp = this.template;
            this.avatarWidget = new NS.AvatarWidget({
                srcNode: tp.one('avatar'),
                userid: this.get('userid')
            });

        },
        renderProfile: function(){
            var profile = this.get('profile');
            if (!profile){
                return;
            }

            console.log(profile.toJSON());
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            profile: {},
            userid: {
                validator: Y.Lang.isNumber
            }
        }
    });

    NS.ProfileWidget.parseURLParam = function(args){
        args = args || [];
        return {
            userid: (args[0] | 0)
        };
    };
};