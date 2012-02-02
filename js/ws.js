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
	
	var WSPage = function(component, cfg){
		cfg = L.merge({
			'id': 'undefined',
			'title': 'undefined'
		}, cfg || {});
		this.init(component, cfg);
	};
	WSPage.prototype = {
		init: function(component, cfg){
			this.module = component.moduleName;
			this.id = cfg.id;
			this.title = cfg.title;
			this.request = cfg.request;
			this.widget = cfg.widget;
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
			this.list[this.list.length] = new WSPage(component, cfg);
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
	
	var UserWSPanel = function(userid, page){
		this.userid = userid;
		this._actpage = page || 'account';
		this.widgets = {};
		
		UserWSPanel.superclass.constructor.call(this);
	};
	YAHOO.extend(UserWSPanel, Brick.widget.Panel, {
		initTemplate: function(){
			var TM = buildTemplate(this, 'panel');
			return TM.replace('panel');
		},
		onLoad: function(){
			var TM = this._TM, __self = this,
				userid = this.userid;
			
			this.ws = {};
			R.load(function(){
				NS.viewer.loadUser(userid, function(user){
					__self.onLoadUser(user);
				});
			});
		},
		destroy: function(){
			UserWSPanel.superclass.destroy.call(this);
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
			this.gmenu = new NS.GlobalMenuWidget(TM.getEl('panel.gmenu'), user);
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
				Dom.setStyle(TM.getEl('panel.loading'), 'display', '');
				Dom.setStyle(TM.getEl('panel.pages'), 'display', 'none');
				
				Brick.Loader.add({ mod: [{name: pg.module, files: [pg.request+'.js']}],
					onSuccess: function() { 
						Dom.setStyle(TM.getEl('panel.loading'), 'display', 'none');
						Dom.setStyle(TM.getEl('panel.pages'), 'display', '');
						
						var WClass = Brick.mod[pg.module][pg.widget];
						if (!WClass){ return; }
						
						w = {
							'container': document.createElement('div'),
							'page': pg
						};
						TM.getEl('panel.pages').appendChild(w['container']);
						w['widget'] = new WClass(w['container'], user);
						
						ws[page] = w;
						showp();
					}
				});
			}else{
				showp();
			}
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