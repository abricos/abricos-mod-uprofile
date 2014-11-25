/*
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 */

/**
 * @module UserProfile
 * @namespace Brick.mod.uprofile
 */

var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['container.js']},
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI;

    var buildTemplate = this.buildTemplate;

    var lz = function(num){
        var snum = num + '';
        return snum.length == 1 ? '0' + snum : snum;
    };
    var DPOINT = '.';
    var dayToString = function(d){
        if (Y.Lang.isNull(d)){
            return '';
        }
        return lz(d.getDate()) + DPOINT + lz(d.getMonth() + 1) + DPOINT + d.getFullYear();
    };

    var dateServerToClient = function(unix){
        unix = unix * 1;
        if (unix == 0){
            return null;
        }
        return new Date(unix * 1000);
    };

    var UserWidget = function(container, user){
        this.init(container, user);
    };
    UserWidget.prototype = {
        init: function(container, user){
            this.user = user;
            buildTemplate(this, 'widget,runm,rbirthday,rdescript,rlv,rdl');

            var TM = this._TM;

            var lst = TM.replace('runm', {'value': user['unm']});

            if (user['birthday'] * 1 > 0){
                lst += TM.replace('rbirthday', {'value': dayToString(dateServerToClient(user['birthday']))});
            }
            if (Y.Lang.isString(user['descript']) && user['descript'].length > 0){
                lst += TM.replace('rdescript', {'value': user['descript']});
            }
            if (user['dl'] * 1 > 0){
                lst += TM.replace('rdl', {'value': dayToString(dateServerToClient(user['dl']))});
            }
            lst += TM.replace('rlv', {
                'value': Brick.dateExt.convert(user['lv'])
            });
            container.innerHTML = this._TM.replace('widget', {
                'avt': NS.avatar.get180(user),
                'unm': NS.viewer.buildUserName(user),
                'rows': lst
            });
        }
    };
    NS.UserWidget = UserWidget;

    var UserPanel = function(user){
        this.user = user;
        UserPanel.superclass.constructor.call(this, {width: '780px'});
    };
    YAHOO.extend(UserPanel, Brick.widget.Dialog, {
        initTemplate: function(){
            buildTemplate(this, 'panel');
            return this._TM.replace('panel', {
                'unm': NS.viewer.buildUserName(this.user)
            });
        },
        onLoad: function(){
            this.widget = new UserWidget(this._TM.getEl('panel.widget'), this.user);
        }
    });
    NS.UserPanel = UserPanel;

};
