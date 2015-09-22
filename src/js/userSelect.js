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

    NS.UserMiniListWidget = Y.Base.create('userMiniListWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            this.renderList();
            this.on('userListChange', this.renderList, this);
        },
        renderList: function(){
            var userList = this.get('userList');
            if (!userList){
                return;
            }
            var tp = this.template,
                lst = "";

            userList.each(function(user){
                lst += tp.replace('row', {
                    id: user.get('id'),
                    username: user.get('viewName')
                });
            }, this);
            tp.setHTML('list', lst)
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'list,row'},
            userList: {}
        }
    });

    NS.UserSelectWidget = Y.Base.create('userSelectWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            var users = this.get('users');
            users = [2];
            this.set('waiting', true);
            appInstance.friendList(function(err, result){
                appInstance.userListByIds(users, function(err, result){
                    this.set('waiting', false);

                    this.userSelectedWidget = new NS.UserMiniListWidget({
                        srcNode: this.template.one('rightCol'),
                        userList: result.userListByIds
                    });

                    if (!err){
                        this.renderList();
                    }
                }, this);
            }, this);
        },
        destructor: function(){
        },
        renderList: function(){
            var friendList = this.get('appInstance').get('frendList');
            if (!friendList){
                return;
            }
            if (!this.friendListWidget){
                this.friendListWidget = new NS.UserMiniListWidget();
            }
            var tp = this.template,
                lst = "";

            friendList.each(function(friend){

            }, this);

        },
        addUser: function(userid){
            this.searchCancel();
            /*
             if (!this.userSelectedWidget){
             }
             /**/
        },
        searchShow: function(){
            var tp = this.template;
            tp.setValue({
                username: '',
                firstname: '',
                lastname: ''
            });
            tp.toggleView(true, 'searchPanel', 'selectPanel');
        },
        searchCancel: function(){
            this.template.toggleView(false, 'searchPanel', 'selectPanel');
        },
        searchUser: function(){
            var tp = this.template,
                search = tp.getValue('username,firstname,lastname');

            this.set('waiting', true);
            this.get('appInstance').userSearch(search, function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.setUserSearchResult(result.userSearch);
                }
            }, this);
        },
        setUserSearchResult: function(userList){
            var tp = this.template;
            if (!this.searchResultList){
                this.searchResultList = new NS.UserMiniListWidget({
                    srcNode: tp.one('searchResult'),
                    userList: userList,
                    CLICKS: {
                        select: {
                            event: function(e){
                                var userid = e.target.getData('id') | 0;
                                this.userAdd(userid);
                            },
                            context: this
                        }
                    }
                });
            } else {
                this.searchResultList.set('userList', userList);
            }
            tp.toggleView(userList.size() === 0, 'emptySearchResult', 'searchResult');
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            users: {
                validator: Y.Lang.isArray,
                value: []
            }
        },
        CLICKS: {
            searchShow: 'searchShow',
            searchCancel: 'searchCancel',
            searchUser: 'searchUser'
        }
    });
};