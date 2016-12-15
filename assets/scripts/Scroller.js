cc.Class({
    extends: cc.Component,

    properties: {
        // 滚动的速度，单位px/s
        speed: -300,
        // x到达此位置后开始重头滚动
        resetX: -300
    },

    onLoad(){
        this.canScroll = true;
    },

    update (dt) {
        if (!this.canScroll) {
            return;
        }
        this.node.x += this.speed * dt;
        if (this.node.x <= this.resetX) {
            this.node.x -= this.resetX;
        }
    },

    //停止滑动
    stopScroll (){
        this.canScroll = false;
    },

    //开始滑动
    startScroll(){
        this.canScroll = true;
    }
});