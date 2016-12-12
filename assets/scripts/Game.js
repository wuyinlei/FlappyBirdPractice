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

    onLoad() {
        this.score = 0;
        this.scoreLabel.string = this.score;
        this.bird.init(this);
        this._enableInput(true);
        this._registerInput();
        this._revealScene();
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
        this._hideReadyMenu();
        this.pipeManager.startSpawn();
        this.bird.startFly();
    },

    /** 游戏结束 */
    gameOver () {
        this.pipeManager.reset();
        this.ground.getComponent(Scroller).stopScroll();
        this._enableInput(false);
        this._blinkOnce();
        this._showGameOverMenu();
    },

    /** 获取分数 */
    gainScore () {
        this.score++;
        this.scoreLabel.string = this.score;
        cc.audioEngine.playEffect(this.scoreAudio);
    },

    /** 隐藏Ready menu */
    _hideReadyMenu(){
        this.scoreLabel.node.runAction(cc.fadeIn(0.3));
        this.readyMenu.runAction(
            cc.sequence(
                cc.fadeOut(0.5),
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
                cc.fadeTo(0.1, 200),
                cc.fadeOut(0.1)
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
        let gameOverNode = this.gameOverMenu.getChildByName("gameOverLabel");
        let resultBoardNode = this.gameOverMenu.getChildByName("resultBoard");
        let startButtonNode = this.gameOverMenu.getChildByName("startButton");
        let currentScoreNode = resultBoardNode.getChildByName("currentScore");
        let bestScoreNode = resultBoardNode.getChildByName("bestScore");
        let medalNode = resultBoardNode.getChildByName("medal");

        // 保存最高分到本地
        const KEY_BEST_SCORE = "bestScore";
        let bestScore = cc.sys.localStorage.getItem(KEY_BEST_SCORE);
        if (bestScore === "null" || this.score > bestScore) {
            bestScore = this.score;
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
                cc.fadeIn(0.2),
                cc.sequence(
                    cc.moveBy(0.2, cc.p(0, 10)),
                    cc.moveBy(0.5, cc.p(0, -10))
                )
            ),
            ()=>showNode(
                resultBoardNode,
                cc.moveTo(0.5, cc.p(resultBoardNode.x, -250)).easing(cc.easeCubicActionOut()),
                ()=>showNode(
                    startButtonNode,
                    cc.fadeIn(0.5))
            )
        );
        this.scheduleOnce(showNodeFunc, 0.55);
    },

    /** 开始游戏或者移动小鸟 */
    _startGameOrJumpBird(){
        if (this.bird.state === Bird.State.Ready) {
            this._gameStart();
        } else {
            this.bird.rise();
        }
    },

    _registerInput () {
        cc.eventManager.addListener({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed: function (keyCode, event) {
                this._startGameOrJumpBird();
            }.bind(this)
        }, this.node);
        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            onTouchBegan: function (touch, event) {
                this._startGameOrJumpBird();
                return true;
            }.bind(this)
        }, this.node);
    },

    _enableInput: function (enable) {
        if (enable) {
            cc.eventManager.resumeTarget(this.node);
        } else {
            cc.eventManager.pauseTarget(this.node);
        }
    },
});