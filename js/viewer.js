/*
* @version $Id$
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module UserProfile
 * @namespace Brick.mod.uprofile
 */

var Component = new Brick.Component();
Component.requires = {
	mod:[
	     {name: 'sys', files: ['container.js']},
	     {name: 'uprofile', files: ['roles.js']}
    ]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace,
		TMG = this.template;
	
	var API = NS.API;
	
	var buildTemplate = function(w, templates){
		var TM = TMG.build(templates), T = TM.data, TId = TM.idManager;
		w._TM = TM; w._T = T; w._TId = TId;
	};

	var cnt = 0;
	var find = function(el, className, cnt){
        if (Dom.hasClass(el, className)){ return el; }
        cnt = (cnt || 0)+1;
        if (L.isNull(el) || el.parentNode == document.body || cnt > 30){
                return false;
        }
        return find(el.parentNode, className);
	};
	
	var parseid = function(el, pfx){
        pfx = L.trim(pfx.toUpperCase());
        var arr = Dom.getAttribute(el, "className").toUpperCase().split(' ');
        for (var i=0;i<arr.length;i++){
                var arr1 = L.trim(arr[i]).split('-');
                if (arr1.length == 2 && arr1[0] == pfx){
                        return arr1[1]*1; 
                }
        }
        return 0;
	};

	
	var Avatar = function(){
		this.init();
	};
	Avatar.prototype = {
		init: function(){ },
		build: function(user, size, isUrl){
			size = size || 24;
			isUrl = isUrl || false;
			var nourl = '/modules/uprofile/images/nofoto'+size+'.gif',
				nofoto = '<img src="'+nourl+'" width="'+size+'px" height="'+size+'px" />';
			
			var avatar = user['avatar'] || user['avt'] || '';
			
			if (!avatar || !L.isString(avatar) || avatar.length != 8){
				return isUrl ? nourl : nofoto;
			}
			var url = '/filemanager/i/'+avatar+'/',
				ssize = ' width="'+size+'px" height="'+size+'px"';
			
			switch(size){
			case 180: 
				ssize = ' width="180px" height="180px" ';
				break;
			case 90: case 45: case 24:  
				url += 'w_'+size+'-h_'+size+'/'; 
				break;
			default: return nofoto;
			}
			
			url += 'avatar.gif';
			return isUrl ? url : '<img src="'+url+'" '+ssize+' />';
			
		},
		get24: function(user, isUrl){ return this.build(user, 24, isUrl); },
		get45: function(user, isUrl){ return this.build(user, 45, isUrl); },
		get90: function(user, isUrl){ return this.build(user, 90, isUrl); },
		get180: function(user, isUrl){ return this.build(user, 180, isUrl);}
	};
	NS.avatar = new Avatar();
	
	var Builder = function(){
		this.init();
	};
	Builder.prototype = {
		init: function(){},
		getUserName: function(user){
			var emp = function(s){
				s = s || '';
				return s.length < 1;
			};
			var u = user,
				unm = u['username'] || u['unm'],
				fnm = u['firstname'] || u['fnm'],
				lnm = u['lastname'] || u['lnm'];

			return (emp(fnm) && emp(lnm)) ? unm : fnm + ' ' + lnm; 
		},
		getAvatar: function(user, size, template){
			var unm = this.getUserName(user),
				t = template || '<a href="#" class="show-user-profile user-{v#uid}" title="{v#unm}">{v#avatar}</a>',
				userid = user['uid'] || user['id'];
			
			return Brick.util.Template.setPropertyArray(t, {
				'uid': userid,
				'unm': unm,
				'avatar': NS.avatar.build(user, size)
			});
		},
		getLink: function(user, template){
			var unm = this.getUserName(user),
				t = template || '<a href="#" class="show-user-profile user-{v#uid}" title="{v#unm}">{v#unm}</a>',
				userid = user['uid'] || user['id'];
			
			return Brick.util.Template.setPropertyArray(t, {
				'uid': userid,
				'unm': unm
			});
			
		}
	};
	NS.builder = new Builder();
	
	var Viewer = function(){
		this.init();
	};
	Viewer.prototype = {
		init: function(){
			this.users = {};
			this.fields = null;
			var __self = this;
			E.on(document.body, 'click', function(e){
                    var el = E.getTarget(e);
                    if (__self.onClick(el)){ E.preventDefault(e); }
            });
		},
		onClick: function(el){
			var fel;
			if (fel = find(el, 'show-user-profile')){
				 var userid = parseid(fel, 'user');
				 this.showUserPanel(userid);
			}else{
				return false;
			}
			return true;
		},
		buildUserName: function(user){
			return NS.builder.getUserName(user);
		},
		showUserPanel: function(userid){
			if (this.users[userid]){
				new UserPanel(this.users[userid]);
				return;
			}
			Brick.ajax('uprofile', {
				'data': {
					'do': 'viewprofile',
					'userid': userid,
					'getfields': L.isNull(this.fields)
				},
				'event': function(request){
					var d = request.data;
					if (L.isNull(d)){ return; }
					
					if (d.fields){
						NS.viewer.fields = d.fields;
					}
					if (!d.user){ return; }
					NS.viewer.users[d.user['id']] = d.user;
					new UserPanel(d.user);
				}
			});
		}
	};
	NS.viewer = new Viewer();
	
	var lz = function(num){
		var snum = num+'';
		return snum.length == 1 ? '0'+snum : snum; 
	};
	var DPOINT = '.';
	var dayToString = function(d){
		if (L.isNull(d)){ return ''; }
		return lz(d.getDate())+DPOINT+lz(d.getMonth()+1)+DPOINT+d.getFullYear();
	};

	var dateServerToClient = function(unix){
		unix = unix * 1;
		if (unix == 0){ return null; }
		return new Date(unix*1000);
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
			
			if (user['birthday']*1>0){
				lst += TM.replace('rbirthday', {'value': dayToString(dateServerToClient(user['birthday']))});
			}
			if (L.isString(user['descript']) && user['descript'].length > 0){
				lst += TM.replace('rdescript', {'value': user['descript']});
			}
			if (user['dl']*1>0){
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
		UserPanel.superclass.constructor.call(this, {
			modal: false, fixedcenter: true, width: '780px'
		});
	};
	YAHOO.extend(UserPanel, Brick.widget.Panel, {
		initTemplate: function(){
			buildTemplate(this, 'panel');
			return  this._TM.replace('panel', {
				'unm': NS.viewer.buildUserName(this.user)
			});
		},
		onLoad: function(){
			this.widget = new UserWidget(this._TM.getEl('panel.widget'), this.user);
		}		
	});
	NS.UserPanel = UserPanel;
	
};
