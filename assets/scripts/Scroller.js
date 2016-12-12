cc.Class({
    extends: cc.Component,

    properties: {
        //滚动的速度 单位px/s
        speed: -300,
        // x到达此位置后开始从头滚动
        resetX: -300
    },

    // use this for initialization
    onLoad: function () {
        this.canScroll = true;
    },

    // called every frame, uncomment this function to activate update callback
     update: function (dt) {
        if(!this.canScroll){
            return;
        }
        this.node.x += this.speed * dt;
        if(this.node.x <= this.resetX){
            this.node.x -= this.resetX;
        }
     },
     
     stopScroll (){
         this.canScroll = false;
     },
     
     startScroll (){
         this.canScroll = true;
     }
     
});
