var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['date.js']},
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

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
                email: profile.get('email'),
                birthday: SYS.dateToString(profile.get('birthday')),
                joindate: Brick.dateExt.convert(profile.get('joindate')),
                lastvisit: Brick.dateExt.convert(profile.get('lastvisit')),
            });

            var rows = 'email,descript,site,twitter,birthday,' +
                    'joindate,lastvisit'.split(','),
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
            this.closeEditor();
            if (this.avatarWidget){
                this.avatarWidget.destroy();
                this.avatarWidget = null;
            }
        },
        closeEditor: function(){
            if (!this._editor){
                return;
            }
            this._editor.destroy();
            this._editor = null;

            var tp = this.template;
            tp.show('viewer');
        },
        renderProfile: function(){
            var tp = this.template,
                profile = this.get('profile');
            tp.toggleView(profile.isEdit(), 'buttons');
        },
        _showEditor: function(editor){
            this.closeEditor();
            var tp = this.template;

            this.set('waiting', true);
            Brick.use('uprofile', 'editor', function(){
                this.set('waiting', false);

                var options = {
                    srcNode: tp.append('editor', '<div></div>'),
                    userid: this.get('userid'),
                    CLICKS: {
                        cancel: {
                            event: this.closeEditor, context: this
                        }
                    }
                };
                if (editor === 'password'){
                    this._editor = new NS.PasswordEditorWidget(options);
                } else {
                    this._editor = new NS.ProfileEditorWidget(options);
                }
                tp.hide('viewer');
            }, this);
        },
        showProfileEditor: function(){
            this._showEditor('profile');
        },
        showPasswordEditor: function(){
            this._showEditor('password');
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
        },
        CLICKS: {
            editProfile: 'showProfileEditor',
            changePassword: 'showPasswordEditor'
        }
    });

    NS.ProfileWidget.parseURLParam = function(args){
        args = args || [];
        return {
            userid: (args[0] | 0)
        };
    };
};