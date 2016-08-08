var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['userSelect.js', 'lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.PublicityConfigWidget = Y.Base.create('PublicityConfigWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            this.set('waiting', true);

            Brick.app('user', function(err, userApp){
                this.set('userApp', userApp);
                userApp.userOptionList('{C#MODNAME}', this._onLoadUserOptionList, this);
            }, this);
        },
        destructor: function(){
            if (this.usersWidget){
                this.usersWidget.destroy();
            }
        },
        _onLoadUserOptionList: function(err, result){
            this.set('waiting', false);
            if (err){
                return;
            }

            var tp = this.template,
                userOptionList = result.userOptionList,
                type = userOptionList.getValue('pubconftype', 0),
                users = userOptionList.getValue('pubconfusers', '').split(',');

            this.set('userOptionList', userOptionList);
            this.setType(type);

            this.usersWidget = new Brick.mod.uprofile.UserSelectWidget({
                srcNode: tp.one('usersWidget'),
                users: users,
                useFriends: true,
                hideCurrent: true
            });
        },
        setType: function(type){
            type = type | 0;
            var tp = this.template;
            tp.gel('rd' + type).checked = true;

            tp.toggleView(type !== 0, 'usersPanel');
            this._pubconftype = type;
        },
        save: function(){
            var uOptions = this.get('userOptionList');

            if (!uOptions){
                return;
            }

            this.set('waiting', true);

            uOptions.setValue('pubconftype', this._pubconftype);
            uOptions.setValue('pubconfusers', this.usersWidget.toJSON().join(','));

            var data = uOptions.getOptions('pubconftype,pubconfusers');

            this.get('userApp').userOptionSave('{C#MODNAME}', data, function(err, res){
                this.set('waiting', false);
            }, this);

        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            userApp: {},
            userOptionList: {},
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
        CLICKS: {
            changeType: {
                event: function(e){
                    var id = e.defineTarget.getData('id');
                    this.setType(id);
                }
            },
            save: 'save'
        },
        parseURLParam: function(args){
            args = args || [];
            return {
                userid: (args[0] | 0)
            };
        }
    });


};