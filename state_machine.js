"use strict";

/**
 * 有限状态机
 */

var StateMachine = function(states) {

    if (this._isEmptyObj(states)) {
        throw new Error('请正确设置状态！');
        return;
    }

    this._events = {};
    this._states = states;
    this._initStates = this._cloneStates();
}

/**
 * 将状态重置到初始化状态
 */
StateMachine.prototype.reset = function() {
    for (var key in this._initStates) {
        this._states[key] = this._initStates[key];
    }
}

/**
 * 设置状态
 */
StateMachine.prototype.set = function(stateKey, stateValue) {
    var lasteStates = this._cloneStates();
    var key;

    if (typeof stateKey == 'object') {
        for (key in stateKey) {
            this._states[key] = stateKey[key];
        }
    }

    this._states[stateKey] = stateValue;

    // 是否触发事件
    return this._check(lasteStates);
}

/**
 * 获取当前状态
 */
StateMachine.prototype.get = function(stateKey) {
    var curStates = this._cloneStates();
    if (!arguments.length) return curStates;
    return curStates(stateKey);
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
StateMachine.prototype.trigger = function(name, handler) {
    // trigger all
    if (arguments.length == 0) {
        this._triggerByHandler('*');
        return;
    }

    // .trigger(handler)
    if (typeof name == 'function') {
        this._triggerByHandler(name);
        return;
    }

    if (!this._events[name]) return;

    var curStates = this._cloneStates();
    this._events[name].forEach(function(item) {
        if (item.handler === handler) {
            item.handler.call(that, {
                name: name,
                handler: item.handler,
                from: curStates,
                to: curStates
            });
        }
    });
}

StateMachine.prototype._triggerByHandler = function(handler) {
    var curStates = this._cloneStates();
    var name;
    var that = this;

    for (name in this._events) {
        this._events[name].forEach(function(item) {
            if (handler == '*' || item.handler === handler) {
                item.handler.call(that, {
                    name: name,
                    handler: item.handler,
                    from: curStates,
                    to: curStates
                });
            }
        });
    }
}

// 检查状态改变情况
StateMachine.prototype._check = function(lastStates) {
    var changes = [];
    var triggers = [];
    var name, key;
    var that = this;

    for (key in this._states) {
        if (lastStates[key] != this._states[key]) {
            changes.push(key);
        }
    }

    // 状态没有发生改变，不会自动触发事件
    if (!changes.length) return false;

    for (name in that._events) {
        that._events[name].forEach(function(item) {
            var flag = false;

            if (typeof item.conditions == 'function') {
                flag = item.conditions(lastStates, that._cloneStates(), changes);
            } else if ( that._checkFrom(item.conditions, lastStates, changes) 
                && that._checkTo(item.conditions, that._states, changes) 
                && that._change(item.conditions, that._states, changes) 
                && that._anyChange(item.conditions, that._states, changes) ) {
                flag = true;
            }
            // save event to trigger
            flag && triggers.push({
                name: name,
                handler: item.handler,
                from: lastStates,
                to: that._cloneStates()
            });
        });        
    }

    // 统一触发事件
    triggers.forEach(function(item) {
        item.handler.call(that, item);
    });
    
    return true;
}

StateMachine.prototype._checkFrom = function(conditions, lastStates, changes) {
    if (this._isEmptyObj(conditions)) return true;
    return this._checkOneCondition(conditions['from'], lastStates, changes, lastStates);
}

StateMachine.prototype._checkTo = function(conditions, lastStates, changes) {
    if (this._isEmptyObj(conditions)) return true;
    return this._checkOneCondition(conditions['to'], this._states, changes, lastStates);
}

StateMachine.prototype._change = function(conditions, lastStates, changes) {
    var flag = true;

    if (this._isEmptyObj(conditions)) return true;
    if (!Array.isArray(conditions.change)) return true;
    conditions.change.forEach(function(v) {
        if (!~changes.indexOf(v)) flag = false;
    });
    return flag;
}

StateMachine.prototype._anyChange = function(conditions, lastStates, changes) {
    var flag = false;

    if (this._isEmptyObj(conditions)) return true;
    if (!Array.isArray(conditions.anyChange)) return true;
    conditions.anyChange.forEach(function(v) {
        if (~changes.indexOf(v)) flag = true;
    });
    return flag;
}

StateMachine.prototype._checkOneCondition = function(condition, compareStates, changes, lastStates) {
    var curStates = this._cloneStates();

    if (this._isEmptyObj(condition)) return true;

    var flag = true;
    var key, cond, type;

    for (key in condition) {
        cond = condition[key];
        type = this._getConditionType(cond);

        switch (type) {
            case 'function':
                flag = cond(lastStates[key], curStates[key]);
                break;
            case 'string':
            case 'other':
                flag = compareStates[key] == cond;
                break;
            case 'array':
                flag = ~cond.indexOf(compareStates[key]);
                break;
            case 'regexp':
                flag = cond.test(compareStates[key]);
                break;
            default:
                flag = false;
        }
        if (!flag) break;
    }
    return flag;
}

// 判断条件的类型：function，string，array，regexp
StateMachine.prototype._getConditionType = function(obj) {
    var type = 'other';

    if (typeof obj == 'function') {
        type = 'function';
    } else if (typeof  obj == 'string') {
        type = 'string';
    } else if (typeof obj == 'object') {
        if (Array.isArray(obj)) {
            type = 'array';
        } else if (obj instanceof RegExp) {
            type = 'regexp';
        }
    }

    return type;
}

StateMachine.prototype._isEmptyObj = function(obj) {
    if (typeof obj != 'object') return true;
    for (var i in obj) return false;
    return true;
}

// 复制当前状态
StateMachine.prototype._cloneStates = function(toCloneStates) {
    var states = {};
    var name;

    toCloneStates = toCloneStates || this._states;

    for (name in this._states) {
        states[name] = this._states[name];
    }

    return states;
}