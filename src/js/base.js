var Component = new Brick.Component();
Component.entryPoint = function(NS){

    var Y = Brick.YUI;

    var ProfileWidgetExt = function(){
    };
    ProfileWidgetExt.prototype = {
        onInitAppWidget: function(err, appInstance){
            if (this.get('userid') === 0){
                this.set('userid', Brick.env.user.id);
            }
            var userid = this.get('userid');

            this.set('waiting', true);
            appInstance.profile(userid, function(err, result){
                this.set('waiting', false);
                this.onInitProfileWidget(err, appInstance);

                if (result.profile){
                    this.renderProfile();
                }
            }, this);
        },
        onInitProfileWidget: function(){
        },
        renderProfile: function(){
        }
    };
    ProfileWidgetExt.NAME = 'profileWidgetExt';
    ProfileWidgetExt.ATTRS = {
        profile: {
            readOnly: true,
            getter: function(){
                var app = this.get('appInstance');
                if (!app){
                    return null;
                }
                return app.get('profileList').getById(this.get('userid'));
            }
        },
        userid: {
            validator: Y.Lang.isNumber
        },
    };
    NS.ProfileWidgetExt = ProfileWidgetExt;

};