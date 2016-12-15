var PipeManager = require('PipeManager');
var Bird = require('Bird');
var Scroller = require('Scroller');

cc.Class({
    extends: cc.Component,

    properties: {
        /** 得金牌的分数 */
        goldScore: 30,
        /** 得银牌的分数 */
        silverScore: 10,
        /** 管道管理组件 */
        pipeManager: PipeManager,
        /** 小鸟组件 */
        bird: Bird,
        /** 分数显示节点 */
        scoreLabel: cc.Label,
        /** 遮罩节点 */
        maskLayer: {
            default: null,
            type: cc.Node
        },
        /** 地面节点 */
        ground: {
            default: null,
            type: cc.Node
        },
        /** 准备开始菜单节点 */
        readyMenu: {
            default: null,
            type: cc.Node
        },
        /** 游戏结束的菜单节点 */
        gameOverMenu: {
            default: null,
            type: cc.Node
        },
        /** 得分声音 */
        scoreAudio: {
            default: null,
            url: cc.AudioClip
        },
        /** 按钮点击、节点浮现时的声音 */
        swooshingAudio: {
            default: null,
            url: cc.AudioClip
        }
    },

    /** init some data first */
    onLoad() {
        this.score = 0; //分数置零
        this.scoreLabel.string = this.score; //显示当前分数
        this.bird.init(this); //初始化小鸟对象  参数是game当前对象
        this._enableInput(true); //设置屏幕 或者按键可以点击  对后面的监听做准备
        this._registerInput(); //注册监听
        this._revealScene(); // 
    },

    /** 重新加载场景 */
    _revealScene(){
        this.maskLayer.active = true; //状态改为true 可点击可触发
        this.maskLayer.color = cc.Color.BLACK;
        /**
         * 执行并返回该执行的动作。该节点将会变成动作的目标。<br/>
		 * 调用 runAction 时，节点自身处于不激活状态将不会有任何效果。<br/>
		 * 注意：你不应该修改 runAction 后的动作，将无法发挥作用，如果想进行修改，请在定义 action 时加入。
         */
        this.maskLayer.runAction(cc.fadeOut(0.3));
    },

    /** 点击游戏结束菜单中的重新开始游戏按钮会调用此方法 */
    restart(){
        cc.audioEngine.playEffect(this.swooshingAudio);
        this.maskLayer.color = cc.Color.BLACK;
        this.maskLayer.runAction(
            //顺序执行动作，创建的动作将按顺序依次运行。
            cc.sequence(
                cc.fadeIn(0.3),//渐显效果
                cc.callFunc(()=> {//执行回调函数
                    // 重新加载场景
                    cc.director.loadScene('game');
                }, this)
            )
        );
    },

    /** 开始游戏 */
    _gameStart(){
        this._hideReadyMenu();  //隐藏运行Menu
        this.pipeManager.startSpawn(); //开始产生管道
        this.bird.startFly(); //开始起飞
    },

    /** 游戏结束 */
    gameOver () {
        this.pipeManager.reset();
        this.ground.getComponent(Scroller).stopScroll();
        this._enableInput(false); //根据这个标志来管理是否恢复还是暂停所有监听器事件
        this._blinkOnce(); //闪屏
        this._showGameOverMenu(); //显示游戏结束Menu
    },

    /** 获取分数 */
    gainScore () {
        this.score++; //分数自加
        this.scoreLabel.string = this.score; //把值赋给label
        cc.audioEngine.playEffect(this.scoreAudio); //执行得分
    },

    /** 隐藏Ready menu */
    _hideReadyMenu(){
        this.scoreLabel.node.runAction(cc.fadeIn(0.3));
        this.readyMenu.runAction(
            cc.sequence(
                cc.fadeOut(0.5), //渐隐效果
                cc.callFunc(()=> {
                    this.readyMenu.active = false;
                }, this)
            )
        );
    },

    /** 屏幕闪烁一下 */
    _blinkOnce(){
        this.maskLayer.color = cc.Color.WHITE;
        this.maskLayer.runAction(
            cc.sequence(
                cc.fadeTo(0.1, 200), //修改透明度到指定值
                cc.fadeOut(0.1) //渐隐效果
            )
        );
    },

    /** 显示游戏结束的MENU */
    _showGameOverMenu(){
        // 隐藏分数
        this.scoreLabel.node.runAction(
            cc.sequence(
                cc.fadeOut(0.3),
                cc.callFunc(()=> {
                    this.scoreLabel.active = false;
                }, this)
            )
        );

        // 获取游戏结束界面的各个节点
        let gameOverNode = this.gameOverMenu.getChildByName("gameOverLabel"); //游戏结束节点
        let resultBoardNode = this.gameOverMenu.getChildByName("resultBoard"); //结果节点
        let startButtonNode = this.gameOverMenu.getChildByName("startButton"); //开始按钮节点
        let currentScoreNode = resultBoardNode.getChildByName("currentScore"); //当前分数节点
        let bestScoreNode = resultBoardNode.getChildByName("bestScore"); // 最好分数节点
        let medalNode = resultBoardNode.getChildByName("medal"); //奖牌节点

        // 保存最高分到本地
        const KEY_BEST_SCORE = "bestScore";
        //cc.sys.localStorage   本地存储组件
        let bestScore = cc.sys.localStorage.getItem(KEY_BEST_SCORE);
        if (bestScore === "null" || this.score > bestScore) { //如果本地没有最高分记录，或者当前分高于本地存储的最高分
            bestScore = this.score; // 当前分替换最高分记录
        }
        cc.sys.localStorage.setItem(KEY_BEST_SCORE, bestScore);

        // 显示当前分数、最高分
        currentScoreNode.getComponent(cc.Label).string = this.score;
        bestScoreNode.getComponent(cc.Label).string = bestScore;

        // 决定是否显示奖牌
        let showMedal = (err, spriteFrame) => {
            medalNode.getComponent(cc.Sprite).spriteFrame = spriteFrame;
        };
        if (this.score >= this.goldScore) { // 显示金牌
            cc.loader.loadRes("image/medal_gold.png/medal_gold", showMedal);
        } else if (this.score >= this.silverScore) { // 显示银牌
            cc.loader.loadRes("image/medal_silver.png/medal_silver", showMedal);
        } else { // 不显示奖牌
            showMedal();
        }

        // 依次显示各个节点
        var showNode = (node, action, callback)=> {
            startButtonNode.active = true;
            cc.audioEngine.playEffect(this.swooshingAudio);
            node.runAction(cc.sequence(
                action,
                cc.callFunc(()=> {
                    if (callback) {
                        callback();
                    }
                }, this)
            ));
        };
        this.gameOverMenu.active = true;
        let showNodeFunc = ()=> showNode(
            gameOverNode,
            cc.spawn(
                cc.fadeIn(0.2), //渐显效果
                cc.sequence( //顺序执行动作，创建的动作将按顺序依次运行。
                    cc.moveBy(0.2, cc.p(0, 10)),
                    cc.moveBy(0.5, cc.p(0, -10))
                )
            ),
            ()=>showNode(
                resultBoardNode,
                //移动到目标位置       时间间隔动作，这种动作在已定时间内完成
                cc.moveTo(0.5, cc.p(resultBoardNode.x, -250)).easing(cc.easeCubicActionOut()),
                ()=>showNode(
                    startButtonNode,
                    cc.fadeIn(0.5))
            )
        );
        this.scheduleOnce(showNodeFunc, 0.55); //调度一个指运行一次的回调函数
    },

    /** 开始游戏或者移动小鸟 */
    _startGameOrJumpBird(){
        if (this.bird.state === Bird.State.Ready) {
            this._gameStart();
        } else {
            this.bird.rise();
        }
    },

    //注册监听
    _registerInput () {
        //将事件监听器添加到事件管理器中
        cc.eventManager.addListener({
            event: cc.EventListener.KEYBOARD, //键盘事件监听
            onKeyPressed: function (keyCode, event) {
                this._startGameOrJumpBird();
            }.bind(this)
        }, this.node);
        //将事件监听器添加到事件管理器中。<br/>
		//如果参数 “nodeOrPriority” 是节点，优先级由 node 的渲染顺序决定，显示在上层的节点将优先收到事件。<br/>
		//如果参数 “nodeOrPriority” 是数字，优先级则固定为该参数的数值，数字越小，优先级越高。<br/>
        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ONE_BY_ONE, //多点触摸事件监听
            onTouchBegan: function (touch, event) {
                this._startGameOrJumpBird();
                return true;
            }.bind(this)
        }, this.node);
    },

    _enableInput: function (enable) {
        if (enable) {
            //事件管理器，它主要管理事件监听器注册和派发系统事件。
	    	//原始设计中，它支持鼠标，触摸，键盘，陀螺仪和自定义事件。
            cc.eventManager.resumeTarget(this.node);//恢复传入的 node 相关的所有监听器的事件响应。
        } else {
            cc.eventManager.pauseTarget(this.node);//暂停传入的 node 相关的所有监听器的事件响应
        }
    },
});