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

    // TODO: show user name and icon in header
    NS.WorkspaceWidget = Y.Base.create('workspaceWidget', SYS.AppWidget, [
        SYS.AppWorkspace
    ], {}, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            defaultPage: {
                value: {
                    component: 'profile',
                    widget: 'ProfileWidget'
                }
            }
        }
    });

    NS.ws = SYS.AppWorkspace.build('{C#MODNAME}', NS.WorkspaceWidget);
};