/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
        {name: 'sys', files: ['container.js']},
        {name: 'uprofile', files: ['viewer.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace, 
		TMG = this.template,
		API = NS.API;
	
	Brick.util.CSS.update(Brick.util.CSS['uprofile']['users']);	

	var buildTemplate = function(w, templates){
		var TM = TMG.build(templates), T = TM.data, TId = TM.idManager;
		w._TM = TM; w._T = T; w._TId = TId;
	};
	
	var find = function(el, className, cnt){
		cnt = cnt || 0;
        if (Dom.hasClass(el, className)){ return el; }
        if (L.isNull(el) || el.parentNode == document.body || cnt > 5){ return false; }
        return find(el.parentNode, className, cnt++);
	};
	
	// список пользователей с кем были встрече в системе (запрашивает каждый модуль)
	var Friends = function(){
		this.init();
	};
	Friends.prototype = {
		init: function(){
			this.cache = null;
		},
		load: function(callback){
			if (!L.isNull(this.cache)){
				if (L.isFunction(callback)){
					callback(this.cache);
				}
				return;
			}
			var __self = this;
			Brick.ajax('uprofile', {
				'data': {
					'do': 'friends'
				},
				'event': function(request){
					var d = request.data;
					if (!L.isNull(d)){ __self.cache = d; }
					if (L.isFunction(callback)){
						callback(d);
					}
				}
			});
		},
		clear: function(){
			this.cache = null;
		}
	};
	NS.friends = new Friends();
	
	var UserRowType = {
		FROM: 'uln',
		SELECT: 'sel'
	};
	
	var UserSelectWidget = function(container, selUsersId){
		this.init(container, selUsersId);
	};
	UserSelectWidget.prototype = {
		init: function(container, selUsersId){
			this.users = {};
			
			this._currentSource = 0;
			this._currentSelect = 0;

			buildTemplate(this, 'widget,row,findrow');
			container.innerHTML = this._TM.replace('widget');
			
			var __self = this;
			E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){ E.preventDefault(e); }
            });
			NS.friends.load(function(users){
				__self.setUsers(users, selUsersId);
			});
		},
		buildHTMLRow: function(id, type){
			var user = this.users[id];
			return this._TM.replace('row', {
				'id': id,
				'unm': NS.viewer.buildUserName(user),
				'avatar': NS.avatar.get24(user, true),
				'type': type
			});
		},
		setUsers: function(users, selUsersId){
			this.users = users;
			selUsersId = selUsersId || [];
			
			var lst = "", TM = this._TM;
			for(var id in users){
				lst += this.buildHTMLRow(id, UserRowType.FROM); 
			}
			lst += TM.replace('findrow');
			TM.getEl('widget.allusers').innerHTML = lst;
			
			for (var i=0;i<selUsersId.length;i++){
				this.selectUser(selUsersId[i]);
			}
		},
		onClick: function(el){
			var TId = this._TId, tp = TId['widget'];
			switch(el.id){
			case tp['badd']:
				if (this._currentSource*1 > 0){
					this.selectUser(this._currentSource);
				}
				return true;
			case tp['brem']:
				if (this._currentSelect*1 > 0){
					this.deselectUser(this._currentSelect);
				}
				return true;
			case TId['findrow']['bfind']:
				this.findUser();
				return true;
			}
			
			var fel = find(el, 'opt-type-'+UserRowType.FROM);
			if (fel){ this._clickUser(fel, UserRowType.FROM); return true; }
			fel = find(el, 'opt-type-'+UserRowType.SELECT);
			if (fel){ this._clickUser(fel, UserRowType.SELECT); return true; }
			
			return false;
		},
		getRowId: function(userid, type){ return this._TId['row']['id']+type+'-'+userid; },
		getRowEl: function(userid, type){ return Dom.get(this.getRowId(userid, type)); },
		parseUserId: function(el){
			var prefix = el.id.replace(/([0-9]+$)/, '');
			return el.id.replace(prefix, "");
		},
		findUser: function(){
			var __self = this;
			new NS.FindUserPanel(function(user){
				__self.appendUser(user);
			});
		},
		appendUser: function(user){
			if (!this.users[user.id]){
				this.users[user.id] = user;
				this._TM.getEl('widget.allusers').innerHTML += this.buildHTMLRow(user.id, UserRowType.FROM);
			}
			var el = this.getRowEl(user.id, UserRowType.FROM);
			var uss = this.getSelectedUsers();
			for (var id in uss){
				if (id*1 == user.id*1){ return; }
			}
			Dom.removeClass(el, 'opt-current');
			this._clickUser(el, UserRowType.FROM);
			el.scrollIntoView(true);
		},
		_clickUser: function(el, type){
			var move = false;
			if (Dom.hasClass(el, 'opt-current')){
				switch(type){
				case UserRowType.FROM:
					this.selectUser(this.parseUserId(el));
					break;
				case UserRowType.SELECT:
					this.deselectUser(this.parseUserId(el));
					break;
				}
				move = true;
			}
			for(var id in this.users){
				Dom.removeClass(this.getRowId(id, type), 'opt-current');
			}
			if (!move){
				Dom.addClass(el, 'opt-current');
				switch(type){
				case UserRowType.FROM:
					this._currentSource = this.parseUserId(el);
					break;
				case UserRowType.SELECT:
					this._currentSelect = this.parseUserId(el);
					break;
				}
			}
		},
		userExist: function(userid){
			return !(!this.users[userid]);
		},
		selectUser: function(userid){
			if (!this.userExist(userid)){ return; }
			var elSource = this.getRowEl(userid, UserRowType.FROM);
			Dom.removeClass(elSource, 'opt-current');
			Dom.setStyle(elSource, 'display', 'none');
			
			this._TM.getEl('widget.sel').innerHTML += this.buildHTMLRow(userid, UserRowType.SELECT);
			this._currentSource = 0;
		},
		deselectUser: function(userid){
			if (!this.userExist(userid)){ return; }
			var elSource = this.getRowEl(userid, UserRowType.FROM);
			Dom.setStyle(elSource, 'display', '');
			var elSel = this.getRowEl(userid, UserRowType.SELECT);
			elSel.parentNode.removeChild(elSel);
			this._currentSelect = 0;
		},
		getSelectedUsers: function(){
			var elList = this._TM.getEl('widget.sel'),
				obs = {};
			for (var i=0; i<elList.childNodes.length; i++){
				var el = elList.childNodes[i];
				if (Dom.hasClass(el, 'opt-type-'+UserRowType.SELECT)){
					var userid = this.parseUserId(el)*1;
					obs[userid] = true;
				}
			}
			var ret = [];
			for (var userid in obs){
				ret[ret.length] = userid;
			}
			return ret;
		}
	};
	NS.UserSelectWidget = UserSelectWidget;
	
	var FindUserPanel = function(callback){
		this.callback = callback || function(){};
		FindUserPanel.superclass.constructor.call(this, {
			fixedcenter: true, modal: true
		});
	};
	YAHOO.extend(FindUserPanel, Brick.widget.Dialog, {
		initTemplate: function(){
			buildTemplate(this, 'finduserpanel,firestable,firesrow,firesrowwait');
			return this._TM.replace('finduserpanel');
		},
		onLoad: function(){
			this._TM.getEl('finduserpanel.result').innerHTML = this._TM.replace('firestable', {'rows': ''});
			
			var el = this._TM.getEl('finduserpanel.findact'),
				__self = this;
			E.on(el, 'keypress', function(e){
				if (__self.onKeyPress(E.getTarget(e), e)){ E.stopEvent(e); }
			});
		},
		renderUsers: function(users){
			if (L.isNull(users)){ return; }
			this.users = users;
			
			var TM = this._TM, T = this._T, 
				lst = "";

			for (var id in users){
				var di = users[id];
				lst += TM.replace('firesrow', {
					'id': id,
					'unm': NS.viewer.buildUserName(di)
				});
			}
			this._TM.getEl('finduserpanel.result').innerHTML = this._TM.replace('firestable', {'rows': lst});
		},
		onKeyPress: function(el, e){
			if (e.keyCode != 13){ return false; }

			this.findUser();
			return true;
		},
		onClick: function(el){
			var TId = this._TId;
			var tp = TId['finduserpanel'];
			switch(el.id){
			case tp['bfind']:
				this.findUser();
				return true;
			case tp['bclose']: this.close(); return true;
			}
			
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			switch(prefix){
			case (TId['firesrow']['append']+'-'):
				if (L.isFunction(this.callback)){
					this.callback(this.users[numid]);
				}
				this.close();
				return true;
			}

			return false;
		},
		findUser: function(){
			var TM = this._TM;
			var v = function(n){ return TM.getEl('finduserpanel.'+n).value; };
			var d = {
				'do': 'finduser',
				'lastname': v('lastname'),
				'firstname': v('firstname'),
				'username': v('username')
			};
			var e = function(n){ return d[n].length < 1; };
			if (!(!e('lastname') || !e('firstname') || !e('username'))){ 
				return;
			}
			var __self = this;
			
			this._TM.getEl('finduserpanel.result').innerHTML = this._TM.replace('firestable', {'rows': ''});
			TM.getEl('finduserpanel.bfind').style.display = 'none';
			TM.getEl('finduserpanel.wait').style.display = '';
			
			Brick.ajax('uprofile', {
				'data': d,
				'event': function(request){
					TM.getEl('finduserpanel.bfind').style.display = '';
					TM.getEl('finduserpanel.wait').style.display = 'none';
					__self.renderUsers(request.data);
				}
			});

		}
	});
	NS.FindUserPanel = FindUserPanel;

	API.showFindUserPanel = function(callback){
		new NS.FindUserPanel(callback);
	};

};