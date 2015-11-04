var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'notify', files: ['button.js']},
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
            this.set('waiting', true);

            var instance = this;

            NOTIFY.initApp({
                initCallback: function(err, appInstance){
                    instance._onInitNotifyApp(err, appInstance);
                }
            });
        },
        destructor: function(){
        },
        _onInitNotifyApp: function(err, notifyApp){
            this.set('waiting', false);

            var tp = this.template,
                subscribeList = notifyApp.get('subscribeBaseList');
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            userid: {
                validator: Y.Lang.isNumber,
                getter: function(val){
                    if (!val){
                        val = Brick.env.user.id|0;
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

    NS.SubscribeButtonWidget = Y.Base.create('subscribeButtonWidget', SYS.AppWidget, [
        NOTIFY.SwitcherStatusExt
    ], {

    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'subscribeButton'},
            ownerDefine: {
                value: {}
            }
        }
    });

};