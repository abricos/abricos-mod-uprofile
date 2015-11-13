var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'notify', files: ['profileConfig.js']},
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    var NOTIFY = Brick.mod.notify;

    NS.SubscribeConfigWidget = Y.Base.create('subscribeWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            var tp = this.template;

            this.profileConfigWidget = new NOTIFY.ProfileConfigWidget({
                srcNode: tp.one('notifyConfig')
            });
        },
        destructor: function(){
            if (this.profileConfigWidget){
                this.profileConfigWidget.destroy();
                this.profileConfigWidget = null;
            }
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            userid: {
                validator: Y.Lang.isNumber,
                getter: function(val){
                    if (!val){
                        val = Brick.env.user.id | 0;
                    }
                    return val;
                }
            },
        },
        CLICKS: {},
        parseURLParam: function(args){
            args = args || [];
            return {
                userid: (args[0] | 0)
            };
        }
    });


};