var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['item.js']}
    ]
};
Component.entryPoint = function(NS){

    var Dom = YAHOO.util.Dom,
        E = YAHOO.util.Event,
        L = YAHOO.lang;

    var SysNS = Brick.mod.sys;

    var AppInfo = function(d){
        d = L.merge({
            'mnm': '',
            'nm': '',
            'w': '',
            'tl': ''
        }, d || {});
        AppInfo.superclass.constructor.call(this, d);
    };
    YAHOO.extend(AppInfo, SysNS.Item, {
        update: function(d){
            this.moduleName = d['mnm'];
            this.name = d['nm'];
            this.widgetName = d['w'];
            this.title = d['tl'];
        }
    });
    NS.AppInfo = AppInfo;

    var AppInfoList = function(d){
        AppInfoList.superclass.constructor.call(this, d, AppInfo);
    };
    YAHOO.extend(AppInfoList, SysNS.ItemList, {
        getBy: function(mname, cname){
            var ret = null;
            this.foreach(function(app){
                if (app.moduleName == mname
                    && app.name == cname){
                    ret = app;
                    return true;
                }
            });
            return ret;
        }
    });
    NS.AppInfoList = AppInfoList;



};
