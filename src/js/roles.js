/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[{name: 'user', files: ['permission.js']}]
};
Component.entryPoint = function(){
	
	var NS = this.namespace,
		BP = Brick.Permission;

	var load = false;

	NS.roles = {
		load: function(callback){
			BP.load(function(){
				NS.roles['isAdmin'] = BP.check('uprofile', '50') == 1;
				NS.roles['isWrite'] = BP.check('uprofile', '30') == 1;
				NS.roles['isView'] = BP.check('uprofile', '10') == 1;
				callback();
			});
		}
	};

};