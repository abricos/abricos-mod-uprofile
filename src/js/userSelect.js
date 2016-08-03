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

    var UID = Brick.env.user.id | 0;

    NS.UserMiniListWidget = Y.Base.create('userMiniListWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            this.cleanList();
            this.after('userListChange', this.renderList, this);
            this.after('selectedChange', this.renderList, this);
        },
        cleanList: function(){
            this._userAdded = [];
            this._userRemoved = [];
            this._users = [];

            this.renderList();
        },
        renderList: function(){
            var userList = this.get('userList'),
                users = this.get('initUsers');

            if (userList){
                userList.each(function(user){
                    users[users.length] = user.get('id');
                }, this);
            }

            var tp = this.template,
                lst = "",
                reqs = [],
                distinct = {},
                removed = this._userRemoved,
                added = this._userAdded;

            users = users.concat(added);

            for (var i = 0; i < users.length; i++){
                users[i] = users[i] | 0;
                var find = false;
                for (var ii = 0; ii < removed.length; ii++){
                    removed[ii] = removed[ii] | 0;
                    if (users[i] === removed[ii]){
                        find = true;
                        break;
                    }
                }
                if (find || distinct[users[i]]){
                    continue;
                }
                distinct[users[i]] = true;
                reqs[reqs.length] = users[i];
            }

            this._users = reqs;

            if (reqs.length === 0){
                tp.setHTML('list', "");
                return;
            }

            this.get('appInstance').userListByIds(reqs, function(err, result){
                if (err){
                    return;
                }
                var userid,
                    hideCurrent = this.get('hideCurrent'),
                    selected = this.get('selected') | 0;

                result.userListByIds.each(function(user){
                    userid = user.get('id') | 0;
                    if (hideCurrent && UID === userid){
                        return;
                    }
                    lst += tp.replace('row', {
                        id: userid,
                        avatarSrc: user.get('avatarSrc24'),
                        username: user.get('viewName'),
                        active: selected === user.get('id') ? 'active' : ''
                    });
                }, this);
                tp.setHTML('list', lst)
            }, this);
        },
        userAdd: function(userid, isSelected){
            userid = userid | 0;
            this._userAdded[this._userAdded.length] = userid;
            if (isSelected){
                this.set('selected', userid, {lazy: true});
            }
            var removed = this._userRemoved,
                users = [];
            for (var i = 0; i < removed.length; i++){
                if (removed[i] !== userid){
                    users[users.length] = removed[i];
                }
            }
            this._userRemoved = users;
            this.renderList();
        },
        userRemove: function(userid){
            this._userRemoved[this._userRemoved.length] = userid;
            this.renderList();
        },
        toArray: function(){
            return this._users;
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'list,row'},
            initUsers: {
                validator: Y.Lang.isArray,
                value: []
            },
            userList: {},
            selected: {value: 0},
            hideCurrent: {value: false}
        }
    });

    NS.UserSearchFormWidget = Y.Base.create('userSearchFormWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            var tp = this.template;
            tp.one('form').on('submit', function(e){
                e.halt();
                this.searchUser();
            }, this);
        },
        searchUser: function(){
            var tp = this.template,
                search = tp.getValue('username,firstname,lastname'),
                callback = this.get('callback'),
                context = this.get('context');

            this.set('waiting', true);
            this.get('appInstance').userSearch(search, function(err, result){
                this.set('waiting', false);
                if (!err && Y.Lang.isFunction(callback)){
                    callback.call(context || this, result.userSearch);
                }
            }, this);
        },
        focus: function(){
            var tp = this.template;
            tp.setValue({
                username: '',
                firstname: '',
                lastname: ''
            });
            tp.one('username').focus();
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'searchForm'},
            callback: {},
            context: {}
        }
    });

    NS.UserSelectWidget = Y.Base.create('userSelectWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            var tp = this.template,
                hideCurrent = this.get('hideCurrent');

            this.friendListWidget = new NS.UserMiniListWidget({
                srcNode: tp.one('friendList'),
                hideCurrent: hideCurrent,
                CLICKS: {
                    select: {
                        event: function(e){
                            var userid = e.target.getData('id') | 0;
                            this._selectUser('friend', userid);
                        }, context: this
                    }
                }
            });

            this.selectedListWidget = new NS.UserMiniListWidget({
                srcNode: tp.one('selectedList'),
                initUsers: this.get('users'),
                hideCurrent: hideCurrent,
                CLICKS: {
                    select: {
                        event: function(e){
                            var userid = e.target.getData('id') | 0;
                            this._selectUser('selected', userid);
                        }, context: this
                    }
                }
            });

            this.searchResultList = new NS.UserMiniListWidget({
                srcNode: tp.one('searchResult'),
                hideCurrent: hideCurrent,
                CLICKS: {
                    select: {
                        event: function(e){
                            var userid = e.target.getData('id') | 0;
                            this._selectUser('search', userid);
                        }, context: this
                    }
                }
            });

            this.searchFormWidget = new NS.UserSearchFormWidget({
                srcNode: tp.one('searchForm'),
                callback: function(userList){
                    this.searchResultList.set('userList', userList);
                    tp.toggleView(userList.size() === 0, 'emptySearchResult', 'searchResult');

                    if (userList.size() === 1){
                        this._selectUser('search', userList.item(0).get('id'));
                    }
                },
                context: this
            });

            if (this.get('useFriends')){
                appInstance.friendList(function(err, result){
                    if (!err){
                        this.friendListWidget.set('userList', result.friendList);
                    }
                    this._loadUsers();
                }, this);
            } else {
                this._loadUsers();
            }
        },
        destructor: function(){
            if (this.friendListWidget){
                this.selectedListWidget.destroy();
                this.friendListWidget.destroy();
                this.searchResultList.destroy();
                this.searchFormWidget.destroy();
            }
        },
        _loadUsers: function(){
            var users = this.get('users');

            if (users.length === 0){
                this.searchShow();
                return;
            }
            this.set('waiting', true);
            this.get('appInstance').userListByIds(users, function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.selectedListWidget.set('userList', result.userListByIds);
                }
            }, this);
        },
        _selectUser: function(source, userid){
            var friendLW = this.friendListWidget,
                selectedLW = this.selectedListWidget;

            switch (source) {
                case 'search':
                    this.searchCancel();
                    friendLW.userRemove(userid);
                    selectedLW.userAdd(userid, true);
                    break;
                case 'selected':
                    friendLW.set('selected', 0);
                    selectedLW.set('selected', userid);
                    break;
                case 'friend':
                    friendLW.set('selected', userid);
                    selectedLW.set('selected', 0);
                    break;
            }
        },
        moveToSelected: function(){
            var friendLW = this.friendListWidget,
                selectedLW = this.selectedListWidget,
                userid = friendLW.get('selected');

            if (userid === 0){
                return;
            }
            friendLW.userRemove(userid);
            selectedLW.userAdd(userid, true);
        },
        removeFromSelected: function(){
            var friendLW = this.friendListWidget,
                selectedLW = this.selectedListWidget,
                userid = selectedLW.get('selected');

            if (userid === 0){
                return;
            }
            friendLW.userAdd(userid, true);
            selectedLW.userRemove(userid);
        },
        searchShow: function(){
            this.template.toggleView(true, 'searchPanel', 'selectPanel');
        },
        searchCancel: function(){
            this.template.toggleView(false, 'searchPanel', 'selectPanel');
            this.searchResultList.cleanList();
        },
        toJSON: function(){
            return this.get('users');
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            useFriends: {value: false},
            hideCurrent: {value: false},
            users: {
                validator: Y.Lang.isArray,
                value: [],
                getter: function(val){
                    if (this.selectedListWidget){
                        return this.selectedListWidget.toArray();
                    }
                    return val;
                }
            }
        },
        CLICKS: {
            searchShow: {
                event: function(){
                    this.searchShow();
                    this.searchFormWidget.focus();
                }
            },
            searchCancel: 'searchCancel',
            searchUser: 'searchUser',
            userSelect: 'moveToSelected',
            userUnselect: 'removeFromSelected'
        }
    });
};