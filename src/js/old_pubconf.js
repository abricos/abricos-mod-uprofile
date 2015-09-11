var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['container.js', 'date.js']},
        {name: '{C#MODNAME}', files: ['users.js']}
    ]
};
Component.entryPoint = function(NS){

    var Dom = YAHOO.util.Dom,
        E = YAHOO.util.Event,
        L = YAHOO.lang;

    var buildTemplate = this.buildTemplate;

    var PublicConfigWidget = function(container, user){
        this.init(container, user);
    };
    PublicConfigWidget.prototype = {
        init: function(container, user){
            this.user = user;
            var TM = buildTemplate(this, 'widget');

            container.innerHTML = TM.replace('widget', {
                'uid': user.id
            });

            var __self = this;
            E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){
                    E.preventDefault(e);
                }
            });

            this.userOptionList = null;

            var instance = this;
            Brick.appFunc('user', 'userOptionList', '{C#MODNAME}', function(err, res){
                instance._onLoadUserOptionList(res.userOptionList);
            });
        },
        _onLoadUserOptionList: function(userOptionList){
            this.userOptionList = userOptionList;
            this.render();
        },
        onClick: function(el){
            var tp = this._TId['widget'];
            switch (el.id) {
                case tp['rd0']:
                case tp['rd1']:
                    this.renderStatus();
                    return false;
                case tp['bsave']:
                    this.save();
                    return true;
            }
            return false;
        },
        render: function(){
            var uOptions = this.userOptionList;
            if (!uOptions){
                return;
            }

            var TM = this._TM, gel = function(n){
                return TM.getEl('widget.' + n);
            };

            Dom.setStyle(gel('gloading'), 'display', 'none');
            Dom.setStyle(gel('editform'), 'display', '');

            if (uOptions.getValue('pubconftype', 0) == 1){
                gel('rd1').checked = true;
            } else {
                gel('rd0').checked = true;
            }
            this.renderStatus();

            var users = uOptions.getValue('pubconfusers', '').split(',');
            this.usersWidget = new NS.UserSelectWidget(gel('users'), users);
        },
        getPubType: function(){
            if (this._TM.getEl('widget.rd1').checked){
                return 1;
            }
            return 0;
        },
        renderStatus: function(){
            var TM = this._TM, gel = function(nm){
                return TM.getEl('widget.' + nm);
            };
            var tp = this.getPubType();
            if (tp == 0){
                Dom.replaceClass(gel('acctp'), 'ceacctp1', 'ceacctp0');
            } else {
                Dom.replaceClass(gel('acctp'), 'ceacctp0', 'ceacctp1');
            }

        },
        save: function(){
            var uOptions = this.userOptionList;
            if (!uOptions){
                return;
            }

            var TM = this._TM,
                gel = function(n){
                    return TM.getEl('widget.' + n);
                };

            Dom.setStyle(gel('btns'), 'display', 'none');
            Dom.setStyle(gel('bloading'), 'display', '');

            var selUsers = this.usersWidget.getSelectedUsers();

            uOptions.setValue('pubconftype', this.getPubType());
            uOptions.setValue('pubconfusers', selUsers.join(','));

            var instance = this;
            Brick.appFunc('user', 'userOptionSave', '{C#MODNAME}', uOptions.getOptions('pubconftype,pubconfusers'), function(err, res){
                instance._onLoadUserOptionList(res.userOptionList);
                Dom.setStyle(gel('btns'), 'display', '');
                Dom.setStyle(gel('bloading'), 'display', 'none');
            });
        }
    };
    NS.PublicConfigWidget = PublicConfigWidget;

};