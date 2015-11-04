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

    var UID = Brick.env.user.id | 0;

    // TODO: show user name and icon in header
    NS.WorkspaceWidget = Y.Base.create('workspaceWidget', SYS.AppWidget, [
        SYS.AppWorkspace
    ], {
        onShowWorkspacePage: function(page, widget){
            var tp = this.template,
                userid = widget.get('userid');

            tp.toggleView(userid === UID, 'personalMenu');

            this.set('userid', userid);

            this.get('appInstance').user(userid, function(err, result){
                var user = err ? null : result.user;

                tp.setHTML({
                    username: user ? user.get('viewName') : ''
                });

                tp.one('avatar').set('src',
                    user ? user.get('avatarSrc24') :
                        '/modules/uprofile/images/nofoto24.gif'
                );
            }, this);
        },
        goHome: function(){
            var userid = this.get('userid') || Brick.env.user.id;
            this.go('profile.view', userid);
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            defaultPage: {
                value: {
                    component: 'profile',
                    widget: 'ProfileWidget'
                }
            },
            userid: {}
        },
        CLICKS: {
            wsHome: 'goHome'
        }
    });

    NS.ws = SYS.AppWorkspace.build('{C#MODNAME}', NS.WorkspaceWidget);
};