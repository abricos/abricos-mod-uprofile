/*
@package Abricos
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
		{name: 'sys', files: ['container.js','date.js']},
		{name: 'widget', files: ['lib.js']},
        {name: 'uprofile', files: ['viewer.js','profile.js']}
	]
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NSys = Brick.mod.sys,
		LNG = this.language,
		buildTemplate = this.buildTemplate,
		R = NS.roles;
	
	var AccountViewWidget = function(container, user){
		AccountViewWidget.superclass.constructor.call(this, container, {
			'buildTemplate': buildTemplate, 
			'tnames': 'widget,runm,reml,rbirthday,rdescript,rlv,rdl,rsite,rtwitter' 
		}, user);
	};
	YAHOO.extend(AccountViewWidget, Brick.mod.widget.Widget, {
		init: function(user){
			this.user = user;
			this.editWidget = null;
		},
		buildTData: function(user){
			return { 'uid': user.id };
		},
		onLoad: function (user){
			this.avatarUploader = new NS.AvatarUploader(this.user.id, function(fileid){
				__self.onAvatarUpload(fileid);
			});
		},
		render: function(){
			var user = this.user,
				isMyProfile = Brick.env.user.id*1 == user.id*1 || R['isAdmin'];
			
			var TM = this._TM, gel = function(nm){ return TM.getEl('widget.'+nm); };
			
			// сформировать превьюшки
			var fototmb = function(size){
				var img = new Image();
				img.src = user['avatar'+size](true);
			};
			fototmb(24);fototmb(45);
			
			var lst = TM.replace('runm', {'value': user.userName});
			
			if (isMyProfile && user.email){
				lst += TM.replace('reml', {
					'value': user.email
				});
			}
			
			if (user.birthDay>0){
				lst += TM.replace('rbirthday', {
					'value': NSys.dateToString(NSys.dateToClient(user.birthDay))
				});
			}
			if (user.descript.length > 0){
				lst += TM.replace('rdescript', {'value': user.descript});
			}
			if (user.site.length > 0){
				lst += TM.replace('rsite', {'value': user.site});
			}
			if (user.twitter.length > 0){
				lst += TM.replace('rtwitter', {'value': user.twitter});
			}

			lst += TM.replace('rdl', {'value': Brick.dateExt.convert(user.joinDate)});
			
			lst += TM.replace('rlv', {
				'value': Brick.dateExt.convert(user.lastVisit)
			});
			
			this.elSetHTML({
				'foto': user.avatar180(),
				'fullname': user.getUserName(),
				'list': lst
			});
			
			Dom.getElementsByClassName('_ismyprofile', '', this.gel('id'), function(el){
				Dom.setStyle(el, 'display', (isMyProfile ? '' : 'none'));
			});
		},
		onAvatarUpload: function(fileid){
			this.user.avatar = fileid;
			this.render();
			NS.viewer.onUserChanged(this.user);
		},
		onClick: function(el, tp){
			if (!L.isNull(this.editWidget) && this.editWidget.onClick(el)){
				return true;
			}
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
			this.elShow('list,btnsshow');
			this.elHide('btnsedit,loading');
		},
		showEditor: function(){
			if (!L.isNull(this.editWidget)){
				this.closeEditor();
			}
			this.elHide('list,btnsshow');
			this.elShow('btnsedit');
			this.editWidget = new AccountEditWidget(this.gel('edit'), this.user);
		},
		saveEditor: function(){
			if (L.isNull(this.editWidget)){ return; }
			var __self = this, sd = this.editWidget.getSaveData();

			var TM = this._TM, gel = function(nm){ return TM.getEl('widget.'+nm); };

			var sem = function(s){ return (!L.isString(s) || s.length == 0); };
			var serr = function(num){
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

			this.elHide('btnsshow,btnsedit');
			this.elShow('loading');

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
					__self.render();
					NS.viewer.onUserChanged(user);
				}
			});			
		}
	});
	NS.AccountViewWidget = AccountViewWidget;
	
	var AccountEditWidget = function(container, user){
		AccountEditWidget.superclass.constructor.call(this, container, {
			'buildTemplate': buildTemplate, 
			'tnames': 'editor,yrow' 
		}, user);
	};
	YAHOO.extend(AccountEditWidget, Brick.mod.widget.Widget, {
		init: function(user){
			this.user = user;
		},
		buildTData: function(user){
			var dLst = "", year = (new Date()).getFullYear(), yLst = "";
			for (var i=year;i>1900;i--){
				yLst += this._TM.replace('yrow', {'v': i});
			}
			for (var i=1;i<=31;i++){
				dLst += this._TM.replace('yrow', {'v': i});
			}
			
			return {
				'uid': user.id,
				'unm': user.getUserName(),
				'byears': yLst,
				'bdays': dLst
			};
		},
		onLoad: function(user){
			this.elHide('wait');
			this.elShow('id');

			this.elSetHTML('unm', user.userName);
			this.elSetValue({
				'eml': user.email,
				'fnm': user.firstName,
				'lnm': user.lastName,
				'sex': user.sex,
				'desc': user.descript,
				'site': user.site,
				'twitter': user.twitter
			});
			
			if (!R['isAdmin']){
				this.elDisable('eml');
			}
			
			var bDate = user.birthDay > 0 ? (new Date(user.birthDay*1000)) : null;
			if (!L.isNull(bDate)){
				this.elSetValue({
					'bdateday': bDate.getDate(),
					'bdatemonth': bDate.getMonth()+1,
					'bdateyear': bDate.getFullYear()
				});
			}
		},
		getSaveData: function(){
			var birthday = 0, 
				bday = this.gel('bdateday').value*1, 
				bmonth = this.gel('bdatemonth').value*1,
				byear = this.gel('bdateyear').value*1;
			
			if (bday > 0 && bmonth > 0 && byear > 0){
				birthday = new Date(byear, bmonth-1, bday);
			}
			var sd = {
				'eml': this.gel('eml').value,
				'fnm': this.gel('fnm').value,
				'lnm': this.gel('lnm').value,
				'sex': this.gel('sex').value,
				'site': this.gel('site').value,
				'twt': this.gel('twitter').value,
				'dsc': this.gel('desc').value,
				'bd': birthday > 0 ? (birthday/1000) : 0,
				'pass': {
					'old': this.gel('passold').value,
					'new': this.gel('passnew').value,
					'conf': this.gel('passconf').value
				}
			};
			return sd;
		}		
	});
	NS.AccountEditWidget = AccountEditWidget;
	
};