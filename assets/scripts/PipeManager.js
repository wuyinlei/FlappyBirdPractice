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
        this.isRunning = false; //运行标志位false
    },

    /** 开始产生管道 */
    startSpawn() {
        this._spawnPipe();
        let spawnInterval = Math.abs(this.pipeSpacing / this.pipeMoveSpeed);
        this.schedule(this._spawnPipe, spawnInterval); //执行
        this.isRunning = true; //正在运行标志 为true
    },

    _spawnPipe() {
        //let 定义参数，用于块级代码里面
        let pipeGroup = null;
        if (cc.pool.hasObject(PipeGroup)) { //查看缓存池中是否有PipeGroup对象，如果有的话，就直接取出来进行复用
            pipeGroup = cc.pool.getFromPool(PipeGroup); //获取对象中的制定对象
        } else { //如果缓存池中没有这个对象，那么久需要重新创建  复制给定的对象
            pipeGroup = cc.instantiate(this.pipePrefab).getComponent(PipeGroup);
        }
        this.node.addChild(pipeGroup.node); //添加孩子节点
        pipeGroup.node.active = true;  //状态  当前节点的自身激活状态，如果父节点没有被激活，那么子节点就是设置true 也是没响应的
        pipeGroup.init(this); //初始化管道对象
        this.pipeList.push(pipeGroup); //往集合中添加
    },

    /** 回收水管 */
    recyclePipe(pipe) {
        pipe.node.removeFromParent(); //从父节点中移除
        pipe.node.active = false;  //状态改为fasle
        cc.pool.putInPool(pipe); //加入对象到对象池中
    },

    /** 获取下个未通过的水管 */
    getNext() {
        //如果数组是空的，那么不进行任何操作，返回undefined  该方法不创建新的数组，而是直接修改原有的数组
        return this.pipeList.shift(); //用于把数组中的第一个元素从其中删除，并返回第一个元素的值
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
