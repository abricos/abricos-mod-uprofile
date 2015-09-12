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
            var tp = this.template,
                date = this.get('date');

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
                            day = tp.getValue('day'),
                            month = tp.getValue('month')-1,
                            year = tp.getValue('year');
                        val = new Date(year, month, day);
                    }
                    return val;
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
            });
            this.birthDayWidget = new NS.DateSelectWidget({
                srcNode: tp.one('birthday')
            });
        },
        save: function(){

        },
        cancel: function(){
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
        },
        CLICKS: {
            save: '', cancel: ''
        }
    });


};