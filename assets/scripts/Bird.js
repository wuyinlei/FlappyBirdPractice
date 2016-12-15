const State = cc.Enum({
    /** 游戏开始前的准备状态 */
    Ready: -1,
    /** 小鸟上升中 */
    Rise: -1,
    /** 小鸟自由落体中 */
    FreeFall: -1,
    /** 小鸟碰撞到管道坠落中 */
    Drop: -1,
    /** 小鸟已坠落到地面静止 */
    Dead: -1,
});

cc.Class({
    statics: {
        State: State
    },

    extends: cc.Component,

    properties: {
        /** 上抛初速度，单位：像素/秒 */
        initRiseSpeed: 700,
        /** 重力加速度，单位：像素/秒的平方 */
        gravity: 2000,
        /** 小鸟的状态 */
        state: {
            default: State.Ready,
            type: State,
        },
        /** 地面节点 */
        ground: {
            default: null,
            type: cc.Node
        },
        /** 小鸟向上飞的声音 */
        riseAudio: {
            default: null,
            url: cc.AudioClip
        },
        /** 小鸟碰撞到水管后开始坠落的声音 */
        dropAudio: {
            default: null,
            url: cc.AudioClip
        },
        /** 小鸟发生碰撞的声音 */
        hitAudio: {
            default: null,
            url: cc.AudioClip
        },
    },

    /**
     * 用于数据、对象的初始化
     * 
     * @param {game} 小鸟所在的游戏对象
     */
    init(game) { 
        this.game = game;  //定义一个游戏对象并且赋值
        this.state = State.Ready; //状态改为ready
        this.currentSpeed = 0; //速度 为0
        //获取节点上指定类型的组件，如果节点有附加指定类型的组件，则返回，如果没有则为空。<br/>
        //传入参数也可以是脚本的名称。
        this.anim = this.getComponent(cc.Animation); //动画
        this.anim.playAdditive("birdFlapping");//播放当前或者指定的动画
    },

    /** 开发起飞 */
    startFly() {
        this._getNextPipe(); //获取到水管对象
        this.anim.stop("birdFlapping");//停止动画
        this.rise();
    },

    /** 获取到下一水管 */
    _getNextPipe() {
        this.nextPipe = this.game.pipeManager.getNext();
    },

    /** 每一帧的更新都会走这个方法 */
    update(dt) {
        if (this.state === State.Ready || this.state === State.Dead) {
            return;
        }
        this._updatePosition(dt); //更新位置
        this._updateState(dt); //更新状态
        this._detectCollision(); //检测碰撞
        this._fixBirdFinalPosition(); //修复最后落地位置
    },

    /** 更新位置 */
    _updatePosition(dt) {
        var flying = this.state === State.Rise
            || this.state === State.FreeFall
            || this.state === State.Drop;
        if (flying) {
            this.currentSpeed -= dt * this.gravity;
            this.node.y += dt * this.currentSpeed;
        }
    },

    /** 更新状态 */
    _updateState(dt) {
        switch (this.state) {
            case State.Rise: //上升
                if (this.currentSpeed < 0) {
                    this.state = State.FreeFall;
                    this._runFallAction();
                }
                break;
            case State.Drop: //坠落
                if (this._detectCollisionWithBird(this.ground)) {
                    this.state = State.Dead;//修改状态
                }
                break;
        }
    },

    /** 检测碰撞 */
    _detectCollision() {
        if (!this.nextPipe) {  //没有下一个管道
            return;
        }
        if (this.state === State.Ready || this.state === State.Dead || this.state === State.Drop) {
            return;
        }
        let collideWithPipe = false;  //和管道的碰撞标志
        // 检测小鸟与上方管子的碰撞
        if (this._detectCollisionWithBird(this.nextPipe.topPipe)) {
            collideWithPipe = true;
        }
        // 检测小鸟与下方管子的碰撞
        if (this._detectCollisionWithBird(this.nextPipe.bottomPipe)) {
            collideWithPipe = true;
        }
        // 检测小鸟与地面的碰撞
        let collideWithGround = false;  //和地面碰撞的标志
        if (this._detectCollisionWithBird(this.ground)) {
            collideWithGround = true;
        }
        // 处理碰撞结果  
        if (collideWithPipe || collideWithGround) {  //碰撞了
            //播放音频
            cc.audioEngine.playEffect(this.hitAudio);

            if (collideWithGround) { // 与地面碰撞
                this.state = State.Dead;
            } else { // 与水管碰撞
                this.state = State.Drop;
                this._runDropAction();
                //调度一个只运行一次的回调函数
                this.scheduleOnce(() => {
                    cc.audioEngine.playEffect(this.dropAudio);
                }, 0.3);
            }

            this.anim.stop();
            this.game.gameOver();
        } else { // 处理没有发生碰撞的情况  那么就正常逻辑  得分  越过管道
            let birdLeft = this.node.x; //获取到小鸟左侧的x轴坐标
            let pipeRight = this.nextPipe.node.x + this.nextPipe.topPipe.width //获取到水管右侧的x轴坐标
            let crossPipe = birdLeft > pipeRight; //得到以上两个x轴坐标的差值
            if (crossPipe) {  //如果差值大于0  说明已经过去了
                this.game.gainScore(); //得分逻辑
                this._getNextPipe(); //获取下一个水管
            }
        }
    },

    /** 修正最后落地位置 */
    _fixBirdFinalPosition() {
        if (this._detectCollisionWithBird(this.ground)) {
            this.node.y = this.ground.y + this.node.width / 2;
        }
    },

    /**  检测是否碰撞*/
    _detectCollisionWithBird(otherNode) {
        //检测一个矩形和另一个矩形是否有接触的地方，如果有接触，证明碰撞了，就执行碰撞逻辑
        //返回节点在世界坐标系下的对齐轴向的包围盒（AABB）。<br/>
        //该边框包含自身和已激活的子节点的世界边框。
        return cc.rectIntersectsRect(this.node.getBoundingBoxToWorld(), otherNode.getBoundingBoxToWorld());
    },

    /** 上升 */
    rise() {
        this.state = State.Rise;
        this.currentSpeed = this.initRiseSpeed;
        this._runRiseAction();
        cc.audioEngine.playEffect(this.riseAudio);
    },

    /** 执行上升逻辑 */
    _runRiseAction() {
        this.node.stopAllActions();
        //倾斜30度
        let jumpAction = cc.rotateTo(0.3, -30).easing(cc.easeCubicActionOut());
        this.node.runAction(jumpAction);
    },

    /** 执行碰撞逻辑 */
    _runFallAction(duration = 0.6) {
        this.node.stopAllActions();
        let dropAction = cc.rotateTo(duration, 90).easing(cc.easeCubicActionIn());
        this.node.runAction(dropAction);
    },

    /** 坠落逻辑 */
    _runDropAction() {
        if (this.currentSpeed > 0) {
            this.currentSpeed = 0;
        }
        this._runFallAction(0.4);
    }
});
