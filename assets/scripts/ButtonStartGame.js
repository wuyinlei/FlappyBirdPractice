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

    /** 开始游戏 */
    startGame(){
        cc.audioEngine.playEffect(this.swooshingAudio); //播放声音
        this.maskLayer.active = true; //状态设置true
        this.maskLayer.opacity = 0;//透明色
        this.maskLayer.color = cc.Color.BLACK;
        this.maskLayer.runAction( //执行动作  执行并返回改执行的动作，该节点将会变成动作的目标，调用runAction的时候，
            cc.sequence(
                cc.fadeIn(0.2),
                cc.callFunc(()=> {
                    // 重新加载场景
                    cc.director.loadScene('game');
                }, this)
            )
        );
    }
});
