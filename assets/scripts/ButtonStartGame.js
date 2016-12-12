cc.Class({
    extends: cc.Component,

    properties: {
        swooshingAudio: {
            default: null,
            url: cc.AudioClip
        },
        
        maskLayer: {
            default: null,
            type: cc.Node
        }
    },

    startGame (){
        cc.audioEngine.playEffect(this.swooshingAudio);
        this.maskLayer.active = true;
        this.maskLayer.opacity = 0;
        this.maskLayer.color = cc.Color.BLACK;
        this.maskLayer.runAction(
            //顺序执行动作，创建的动作将按顺序依次运行
                cc.sequence(
                        cc.fadeIn(0.2),//渐显效果。
                        cc.callFunc(() => {//执行回调函数。
                            //重新加载场景
                            cc.director.loadScene('game');//运行指定场景。
                        }, this)
                    )
            );
    }
});
