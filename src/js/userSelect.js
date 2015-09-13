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

    NS.UserSelectWidget = Y.Base.create('userSelectWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            this.set('waiting', true);
            appInstance.friendList(function(err, result){
                this.set('waiting', false);
            }, this);
        },
        destructor: function(){
        },
        save: function(){
            if (this.get('waiting')){
                return;
            }
        },
        cancel: function(){
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            users: {
                validator: Y.Lang.isArray,
                value: []
            }
        },
        CLICKS: {
            save: 'save', cancel: 'cancel'
        }
    });
};