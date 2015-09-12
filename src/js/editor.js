var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.DateSelectWidget = Y.Base.create('DateSelectWidget', SYS.AppWidget, [], {
        buildTData: function(){
            var tp = this.template,
                lstDay = "",
                lstYear = "";

            for (var i = 1; i <= 31; i++){
                lstDay += tp.replace('option', {id: i, title: i});
            }

            var year = (new Date()).getFullYear();

            for (var i = year; i >= year - 100; i--){
                lstYear += tp.replace('option', {id: i, title: i});
            }
            return {rowsDay: lstDay, rowsYear: lstYear};
        },
        onInitAppWidget: function(){
            this._setterDate(this.get('date'));
            this._initDate = true;
        },
        _setterDate: function(date){
            var tp = this.template;

            if (date){
                tp.setValue({
                    day: date.getDate(),
                    month: date.getMonth() + 1,
                    year: date.getFullYear()
                });
            } else {
                tp.setValue({
                    day: 0,
                    month: 0,
                    year: 0
                });
            }
            return date;
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'dateSelect,option'},
            date: {
                value: null,
                setter: '_setterDate',
                getter: function(val){
                    if (this._initDate){
                        var tp = this.template,
                            day = tp.getValue('day') | 0,
                            month = (tp.getValue('month') - 1) | 0,
                            year = tp.getValue('year') | 0;

                        if (day === 0 || month === 0 || year === 0){
                            return null;
                        }
                        val = new Date(year, month, day);
                    }
                    return val;
                }
            },
            dateUnix: {
                readOnly: true,
                getter: function(){
                    var date = this.get('date');
                    console.log(date);
                    return !date ? 0 : (date.getTime() / 1000);
                }
            }
        }
    });


    NS.ProfileEditorWidget = Y.Base.create('profileEditorWidget', SYS.AppWidget, [
        NS.ProfileWidgetExt
    ], {
        destructor: function(){
            if (this.birthDayWidget){
                birthDayWidget.destroy();
            }
        },
        renderProfile: function(){
            var tp = this.template,
                profile = this.get('profile');

            tp.setHTML({
                username: profile.get('username')
            });

            tp.setValue({
                email: profile.get('email'),
                firstname: profile.get('firstname'),
                lastname: profile.get('lastname'),
                sex: profile.get('sex'),
                descript: profile.get('descript'),
                site: profile.get('site'),
                twitter: profile.get('twitter'),
            });

            this.birthDayWidget = new NS.DateSelectWidget({
                srcNode: tp.one('birthday'),
                date: profile.get('birthday')
            });
        },
        save: function(){
            if (this.get('waiting')){
                return;
            }

            var tp = this.template;

            var d = Y.merge(tp.getValue('email,firstname,lastname,sex,descript,site,twitter'), {
                id: this.get('userid'),
                birthday: this.birthDayWidget.get('dateUnix')
            });
            console.log(d);

            this.set('waiting', true);
            this.get('appInstance').profileSave(d, function(err, result){
                console.log();
            }, this);
        },
        cancel: function(){
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
        },
        CLICKS: {
            save: 'save', cancel: 'cancel'
        }
    });


};