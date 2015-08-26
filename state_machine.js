"use strict";

/**
 * 有限状态机
 */

var StateMachine = function(states) {

    if (this._isEmptyObj(states)) {
        throw new Error('请正确设置状态！');
        return;
    }

    this._events = {
        // 升职事件
        'promote': [{
            handler: function() {
                console.log('我升职了！');
            },
            condition: {
                from: {position: '普通职员'},
                to: {position: '经理'},
                where: {ege: 22}
            }
        }, {
            handler: function() {
                console.log('我升职了！');
            },
            condition: function(from, to) {
                if (from.position != '经理' && to.position == '经理') {
                    return true;
                } else {
                    return false;
                }
            }
        }],
        // 无名事件
        'default': [{

        }]
    };
    this._states = states;
}

/**
 * 绑定状态改变事件
 */
StateMachine.prototype.on = function(name, handler, conditions) {
    // .on(fn, options)
    if (typeof name == 'function') {
        conditions = handler;
        handler = name;
        name = 'default';
    }

    if (!this._events[name]) this._events[name] = [];
    this._events[name].push({
        handler: handler,
        conditions: conditions
    });
}

/**
 * 取消绑定事件
 */
StateMachine.prototype.off = function(name, handler) {
    // .off(); off all 
    if (arguments.length == 0) {
        this._events = {};
        return;
    }

    // .off(handler);
    if (typeof name == 'function') {
        this._offByHandler(name);
        return;
    }

    // no event for the name
    if (!this._events[name]) return;

    // .off(name)
    if (typeof handler != 'function') {
        delete this._events[name];
        return;
    }

    // .off(name, handler)
    this._events[name].filter(function(item) {
        return item.handler !== handler;
    });
}

StateMachine.prototype._offByHandler = function(handler) {
    for (var name in this._events) {
        this._events[name].filter(function(item) {
            return item.handler !== handler;
        });
    }
}

// 触发事件
StateMachine.prototype.trigger = function() {
    
}

// 检查状态改变情况
StateMachine.prototype._check = function(lastStates) {
    var changes = [];
    var name, key;

    for (key in this._states) {
        if (lastStates[key] != this._states[key]) {
            changes.push(key);
        }
    }

    for (name in this._events) {
        this._events[name].forEach(function(item) {
            if (this._checkWhere(item, lastStates, changes)) {

            }
        });        
    }
}

StateMachine.prototype._checkWhere = function(item, lastStates, changes) {
    this._checkOneCondition(item['where'], lastStates, changes, lastStates);
}

StateMachine.prototype._checkFrom = function(item, lastStates, changes) {
    this._checkOneCondition(item['form'], lastStates, changes, lastStates);
}

StateMachine.prototype._checkTo = function(item, lastStates, changes) {
    this._checkOneCondition(item['to'], this._states, changes, lastStates);
}

StateMachine.prototype._checkOneCondition = function(condition, states, changes, lastStates) {
    if (typeof condition == 'function') {
        return condition(this._cloneState(), lastStates, changes);
    }

    if (typeof this._isEmptyObj(condition)) return true;

    var flag = true;
    for (var key in item.where) {
        if (!~changes.indexOf(key) || item.where[key] != lastStates[key]) {
            flag = false;
            break;
        }
    }
    return flag;
}

StateMachine.prototype._isEmptyObj = function(obj) {
    if (typeof obj != 'object') return true;
    for (var i in obj) return false;
    return true;
}

// 复制当前状态
StateMachine.prototype._cloneState = function() {
    var states = {};
    var name;
    for (name in this._states) {
        states[name] = this._states[name];
    }
    return states;
}