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
	     {name: 'sys', files: ['item.js']},
	     {name: 'uprofile', files: ['roles.js']}
    ]
};
Component.entryPoint = function(NS){
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var SYS = Brick.mod.sys;
	
	Brick.util.CSS.update(Brick.util.CSS['{C#MODNAME}']['{C#COMNAME}']);
	delete Brick.util.CSS['{C#MODNAME}']['{C#COMNAME}'];

	NS.lif = function(f){return L.isFunction(f) ? f : function(){}; };
	NS.life = function(f, p1, p2, p3, p4, p5, p6, p7){ 
		f = NS.lif(f); f(p1, p2, p3, p4, p5, p6, p7);
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
			ssize = '';
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
		getUserName: function(user, socr){
			socr = socr || false;
			var emp = function(s){
				s = s || '';
				return s.length < 1;
			};
			var u = user,
				unm = u['username'] || u['unm'],
				fnm = u['firstname'] || u['fnm'],
				lnm = u['lastname'] || u['lnm'];
			
			if (emp(fnm) && emp(lnm)){ return unm; }
			if (socr){
				if (fnm.length > 1){
					fnm = fnm.substring(0, 1) + '.';
				}
				return lnm + ' ' + fnm;
			}
			
			fnm = fnm || '';
			lnm = lnm || '';
			
			return fnm + ' ' + lnm; 
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

	var User = function(d){
		d = L.merge({
			'unm': '', 
			'fnm': '', 
			'lnm': '', 
			'eml': '', 
			'avt': '',	// аватар
			
			'rep': 0,	// репутация
			'repcnt': 0,// кол-во голосов за репутацию
			'repmy': null, // отношение к пользователю: null, 1, -1, 0
			'rgt': 0,	// рейтинг (сила)
			
			'bd': 0,	// дата рождения
			'dsc': '',	// описание
			'sex': 0,	// пол
			'site': '', // сайт
			'twt': '',	// твиттер
			'lv': 0,	// время последнего посещения
			'dl': 0		// дата регистрации
		}, d || {});
		User.superclass.constructor.call(this, d);
	};
	YAHOO.extend(User, SYS.Item, {
		update: function(d){
			this.userName		= d['unm'];
			this.email			= d['eml'];
			this.firstName		= d['fnm'];
			this.lastName		= d['lnm'];
			this.avatar			= d['avt'];
			
			this.reputation		= d['rep'];
			this.repVoteCount	= d['repcnt'];
			this.rating			= d['rtg'];

			// отношение к этому пользователю
			// null -нет отношения, 1 - ЗА, -1 -ПРОТИВ, 0 - нейтрально 
			this.repMyVote		= d['repmy'];
			
			this.birthDay		= d['bd']*1;
			this.descript		= L.isNull(d['dsc']) ? '' : d['dsc'];
			this.sex			= d['sex'];
			this.site			= d['site'];
			this.twitter		= d['twt'];
			this.lastVisit		= d['lv'];
			this.joinDate		= d['dl'];
		},
		getData: function(){
			return {
				'id': this.id,
				'unm': this.userName,
				'fnm': this.firstName,
				'lnm': this.lastName,
				'avt': this.avatar
			};
		},
		getUserName: function(socr){
			return NS.builder.getUserName(this.getData(), socr);
		},
		avatar24: function(isUrl){ return NS.avatar.get24(this.getData(), isUrl); },
		avatar45: function(isUrl){ return NS.avatar.get45(this.getData(), isUrl); },
		avatar90: function(isUrl){ return NS.avatar.get90(this.getData(), isUrl); },
		avatar180: function(isUrl){ return NS.avatar.get180(this.getData(), isUrl); }
	});
	NS.User = User;
	
	var UserList = function(d){
		UserList.superclass.constructor.call(this, d, User);
	};
	YAHOO.extend(UserList, SYS.ItemList, {});
	NS.UserList = UserList;
	
	
	var cnt = 0, find = function(el, className, cnt){
        if (Dom.hasClass(el, className)){ return el; }
        cnt=(cnt||0)+1;
        if (L.isNull(el) || el.parentNode == document.body || cnt > 10){
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

	var Viewer = function(){ this.init(); };
	Viewer.prototype = {
		init: function(){
			this.users = new UserList();
			this.userChangedEvent = new YAHOO.util.CustomEvent("userChangedEvent");
			
			var __self = this;
			E.on(document.body, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){ E.preventDefault(e); }
            });
			
			var user = Brick.env.user;
			this.users.update([{
				'id': user.id,
				'unm': user.name,
				'fnm': user.firstname,
				'lnm': user.lastname
			}]);
		},
		onClick: function(el){
			var fel;
			if (fel = find(el, 'show-user-profile')){
				 this.showUserPanel(parseid(fel, 'user'));
			}else{
				return false;
			}
			return true;
		},
		showUserPanel: function(userid){
			var nsBos = Brick.mod.bos;
			if (nsBos && 
					nsBos.PageManagerWidget &&
					!L.isNull(nsBos.PageManagerWidget.instance)){
				window.location.href = "#app=uprofile/ws/showws/"+userid+"/";
			}else if (Brick.componentExists('uprofile', 'lib')){
				window.location.href = "/uprofile/#app=uprofile/ws/showws/"+userid+"/";
			}
		},
		loadUser: function(userid, callback, fromCache){
			callback = L.isFunction(callback)?callback:function(){};
			var users = this.users,
				user = this.users.get(userid);
			
			if (!L.isNull(user) && fromCache){
				callback(user);
				return;
			}
			
			Brick.ajax('uprofile', {
				'data': {
					'do': 'viewprofile',
					'userid': userid
				},
				'event': function(request){
					var d = request.data;
					if (L.isNull(d)){
						user = null;
					}else{
						user = users.get(d['id']);
						if (L.isNull(user)){
							user = new User(d);
							users.add(user);
						}else{
							user.update(d);
						}
					}
					callback(user);
				}
			});
		},
		onUserChanged: function(user){
			this.userChangedEvent.fire(user);
		},
		buildUserName: function(d, socr){
			return NS.builder.getUserName(d, socr);
		}
	};
	NS.viewer = new Viewer();

	NS.API.showUserProfile = function(userid){
		NS.view.showUserPanel(userid);
	};
	
};
