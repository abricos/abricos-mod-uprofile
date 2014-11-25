/*
 @package Abricos
 @copyright Copyright (C) 2008 Abricos All rights reserved.
 @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 */

var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['container.js', 'date.js']},
        {name: 'uprofile', files: ['users.js']}
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

            this.dbconf = {
                'pubconftype': 0,
                'pubconfusers': ''
            };

            Brick.ajax('uprofile', {
                'data': {
                    'do': 'pubconf',
                    'userid': user.id
                },
                'event': function(request){
                    var rd = request.data;
                    if (!L.isNull(rd)){
                        __self.dbconf = rd['values'];
                    }
                    __self.render();
                }
            });
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
            var TM = this._TM, gel = function(n){
                return TM.getEl('widget.' + n);
            };

            Dom.setStyle(gel('gloading'), 'display', 'none');
            Dom.setStyle(gel('editform'), 'display', '');

            var cfg = this.dbconf;

            if (cfg['pubconftype'] == 1){
                gel('rd1').checked = true;
            } else {
                gel('rd0').checked = true;
            }
            this.renderStatus();

            var users = (cfg['pubconfusers'] || "").split(',');
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
            var TM = this._TM,
                gel = function(n){
                    return TM.getEl('widget.' + n);
                };

            Dom.setStyle(gel('btns'), 'display', 'none');
            Dom.setStyle(gel('bloading'), 'display', '');

            var selUsers = this.usersWidget.getSelectedUsers();

            var user = this.user;
            Brick.ajax('uprofile', {
                'data': {
                    'do': 'pubconfsave',
                    'userid': user.id,
                    'data': {
                        'pubconftype': this.getPubType(),
                        'pubconfusers': selUsers.join(',')
                    }
                },
                'event': function(request){
                    Dom.setStyle(gel('btns'), 'display', '');
                    Dom.setStyle(gel('bloading'), 'display', 'none');
                }
            });
        }
    };
    NS.PublicConfigWidget = PublicConfigWidget;

};