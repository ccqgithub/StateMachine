StateMachine: Javascript 有限状态机
==

## 什么是有限状态机？

> 有限状态机，（英语：Finite-state machine, FSM），又称有限状态自动机，简称状态机，是表示有限个状态以及在这些状态之间的转移和动作等行为的数学模型。

更详细的信息可以自行百度。

## 为什么要用状态机？

世间的一切，都可以看成是各种状态的集合。比如一块石头，今天可能是干的，明天可能是湿的。再比如一个人，年龄会变，可以从结婚变成未结婚，可以从男人变成女人，等等等……

而状态改变的时候，我们可能要做某种事情来应对这种改变，比如结婚了想喊一嗓子，让所有人都恭喜我……

在Javascript编程上，用到状态机的场合比比皆是。比如一个前端组件的状态，可能从‘隐藏’到‘显示’，从‘左边’到‘右边’，背景从‘白’到‘黑’，里面的图片从‘10’张到‘20张’等等……

当组件从隐藏到显示的时候，你可能需要调用另一个组件来填充它的位置，这时候就需要在‘隐藏、显示’这个状态改变的时候做相应的操作。而促使这个组件改变可能有很多种情况（比如点击，或者过五秒隐藏），这时如果用状态机的话，只需要给它绑定一个状态改变事件而已……

使用状态机，能让你的代码变得更直观、更整洁……

当然，状态机能带来的好处远远不止这么多。

## 如何使用？

> 注意：有用到es5的`Array.prototype.forEach`，`Array.prototype.filter`，`Array.prototype.indexOf`，不支持这几个函数的ie8或以下的浏览器暂时请自行解决。

* 引入js

        <script src="../state_machine.js"></script>

* 初始化一个状态机

        // 假设为一个人设置一个状态机 他有年龄、姓名、是否结婚、朋友数量、是否有房，是否有车等状态属性
        var myState = new StateMachine({
            // 年龄
            age: 27,
            // 姓名
            name: 'season.chen',
            // 是否结婚
            marry: false,
            // 朋友个数
            friends: 10,
            // 房
            house: false,
            // 车
            car: false
        });

* 绑定事件：`myState.on(name, handler, conditions)` or `myState.on(handler, conditions)` or `myState.on(handler)`
    
    * `name`: 事件的名称，便于识别，也便于解除事件时使用

    * `handler`: 事件处理程序   

            handler = function(data) {
                // data.from: 之前的状态
                // data.to：之后的状态
                // data.changes： 改变
            }
    
    * `conditions`: 事件触发的条件，满足条件才会触发事件

        如果condition是函数，它的返回值true,表示满足条件。如果condition是对象，对象里的所有条件都满足，才会触发事件。
            
            // 可以是函数
            conditions = function(from, to, changes) {
                // from: 之前的状态
                // to：之后的状态
                // changes： 改变
            }

            // 更多场合用对象
            conditions = {
                // 改变前的状态需满足
                from: {
                    age: 22, // 可以是字符串、数字、布尔值,
                    friends: function(from, to) {return to > 20}, // 可以是函数
                    name: ['name1', 'name2'], // 可以是数组,
                    name: /name1|name2/, // 可以是正则,
                },

                // 改变后的状态需满足
                to: {
                    // 同from
                },

                // 这些状态需要改变
                changes: [],

                // 这些状态至少有一个改变
                anyChanges: []
            }

* 移除事件：`myState.off(name, handler)` or `myState.off(handler)` or `myState.off(name)` or `myState.off()`

* 将状态恢复到初始化状态: `myState.reset()`

* 设置状态: `myState.set(stateKey, stateValue)` or `myState.set({name: '11', age: 1})`

* 获取状态: `myState.get(stateKey)` or `myState.get()`

* 触发事件： `myState.trigger(name, handler)` or `myState.trigger(name)` or `myState.trigger(handler)` or `myState.trigger()`

### 例子(代码见`test/`目录)

假设为一个人设置一个状态机

    var myState = new StateMachine({
        // 年龄
        age: 27,
        // 姓名
        name: 'season.chen',
        // 是否结婚
        marry: false,
        // 朋友个数
        friends: 10,
        // 房
        house: false,
        // 车
        car: false
    });

年龄改变

    myState.on('changeEge', function(data) {
        console.log('哎呦，我又老了'+ (data.to.age - data.from.age) +'岁！');
    }, {
        change: ['age']
    });
    
    myState.reset(); // 不是必须的，只是为了让例子更好理解，每次都恢复到最初状态
    myState.set('age', 29);

晚婚 大于30岁结婚

    myState.on('lateMarriage', function(form, to) {
        console.log('大于30岁才结婚，丢不丢人？');
    }, {
        from: {marry: false},
        to: {
            marry: true, 
            age: function(from, to) {
                return to >= 30;
            }
        }
    }); 
    
    myState.reset();
    myState.set({
        marry: true,
        age: 31
    });

早婚 小于30岁结婚

    myState.on('earlyMarriage', function(form, to) {
        console.log('不到30就结婚了，还可以额么么哒!');
    }, {
        from: {marry: false},
        to: {
            marry: true, 
            age: function(from, to) {
                return to < 30;
            }
        }
    }); 
    
    myState.reset();
    myState.set('marry', true);

改了名字

    myState.on('changeName', function(data) {
        console.log('我将名字改成了' + data.to.name);
    }, {
        change: ['name']
    });

    myState.reset();
    myState.set('name', '王大锤！');

改了个奇葩名字

    myState.on('changeWonderfulName', function(data) {
        console.log('我是不是脑子坏掉了，竟然改了个这么挫的名字：' + data.to.name);
    }, {
        to: {
            name: /王八蛋|傻子/
        },
        change: ['name']
    });
    
    myState.reset();
    myState.set('name', '王八蛋1');

30岁前，买车、买房，还结了婚，我从此走向了人生巅峰！

    myState.on(' toThePinnacle', function(data) {
        console.log('哈哈哈！哈哈哈！我从此走向了人生巅峰！');
    }, function(from, to, changes) {
        if (
            // 触发因子：年龄、车、房、结婚任何一个改变，都可能触发事件
            (
                changes.indexOf('age') !== -1 
                || changes.indexOf('car') !== -1
                || changes.indexOf('house') !== -1
                || changes.indexOf('marry') !== -1
            )
            // 触发条件
            && (to.age < 30 && to.car && to.house && to.marry)
        ) {
            return true;
        }

        return false;
    });

    myState.reset();
    myState.set({
        age: 28,
        house: true,
        car: true
    });
    myState.set({
        marry: true
    });
