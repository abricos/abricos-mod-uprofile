/*
@version $Id: cp.js 340 2010-02-04 14:51:50Z roosit $
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[{name: 'user', files: ['cpanel.js']}]
};
Component.entryPoint = function(){
	
	/*
	if (!Brick.env.user.isRegister()){ return; }
	
	var cp = Brick.mod.user.cp;

	var menuItem = new cp.MenuItem(this.moduleName, 'myprofile');
	menuItem.icon = '/modules/user/css/images/cp_icon.gif';
	menuItem.entryComponent = 'ws';
	menuItem.entryPoint = 'Brick.mod.uprofile.API.showWSWidget';
	cp.MenuManager.add(menuItem);
	/**/
};
