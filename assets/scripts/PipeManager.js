const PipeGroup = require('PipeGroup');

cc.Class({
    extends: cc.Component,

    properties: {
        /** 管道节点预制资源 */
        pipePrefab: cc.Prefab,
        /** 管道移动速度，单位px/s */
        pipeMoveSpeed: -300,
        /** 每对管道之间的间距，单位px */
        pipeSpacing: 1000
    },

    onLoad() {
        this.pipeList = [];
        this.isRunning = false;
    },

    startSpawn(){
        this._spawnPipe();
        let spawnInterval = Math.abs(this.pipeSpacing / this.pipeMoveSpeed);
        this.schedule(this._spawnPipe, spawnInterval);
        this.isRunning = true;
    },

    _spawnPipe(){
        let pipeGroup = null;
        if (cc.pool.hasObject(PipeGroup)) { //查看缓存池中是否有PipeGroup对象，如果有的话，就直接取出来进行复用
            pipeGroup = cc.pool.getFromPool(PipeGroup); //获取对象中的制定对象
        } else { //如果缓存池中没有这个对象，那么久需要重新创建  复制给定的对象
            pipeGroup = cc.instantiate(this.pipePrefab).getComponent(PipeGroup);
        }
        this.node.addChild(pipeGroup.node); //添加孩子节点
        pipeGroup.node.active = true;  //状态
        pipeGroup.init(this);
        this.pipeList.push(pipeGroup); //集合中添加
    },

    /** 回收水管 */
    recyclePipe(pipe) {
        pipe.node.removeFromParent(); //从父节点中移除
        pipe.node.active = false;  //状态改为fasle
        cc.pool.putInPool(pipe); //加入对象到对象池中
    },

    /** 获取下个未通过的水管 */
    getNext() {
        return this.pipeList.shift();
    },

    /** 重置 */
    reset() {
        //根据指定的回调函数和调用对象。
		//如果需要取消 update 定时器，请使用 unscheduleUpdate()。
        this.unschedule(this._spawnPipe);
        this.pipeList = [];
        this.isRunning = false;
    }
});
