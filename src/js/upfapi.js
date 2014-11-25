/*
 @package Abricos
 @copyright Copyright (C) 2011 Abricos All rights reserved.
 @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 */

var Component = new Brick.Component();
Component.entryPoint = function(NS){

    var UP = Brick.mod.uprofile;
    if (!UP || !UP.wsPageList){
        return;
    }
    var LNG = this.language;

    UP.wsPageList.add(this, {
        'id': 'account',
        'title': LNG['wstitle'],
        'request': 'account',
        'widget': 'AccountViewWidget',
        'order': 10000
    });

    UP.wsPageList.add(this, {
        'id': 'pubconf',
        'isPersonal': true,
        'title': LNG['pbconftitle'],
        'request': 'pubconf',
        'widget': 'PublicConfigWidget',
        'order': 1000
    });
};