var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'urating', files: ['vote.js']},
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){
    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    // TODO: show user name and icon in header
    NS.WorkspaceWidget = Y.Base.create('workspaceWidget', SYS.AppWidget, [
        SYS.AppWorkspace
    ], {
        onShowWorkspacePage: function(page, widget){
            var tp = this.template,
                userid = widget.get('userid');

            this.set('userid', userid);

            this.get('appInstance').profile(userid, function(err, result){
                var profile = err ? null : result.profile;

                tp.setHTML({
                    username: profile ? profile.get('viewName') : ''
                });

                tp.one('avatar').set('src',
                    profile ? profile.get('avatarSrc24') :
                        '/modules/uprofile/images/nofoto24.gif'
                );

                if (profile.get('voting')){
                    tp.show('voting');
                    this.votingWidget = new Brick.mod.urating.VotingWidget({
                        boundingBox: tp.one('voting'),
                        voting: profile.get('voting')
                    });
                }

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