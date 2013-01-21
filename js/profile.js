/*
* @version $Id: profile.js 352 2010-02-15 15:10:59Z roosit $
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module User
 * @namespace Brick.mod.user
 */

var Component = new Brick.Component();
Component.requires = {
	yahoo: ['tabview'],
	mod:[
	     {name: 'user', files: ['permission.js']},
	     {name: 'sys', files: ['form.js','data.js','container.js']},
	     {name: 'uprofile', files: ['viewer.js']}
    ]
};
Component.entryPoint = function(NS){
	
	/* * * * * * Старая версия просмотра/редактора профиля пользователя * * * * */
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	if (!NS.data){
		NS.data = new Brick.util.data.byid.DataSet('uprofile');
	}
	var DATA = NS.data;
	
	var buildTemplate = this.buildTemplate;
	
	NS.FTYPE = {
		BOOLEAN: 0,
		INTEGER: 1,
		STRING: 2,
		DOUBLE: 3,
		TEXT: 4,
		DATETIME: 5,
		ENUM: 6
	};

	var DPOINT = '.';
	var lz = function(num){
		var snum = num+'';
		return snum.length == 1 ? '0'+snum : snum; 
	};
	var dayToString = function(date){
		if (L.isNull(date)){ return ''; }
		var day = date.getDate();
		var month = date.getMonth()+1;
		var year = date.getFullYear();
		return lz(day)+DPOINT+lz(month)+DPOINT+year;
	};
	
	var stringToDay = function(str){
		str = str.replace(/,/g, '.').replace(/\//g, '.');
		var aD = str.split(DPOINT);
		if (aD.length != 3){ return null; }
		return new Date(aD[2], aD[1]*1-1, aD[0]);
	};
	
	var TZ_OFFSET = (new Date()).getTimezoneOffset(); 
	var TZ_OFFSET = 0; 
	
	var dateClientToServer = function(date){
		if (L.isNull(date)){ return 0; }
		var tz = TZ_OFFSET*60*1000;
		return (date.getTime()-tz)/1000; 
	};
	
	var dateServerToClient = function(unix){
		unix = unix * 1;
		if (unix == 0){ return null; }
		var tz = TZ_OFFSET*60;
		return new Date((tz+unix)*1000);
	};
	
	var ProfileWidget = function(container, userid){
		container = L.isString(container) ? Dom.get(container) : container;
		this.init(container, userid);
	};
	ProfileWidget.prototype = {
		init: function(container, userid){
		
			buildTemplate(this, 'widget');
			var TM = this._TM, T = this._T, TId = this._TId;
			container.innerHTML = T['widget'];
			
			var tabView = new YAHOO.widget.TabView(TId['widget']['id']);
			var pages = {};
			
			pages['editor'] = new ProfileEditorWidget(TM.getEl('widget.editor'), userid);
			pages['avatar'] = new AvatarEditorWidget(TM.getEl('widget.avatar'), userid);
			pages['password'] = new PasswordEditorWidget(TM.getEl('widget.password'), userid);
			this.pages = pages;

			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
		},
		onClick: function(el){
			if (this.pages['avatar'].onClick(el)){ return true; };
			if (this.pages['password'].onClick(el)){ return true; };
			var TId = this._TId;
			if (el.id == TId['widget']['bsave']){ this.pages['editor'].save(); return true;
			}
			return false;
		},
		destroy: function(){
			this.pages['editor'].destroy();
			this.pages['avatar'].destroy();
			this.pages['password'].destroy();
		}
	};
	NS.ProfileWidget = ProfileWidget;
	
	var ProfilePanel = function(userid){
		this.userid = userid || Brick.env.user.id;
		ProfilePanel.superclass.constructor.call(this, {
			width: '400px'
		});
	};
	YAHOO.extend(ProfilePanel, Brick.widget.Dialog, {
		initTemplate: function(){
			buildTemplate(this, 'panel');

			return  this._T['panel'];
		},
		onLoad: function(){
			this.editor = new ProfileEditorWidget(this._TM.getEl('panel.editor'), this.userid);
		},
		destroy: function(){
			this.editor.destroy();
			ProfilePanel.superclass.destroy.call(this);
		},
		onClick: function(el){
			var TId = this._TId;
			if (el.id == TId['panel']['bsave']){ 
				this.editor.save();
				this.close();
				return true;
			}else if (el.id == TId['panel']['bcancel']){ 
				this.close(); return true;
			}
			return false;
		}		
	});
	

	var ProfileEditorWidget = function(container, userid){
		this.init(container, userid);
	};
	ProfileEditorWidget.prototype = {
		init: function(container, userid){
		
			userid = userid || Brick.env.user.id;
			this.userid = userid;
			buildTemplate(this, 'editor,edtable,edrowwait,edrow,ted0,ted1,ted2,ted3,ted4,ted5,ted6,ted6row,ted7');
			var TM = this._TM, T = this._T;
			container.innerHTML = T['editor'];
			
			var tables = {
				'profile': DATA.get('profile', true),
				'fieldlist': DATA.get('fieldlist', true)
			};
			tables['profile'].getRows({'userid': userid});
			
			DATA.onStart.subscribe(this.dsEvent, this, true);
			DATA.onComplete.subscribe(this.dsEvent, this, true);
			DATA.isFill(tables) ? this.render() : this.renderWait();
		},
		dsEvent: function(type, args){
			if (args[0].checkWithParam('profile', {'userid': this.userid})){
				type == 'onComplete' ? this.render() : this.renderWait(); 
			}
		},
		destroy: function(){
			DATA.onComplete.unsubscribe(this.dsEvent);
			DATA.onStart.unsubscribe(this.dsEvent);
		},
		renderWait: function(){
			var TM = this._TM, T = this._T;
			TM.getEl('editor.table').innerHTML = TM.replace('edtable', {'rows': T['edrowwait']});
		},
		render: function(){
			
			var user = DATA.get('profile').getRows({'userid': this.userid}).getByIndex(0).cell;
			var lst = "", TM = this._TM, T = this._T, TId = this._TId;
			
			DATA.get('fieldlist').getRows().foreach(function(row){
				var di = row.cell, ft = di['ft']*1;
				
				switch(ft){
				case NS.FTYPE.BOOLEAN:
				case NS.FTYPE.INTEGER:
				case NS.FTYPE.STRING:
				case NS.FTYPE.DOUBLE:
				case NS.FTYPE.TEXT:
				case NS.FTYPE.DATETIME:
					lst += TM.replace('edrow', {
						'name': di['tl'],
						'edit': TM.replace('ted'+ft, {'fn': di['nm']})
					});
					break;
				case NS.FTYPE.ENUM:
					var rs = di['ops'].split('|'), rslst = "";
					for(var i=0;i<rs.length;i++){
						rslst += TM.replace('ted6row', {'id': i, 'tl': rs[i]});
					}
					lst += TM.replace('edrow', {
						'name': di['tl'],
						'edit': TM.replace('ted6', {
							'fn': di['nm'], 'rows': rslst
						})
					});
					break;
				}
			});
			TM.getEl('editor.table').innerHTML = TM.replace('edtable', {'rows': lst});
			
			// проставить значение полей
			DATA.get('fieldlist').getRows().foreach(function(row){
				var di = row.cell, ft = di['ft']*1;
				var value = user[di['nm']];
				var el = Dom.get(TId['ted'+ft]['id']+'-'+di['nm']);
				
				if (!L.isNull(el)){
					if (ft == NS.FTYPE.DATETIME){
						el.value = dayToString(dateServerToClient(value));
					}else{
						el.value = value;
					}
				}
			});
			TM.getEl('editor.username').innerHTML = user['unm'];
		},
		save: function(){
			var table = DATA.get('profile');
			var user = table.getRows({'userid': this.userid}).getByIndex(0);
			var TM = this._TM, T = this._T, TId = this._TId;

			// проставить значение полей
			DATA.get('fieldlist').getRows().foreach(function(row){
				var di = row.cell, ft = di['ft']*1;
				var t = {};
				var el = Dom.get(TId['ted'+ft]['id']+'-'+di['nm']);
				if (!L.isNull(el)){
					var value = el.value;
					if (ft == NS.FTYPE.DATETIME){
						t[di['nm']] = dateClientToServer(stringToDay(value))
					}else{
						t[di['nm']] = value;
					}
				}
				user.update(t);
			});
			table.applyChanges();
			DATA.request();
		}
	};
	
	NS.API.showProfileWidget = function(container, userid){
		NS.roles.load(function(){
			var profile = new ProfileWidget(container, userid);
			DATA.request();
		});
	};
	
	NS.API.showProfilePanel = function(userid){
		NS.roles.load(function(){
			new ProfilePanel(userid);
			DATA.request();
		});
	}
	
	var AvatarUploaders = function(){
		this.init();
	};
	AvatarUploaders.prototype = {
		init: function(){
			this.idinc = 0;
			this.list = {};
		},
		register: function(editor){
			var id = this.idinc++;
			this.list[id] = editor;
			return id;
		},
		remove: function(id){
			delete this.list[id];
		},
		setAvatar: function(userid, fileid){
			for(var id in this.list){
				var ed = this.list[id];
				if (ed.userid == userid){
					ed.setAvatar(fileid);
				}
			}
		}
	};
	
	NS.avatarUploaders = new AvatarUploaders();
	
	
	var AvatarUploader = function(userid, callback){
		this.init(userid, callback);
	};
	AvatarUploader.prototype = {
		init: function(userid, callback){
			this.uploadWindow = null;
			this.userid = userid;
			this.callback = callback;
			this.id = NS.avatarUploaders.register(this);
		},
		destroy: function(){
			NS.avatarUploaders.remove(this.id);
		},
		imageUpload: function(){
			if (!L.isNull(this.uploadWindow) && !this.uploadWindow.closed){
				this.uploadWindow.focus();
				return;
			}
			var element = this.row;
			
			var url = '/uprofile/upload/'+this.userid+'/'+this.id+'/';
			this.uploadWindow = window.open(
				url, 'catalogimage',	
				'statusbar=no,menubar=no,toolbar=no,scrollbars=yes,resizable=yes,width=480,height=270' 
			); 
		},
		setAvatar: function(fileid){
			if (L.isFunction(this.callback)){
				this.callback(fileid);
			}
		}
	};
	NS.AvatarUploader = AvatarUploader;

	var AvatarEditorWidget = function(container, userid){
		this.init(container, userid);
	};
	AvatarEditorWidget.prototype = {
		init: function(container, userid){
			userid = userid || Brick.env.user.id;
			this.userid = userid;
			var __self = this;
			this.avatarUploader = new AvatarUploader(userid, function(fileid){
				__self.onAvatarUpload(fileid);
			});

			buildTemplate(this, 'avatar');
			var TM = this._TM, T = this._T;
			container.innerHTML = T['avatar'];
			var tables = {
				'profile': DATA.get('profile', true)
			};
			tables['profile'].getRows({'userid': userid});
			
			DATA.onStart.subscribe(this.dsEvent, this, true);
			DATA.onComplete.subscribe(this.dsEvent, this, true);
			DATA.isFill(tables) ? this.render() : this.renderWait();
		},
		dsEvent: function(type, args){
			if (args[0].checkWithParam('profile', {'userid': this.userid})){
				type == 'onComplete' ? this.render() : this.renderWait(); 
			}
		},
		destroy: function(){
			DATA.onComplete.unsubscribe(this.dsEvent);
			DATA.onStart.unsubscribe(this.dsEvent);
			this.avatarUploader.destroy();
		},
		renderWait: function(){
			var TM = this._TM, T = this._T;
		},
		onAvatarUpload: function(fileid){
			var row = DATA.get('profile').getRows({'userid': this.userid}).getByIndex(0);
			if (L.isNull(row)){ return; }
			row.cell['avatar'] = fileid;
			this.render();
		},
		render: function(){
			var TM = this._TM, T = this._T;
			var row = DATA.get('profile').getRows({'userid': this.userid}).getByIndex(0);
			if (L.isNull(row)){ return; }
			var fileid = row.cell['avatar'];
			
			var img1 = TM.getEl('avatar.img1'),
				img2 = TM.getEl('avatar.img2'),
				img3 = TM.getEl('avatar.img3'),
				img4 = TM.getEl('avatar.img4');
			
			if (fileid.length != 8){
				img1.innerHTML = img2.innerHTML = img3.innerHTML = img4.innerHTML = '';
			}else{
				var user = row.cell;
				img1.innerHTML = NS.avatar.get180(user);
				img2.innerHTML = NS.avatar.get90(user);
				img3.innerHTML = NS.avatar.get45(user);
				img4.innerHTML = NS.avatar.get24(user);
			}
			
		},
		onClick: function(el){
			var tp = this._TId['avatar'];
			switch(el.id){
			case tp['bupload']: this.avatarUploader.imageUpload(); return true;
			}
			return false;
		}
	};
	NS.AvatarEditorWidget = AvatarEditorWidget;
	
	var PasswordEditorWidget = function(container, userid){
		this.init(container, userid);
	};
	PasswordEditorWidget.prototype = {
		elv: function(name){ return Brick.util.Form.getValue(this._TM.getEl('password.'+name)); },
		init: function(container, userid){
			userid = userid || Brick.env.user.id;
			this.userid = userid;

			buildTemplate(this, 'password');
			container.innerHTML = this._T['password'];
		},
		destroy: function(){ },
		onClick: function(el){
			switch(el.id){
			case this._TId['password']['bsave']: this.save(); return true;
			}
			return false;
		},
		save: function(){
			var TM = this._TM,
				passold = this.elv('passold'),
				pass = this.elv('passnew');
				passret = this.elv('passnewret');
			
			if (pass != passret){
				alert(TM.getEl('password.err-conf').innerHTML);
				return;
			}
			var __self = this;
			Brick.ajax('user', {
				'data': {
					'do': 'passwordchange',
					'userid': this.userid,
					'pass': pass,
					'passold': passold
				},
				'event': function(request){
					var err = request.data * 1;
					alert(TM.getEl('password.err'+err).innerHTML);
					__self.clear();
				}
			});
		},
		clear: function(){
			var TM = this._TM;
			TM.getEl('password.passold').value = 
				TM.getEl('password.passnew').value = 
				TM.getEl('password.passnewret').value = ""; 
		}
	};
	NS.PasswordEditorWidget = PasswordEditorWidget;
	
};
