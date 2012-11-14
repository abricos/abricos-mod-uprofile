/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = { 
	mod:[
        {name: '{C#MODNAME}', files: ['lib.js']}
	]		
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		R = NS.roles;

	var buildTemplate = this.buildTemplate;
	var UID = Brick.env.user.id;
	
	var WSPage = function(component, cfg){
		cfg = L.merge({
			'id': 'undefined',
			'title': 'undefined',
			'isPersonal': false,
			'order': 0
		}, cfg || {});
		this.init(component, cfg);
	};
	WSPage.prototype = {
		init: function(component, cfg){
			this.module = component.moduleName;
			this.id = cfg.id;
			this.title = cfg.title;
			this.isPersonal = cfg.isPersonal;
			this.request = cfg.request;
			this.widget = cfg.widget;
			this.order = cfg.order;
		}
	};
	NS.WSPage = WSPage;
	
	var WSPageList = function(){
		this.init();
	};
	WSPageList.prototype = {
		init: function(){
			this.list = [];
		},
		add: function(component, cfg){
			var a = this.list;
			a[a.length] = new WSPage(component, cfg);
			this.list = a.sort(function(w1, w2){
				if (w1.order < w2.order){ return 1; }
				if (w1.order > w2.order){ return -1; }
				return 0;
			});
		},
		get: function(id){
			var lst = this.list;
			for (var i=0;i<lst.length;i++){
				if (lst[i]['id'] == id){ return lst[i]; }
			}
			return null;
		}
	};
	NS.WSPageList = WSPageList;
	NS.wsPageList = new WSPageList();

	var GlobalMenuWidget = function(container, user){
		this.init(container, user);
	};
	GlobalMenuWidget.prototype = {
		init: function(container, user){
			this.user = user;

			var TM = buildTemplate(this, 'gbmenu,tlrow'),
				pgs = NS.wsPageList.list, lst = "";
			
			for (var i=0;i<pgs.length;i++){
				var pg = pgs[i];
				if (pg.isPersonal && UID != user.id){
					continue;
				}
				lst += TM.replace('tlrow', {
					'id': pg.id,
					'uid': user.id,
					'tl': pg.title
				});
			}
			
			container.innerHTML = this._TM.replace('gbmenu', {
				'uid': user.id,
				'unm': user.getUserName(),
				'avatar': user.avatar90(),
				'tlrows': lst
			});
		},
		selectMenuItem: function(page){
			var TM = this._TM,
				pgs = NS.wsPageList.list, lst = "";
			
			for (var i=0;i<pgs.length;i++){
				var pg = pgs[i];
				var el = Dom.get(TM.getElId('tlrow.id')+'-'+pg.id);
				
				if (page == pg.id){
					Dom.addClass(el, 'sel');
				}else{
					Dom.removeClass(el, 'sel');
				}
			}
		}
	};
	NS.GlobalMenuWidget = GlobalMenuWidget;
	
	var UserWSWidget = function(container, userid, page){
		this.init(container, userid, page);
	};
	UserWSWidget.prototype = {
		init: function(container, userid, page){
			this.userid = userid = userid || Brick.env.user.id;
			this._actpage = page || 'account';
			this.widgets = {};
			
			var TM = buildTemplate(this, 'widget'), __self = this;
			container.innerHTML = TM.replace('widget');
			
			R.load(function(){
				NS.viewer.loadUser(userid, function(user){
					__self.onLoadUser(user);
				});
			});
			
			NS.viewer.userChangedEvent.subscribe(this.onUserChanged, this, true);
		},
		destroy: function(){
			NS.viewer.userChangedEvent.unsubscribe(this.onUserChanged);
		},
		onUserChanged: function(evt, prms){
			this.renderPages();
		},
		onLoadUser: function(user){
			this.user = user;
			var list = [];
			// сформировать список модулей имеющих компонент 'upfapi' в наличие
			for (var m in Brick.Modules){
				if (Brick.componentExists(m, 'upfapi') && !Brick.componentLoaded(m, 'upfapi')){
					list[list.length] = {name: m, files:['upfapi.js']};
				}
			}
			var __self = this;
			if (list.length > 0){
				Brick.Loader.add({ mod: list,
					onSuccess: function() { 
						__self.renderPages(); 
					}
				});
			}else{
				__self.renderPages(); 
			}
		},
		renderPages: function(){
			var TM = this._TM, user = this.user;
			this.gmenu = new NS.GlobalMenuWidget(TM.getEl('widget.gmenu'), user);
			this.showPage(this._actpage);
		},
		showPage: function(page){
			var TM = this._TM, pg = NS.wsPageList.get(page), 
				user = this.user,
				gmenu = this.gmenu;
			
			if (L.isNull(pg)){ return; }
			this._actpage = page;
			
			var ws = this.widgets,
				w = ws[page];
			
			var showp = function(){
				for (var n in ws){
					if (n == page){
						Dom.setStyle(ws[n]['container'], 'display', '');
					}else{
						Dom.setStyle(ws[n]['container'], 'display', 'none');
					}
				}
				gmenu.selectMenuItem(page);
			};
			
			if (!w){
				Dom.setStyle(TM.getEl('widget.loading'), 'display', '');
				Dom.setStyle(TM.getEl('widget.pages'), 'display', 'none');
				
				Brick.Loader.add({ mod: [{name: pg.module, files: [pg.request+'.js']}],
					onSuccess: function() { 
						Dom.setStyle(TM.getEl('widget.loading'), 'display', 'none');
						Dom.setStyle(TM.getEl('widget.pages'), 'display', '');
						
						var WClass = Brick.mod[pg.module][pg.widget];
						if (!WClass){ return; }
						
						w = {
							'container': document.createElement('div'),
							'page': pg
						};
						TM.getEl('widget.pages').appendChild(w['container']);
						w['widget'] = new WClass(w['container'], user);
						
						ws[page] = w;
						showp();
					}
				});
			}else{
				showp();
			}
		}		
	};
	NS.UserWSWidget = UserWSWidget;
	
	NS.API.showWSWidget = function(container, userid, actpage){
		var widget = new NS.UserWSWidget(container, userid, actpage);
		return widget;
	};
	
	
	var UserWSPanel = function(userid, page){
		this.userid = userid;
		this._actpage = page || 'account';
		
		UserWSPanel.superclass.constructor.call(this);
	};
	YAHOO.extend(UserWSPanel, Brick.widget.Panel, {
		initTemplate: function(){
			var TM = buildTemplate(this, 'panel');
			return TM.replace('panel');
		},
		onLoad: function(){
			this.wsWidget = new NS.UserWSWidget(this._TM.getEl('panel.widget'), this.userid, this._actpage);
		},
		destroy: function(){
			this.wsWidget.destroy();
			UserWSPanel.superclass.destroy.call(this);
		},
		showPage: function(page){
			this.wsWidget.showPage(page);
		}
		
	});
	NS.UserWSPanel = UserWSPanel;

	var activePanel = {};
	NS.API.showws = function(uid, act){
		uid = uid || Brick.env.user.id;
		act = act || '';
		
		if (!activePanel[uid] || activePanel[uid].isDestroy()){
			activePanel[uid] = new UserWSPanel(uid, act);
		}else{
			activePanel[uid].showPage(act);
		}
		return activePanel[uid];
	};
	
};