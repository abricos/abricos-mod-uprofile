/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
		{name: 'sys', files: ['container.js','date.js']},
        {name: 'uprofile', files: ['viewer.js','profile.js']},
        {name: 'social', files: ['lib.js']}
	]
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var UID = Brick.env.user.id,
		NSys = Brick.mod.sys,
		LNG = this.language,
		buildTemplate = this.buildTemplate;

	var AccountViewWidget = function(container, user){
		this.init(container, user);
	};
	AccountViewWidget.prototype = {
		init: function(container, user){
			this.user = user;
			this.editWidget = null;
			
			var TM = buildTemplate(this, 'widget,runm,rbirthday,rdescript,rlv,rdl');
			container.innerHTML = TM.replace('widget', {
				'uid': user.id
			});
			
			this.avatarUploader = new NS.AvatarUploader(this.user.id, function(fileid){
				__self.onAvatarUpload(fileid);
			});
			this.renderUser();
			
			var __self = this;
			E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){ E.preventDefault(e); }
            });
		},
		renderUser: function(){
			var user = this.user,
				isMyProfile = Brick.env.user.id*1 == user.id*1;
			
			var TM = this._TM, gel = function(nm){ return TM.getEl('widget.'+nm); };
			
			gel('foto').innerHTML = user.avatar180()
			gel('fullname').innerHTML = user.getUserName();
			
			var lst = TM.replace('runm', {'value': user.userName});
			
			if (user.birthDay>0){
				lst += TM.replace('rbirthday', {
					'value': NSys.dateToString(NSys.dateToClient(user.birthDay))
				});
			}
			if (user.descript.length > 0){
				lst += TM.replace('rdescript', {'value': user.descript});
			}
			lst += TM.replace('rdl', {'value': Brick.dateExt.convert(user.joinDate)});
			
			lst += TM.replace('rlv', {
				'value': Brick.dateExt.convert(user.lastVisit)
			});
			
			gel('list').innerHTML = lst;
			
			Dom.getElementsByClassName('_ismyprofile', '', gel('id'), function(el){
				Dom.setStyle(el, 'display', (isMyProfile ? '' : 'none'));
			});
		},
		onAvatarUpload: function(fileid){
			this.user.avatar = fileid;
			this.renderUser();
			NS.viewer.onUserChanged(this.user);
		},
		onClick: function(el){
			if (!L.isNull(this.editWidget) && this.editWidget.onClick(el)){
				return true;
			}
			var tp = this._TId['widget'];
			switch(el.id){
			case tp['fotoupload']: this.avatarUploader.imageUpload(); return true;
			case tp['bshowedit']: this.showEditor(); return true;
			case tp['bsave']: this.saveEditor(); return true;
			case tp['bcancel']: this.closeEditor(); return true;
			}
			return false;
		},
		closeEditor: function(){
			if (L.isNull(this.editWidget)){ return; }
			this.editWidget.destroy();
			this.editWidget = null; 
			var TM = this._TM, gel = function(nm){ return TM.getEl('widget.'+nm); };
			Dom.setStyle(gel('list'), 'display', '');
			Dom.setStyle(gel('btnsshow'), 'display', '');
			Dom.setStyle(gel('btnsedit'), 'display', 'none');
			Dom.setStyle(gel('loading'), 'display', 'none');
		},
		showEditor: function(){
			if (!L.isNull(this.editWidget)){
				this.closeEditor();
			}
			var TM = this._TM, gel = function(nm){ return TM.getEl('widget.'+nm); };
			Dom.setStyle(gel('list'), 'display', 'none');
			Dom.setStyle(gel('btnsshow'), 'display', 'none');
			Dom.setStyle(gel('btnsedit'), 'display', '');
			this.editWidget = new AccountEditWidget(gel('edit'), this.user);
		},
		saveEditor: function(){
			if (L.isNull(this.editWidget)){ return; }
			var __self = this, sd = this.editWidget.getSaveData();

			var TM = this._TM, gel = function(nm){ return TM.getEl('widget.'+nm); };

			var sem = function(s){ return (!L.isString(s) || s.length == 0); },
				serr = function(num){
					var lnge = LNG['editor']['error'];
					gel('err').innerHTML = lnge['tl']+lnge[num]; 
				};
			
			gel('err').innerHTML = '';

			var pass = sd['pass'];
			if  (sem(pass['old']) && sem(pass['new']) && sem(pass['conf'])){
				sd['pass'] = null;
			} else {
				if (sem(pass['old'])){
					serr(1); return null;
				}else if(pass['new'].length < 3){
					serr(2); return null;
				}else if(pass['new'] != pass['conf']){
					serr(3); return null;
				}
				delete pass['conf'];
			}

			
			if (L.isNull(sd)){ return; }

			Dom.setStyle(gel('btnsshow'), 'display', 'none');
			Dom.setStyle(gel('btnsedit'), 'display', 'none');
			Dom.setStyle(gel('loading'), 'display', '');

			var user = this.user;
			Brick.ajax('uprofile', {
				'data': {
					'do': 'profilesave',
					'userid': user.id,
					'data': sd
				},
				'event': function(request){
					
					var rd = request.data;
					
					if (!L.isNull(rd)){
						var err = rd['err']*1;
						if (err>0){
							
							Dom.setStyle(gel('btnsedit'), 'display', '');
							Dom.setStyle(gel('loading'), 'display', 'none');
							
							if (err == 3){
								serr(12); 
							}else{
								serr(11); 
							}
							return;
						}else{
							user.update(rd['udata']);
						}
					}
					__self.closeEditor();
					__self.renderUser();
					NS.viewer.onUserChanged(user);
				}
			});			
		}
	};
	NS.AccountViewWidget = AccountViewWidget;
	
	var AccountEditWidget = function(container, user){
		this.init(container, user);
	};
	AccountEditWidget.prototype = {
		init: function(container, user){
			this.user = user;
			var TM = buildTemplate(this, 'editor,yrow'),
				gel = function(nm){ return TM.getEl('editor.'+nm); };
			
			var dLst = "", year = (new Date()).getFullYear(), yLst = "";
			for (var i=year;i>1900;i--){
				yLst += this._TM.replace('yrow', {'v': i});
			}
			for (var i=1;i<=31;i++){
				dLst += this._TM.replace('yrow', {'v': i});
			}
			
			container.innerHTML = TM.replace('editor', {
				'uid': user.id,
				'unm': user.getUserName(),
				'byears': yLst,
				'bdays': dLst
			});
			
			Dom.setStyle(gel('wait'), 'display', 'none');
			Dom.setStyle(gel('id'), 'display', '');
			
			gel('unm').innerHTML = user.userName;
			gel('fnm').value = user.firstName;
			gel('lnm').value = user.lastName;
			gel('sex').value = user.sex;
			
			var bDate = user.birthDay > 0 ? (new Date(user.birthDay*1000)) : null;
			if (!L.isNull(bDate)){
				gel('bdateday').value = bDate.getDate();
				gel('bdatemonth').value = bDate.getMonth()+1;
				gel('bdateyear').value = bDate.getFullYear();
			}
			gel('site').value = user.site;
			gel('desc').value = user.descript;
			
		},
		destroy: function(){
			var el = this._TM.getEl('editor.id');
			el.parentNode.removeChild(el);
		},
		onClick: function(el){
			return false;
		},
		getSaveData: function(){
			var TM = this._TM, gel = function(nm){ return TM.getEl('editor.'+nm); };
			var birthday = 0, 
				bday = gel('bdateday').value*1, 
				bmonth = gel('bdatemonth').value*1,
				byear = gel('bdateyear').value*1;
			
			if (bday > 0 && bmonth > 0 && byear > 0){
				birthday = new Date(byear, bmonth-1, bday);
			}
			var sd = {
				'fnm': gel('fnm').value,
				'lnm': gel('lnm').value,
				'sex': gel('sex').value,
				'site': gel('site').value,
				'dsc': gel('desc').value,
				'bd': birthday > 0 ? (birthday/1000) : 0,
				'pass': {
					'old': gel('passold').value,
					'new': gel('passnew').value,
					'conf': gel('passconf').value
				}
			};
			return sd;
		}
	};
	NS.AccountEditWidget = AccountEditWidget;
	
};