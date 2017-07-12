module fighter {
    /**
     * 主游戏容器
     */
    export class GameContainer extends egret.DisplayObjectContainer {
        private stageW: number;
        private stageH: number;
        /**开始按钮*/
        private btnStart;
        /**可滚动背景*/
        private bg: fighter.BgMap;
        /**我的飞机*/
        private myFighter: fighter.Airplane;
        /**我的子弹*/
        private myBullets: fighter.Bullet[] = [];
        /**敌人的飞机*/
        private enemyFighters: fighter.Airplane[] = [];
        /**触发创建敌机的间隔*/
        private enemyFightersTimer: egret.Timer = new egret.Timer(1000);
        /**敌人的子弹*/
        private enemyBullets: fighter.Bullet[] = [];
        /**成绩显示*/
        private scorePanel: fighter.ScorePanel;
        /**我的成绩*/
        private myScore: number = 0;
        /**最后时间*/
        private _lastTime: number;

        public constructor() {
            super();
            this._lastTime = egret.getTimer();
            this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
        }
        /**初始化*/
        private onAddToStage(event: egret.Event) {
            this.removeEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
            this.createGameScene();
        }
        /**创建游戏场景*/
        private createGameScene(): void {
            this.stageW = this.stage.stageWidth;
            this.stageH = this.stage.stageHeight;

            //背景
            this.bg = new fighter.BgMap();//创建可滚动的背景
            this.addChild(this.bg);
            //开始按钮
            this.btnStart = fighter.createBitmapByName("btnStart");//开始按钮
            this.btnStart.x = (this.stageW - this.btnStart.width) / 2;//居中定位
            this.btnStart.y = (this.stageH - this.btnStart.height) / 2;//居中定位
            this.btnStart.touchEnabled = true;//开启触碰
            this.btnStart.addEventListener(egret.TouchEvent.TOUCH_TAP, this.gameStart, this);//点击按钮开始游戏
            this.addChild(this.btnStart);
            //我的飞机
            this.myFighter = new fighter.Airplane(RES.getRes("f1"), 100, "f1");
            this.myFighter.y = this.stageH - this.myFighter.height - 50;
            this.addChild(this.myFighter);
            //我的分数
            this.scorePanel = new fighter.ScorePanel();
            //预创建
            this.preCreatedInstance();
        }
        /**预创建一些对象，减少游戏时的创建消耗*/
        private preCreatedInstance(): void {
            var i: number = 0;
            var objArr: any[] = [];
            for (i = 0; i < 20; i++) {
                var bullet = fighter.Bullet.produce("b1");
                objArr.push(bullet);
            }
            for (i = 0; i < 20; i++) {
                bullet = objArr.pop();
                fighter.Bullet.reclaim(bullet);
            }
            for (i = 0; i < 20; i++) {
                var bullet = fighter.Bullet.produce("b2");
                objArr.push(bullet);
            }
            for (i = 0; i < 20; i++) {
                bullet = objArr.pop();
                fighter.Bullet.reclaim(bullet);
            }
            for (i = 0; i < 20; i++) {
                var enemyFighter: fighter.Airplane = fighter.Airplane.produce("f2", 1000);
                objArr.push(enemyFighter);
            }
            for (i = 0; i < 20; i++) {
                enemyFighter = objArr.pop();
                fighter.Airplane.reclaim(enemyFighter);
            }
        }
        /**游戏开始*/
        private gameStart(): void {
            this.myScore = 0;
            this.removeChild(this.btnStart);
            this.bg.start();

            this.touchEnabled = true;
            this.addEventListener(egret.Event.ENTER_FRAME, this.gameViewUpdate, this);
            this.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.touchHandler, this);

            this.myFighter.x = (this.stageW - this.myFighter.width) / 2;
            this.myFighter.fire();
            this.myFighter.blood = 10;
            this.myFighter.addEventListener("createBullet", this.createBulletHandler, this);

            this.enemyFightersTimer.addEventListener(egret.TimerEvent.TIMER, this.createEnemyFighter, this);
            this.enemyFightersTimer.start();

            if (this.scorePanel.parent == this)
                this.removeChild(this.scorePanel);

        }

        /**更新游戏界面 */
        private gameViewUpdate(event: egret.Event) {
            //为了防止fps下降造成回收满 生成快 进而导致DRAW数量失控 需要计算一个系数 当fps下降时 让运动速度加快
            var nowTime: number = egret.getTimer();
            var fps: number = 1000 / (nowTime - this._lastTime);
            this._lastTime = nowTime;
            var speedOffSet: number = 60 / fps;

            //我的子弹运动
            var i: number = 0;
            var bullet: fighter.Bullet;
            var myBulletCount: number = this.myBullets.length;
            for (; i < myBulletCount; i++) {
                bullet = this.myBullets[i];
                if (bullet.y < -bullet.height) {
                    this.removeChild(bullet);
                    Bullet.reclaim(bullet);
                    this.myBullets.splice(i, 1);
                    i--;
                    myBulletCount--;
                }
                bullet.y -= 12 * speedOffSet;
            }
            //敌人飞机运动
            var theFighter: fighter.Airplane;
            var enemyFightersCount: number = this.enemyFighters.length;
            for (i = 0; i < enemyFightersCount; i++) {
                theFighter = this.enemyFighters[i];
                if (theFighter.y > this.stageH) {
                    this.removeChild(theFighter);
                    Airplane.reclaim(theFighter);
                    theFighter.removeEventListener("createBullet", this.createBulletHandler, this);
                    theFighter.stopFire();
                    this.enemyFighters.splice(i, 1);
                    i--;
                    enemyFightersCount--;
                }
                theFighter.y += 4 * speedOffSet;
            }
            //敌人子弹运动
            var enemyBulletsCount: number = this.enemyBullets.length;
            for (i = 0; i < enemyBulletsCount; i++) {
                bullet = this.enemyBullets[i];
                if (bullet.y > this.stageH) {
                    this.removeChild(bullet);
                    Bullet.reclaim(bullet);
                    this.enemyBullets.splice(i, 1);
                    i--;
                    enemyBulletsCount--;
                }
                bullet.y += 8 * speedOffSet;
            }

            this.gameHitObserve();

        }
        /**响应Touch*/
        private touchHandler(event: egret.TouchEvent) {
            if (event.type == egret.TouchEvent.TOUCH_MOVE) {
                var tx: number = event.localX;
                tx = Math.max(0, tx);
                tx = Math.min(this.stageW - this.myFighter.width, tx);
                this.myFighter.x = tx;
            }
        }

        /**创建子弹(包括我的子弹和敌机的子弹)*/
        private createBulletHandler(event: egret.Event) {
            var bullet: fighter.Bullet;
            if (event.target == this.myFighter) {
                //我的子弹
                for (var i: number = 0; i < 2; i++) {
                    bullet = fighter.Bullet.produce("b1");
                    bullet.x = i == 0 ? (this.myFighter.x + 10) : (this.myFighter.x + this.myFighter.width - 22);
                    bullet.y = this.myFighter.y + 30;
                    this.addChildAt(bullet, this.numChildren - 1 - this.enemyFighters.length);
                    this.myBullets.push(bullet);
                }

            } else {
                //敌机子弹
                var theFighter: fighter.Airplane = event.target;
                bullet = fighter.Bullet.produce("b2");
                bullet.x = theFighter.x + 28;
                bullet.y = theFighter.y + 10;
                this.addChildAt(bullet, this.numChildren - 1 - this.enemyFighters.length);
                this.enemyBullets.push(bullet);
            }
        }
        /**创建敌机*/
        private createEnemyFighter(event: egret.TimerEvent) {
            var enemyFighter: fighter.Airplane = fighter.Airplane.produce("f2", 1000);
            enemyFighter.x = Math.random() * (this.stageW - enemyFighter.width);
            enemyFighter.y = -enemyFighter.height - Math.random() * 300;
            enemyFighter.addEventListener("createBullet", this.createBulletHandler, this);
            enemyFighter.fire();
            this.addChildAt(enemyFighter, this.numChildren - 1);
            this.enemyFighters.push(enemyFighter);
        }
        /**碰撞检测 */
        private gameHitObserve() {
            var i: number, j: number;
            var bullet: fighter.Bullet;
            var theFighter: fighter.Airplane;
            var myBulletCount: number = this.myBullets.length;
            var enemyBulletsCount: number = this.enemyBullets.length;
            var enemyFightersCount: number = this.enemyFighters.length;
            //记录 需要消失的子弹和飞机
            var delBullets: fighter.Bullet[] = [];
            var delFighters: fighter.Airplane[] = [];
            //我的子弹可以消灭飞机
            for (i = 0; i < myBulletCount; i++) {
                bullet = this.myBullets[i];
                for (j = 0; j < enemyFightersCount; j++) {
                    theFighter = this.enemyFighters[j];
                    if (fighter.GameUtil.hitTest(theFighter, bullet)) {
                        theFighter.blood -= 2;
                        if (delBullets.indexOf(bullet) == -1)
                            delBullets.push(bullet);

                        if (theFighter.blood <= 0 && delFighters.indexOf(theFighter) == -1)
                            delFighters.push(theFighter);
                    }
                }
            }

            //敌人的子弹可以减我血
            for (i = 0; i < enemyBulletsCount; i++) {
                bullet = this.enemyBullets[i];
                if (fighter.GameUtil.hitTest(this.myFighter, bullet)) {
                    this.myFighter.blood -= 1;
                    if (delBullets.indexOf(bullet) == -1)
                        delBullets.push(bullet);
                }
            }
            //敌人的飞机可以撞毁我
            for (i = 0; i < enemyFightersCount; i++) {
                theFighter = this.enemyFighters[i];
                if (fighter.GameUtil.hitTest(this.myFighter, theFighter)) {
                    this.myFighter.blood -= 10;
                }
            }

            if (this.myFighter.blood <= 0) {
                this.gameStop();
            } else {
                while (delBullets.length > 0) {
                    bullet = delBullets.pop();
                    this.removeChild(bullet);
                    if (bullet.textureName == "b1")
                        this.myBullets.splice(this.myBullets.indexOf(bullet), 1);
                    else
                        this.enemyBullets.splice(this.enemyBullets.indexOf(bullet), 1);
                    fighter.Bullet.reclaim(bullet);
                }

                this.myScore += delFighters.length;

                while (delFighters.length > 0) {
                    theFighter = delFighters.pop();
                    theFighter.stopFire();
                    theFighter.removeEventListener("createBullet", this.createBulletHandler, this);
                    this.removeChild(theFighter);
                    this.enemyFighters.splice(this.enemyFighters.indexOf(theFighter), 1);
                    fighter.Airplane.reclaim(theFighter);
                }
            }

        }
        /**游戏结束 */
        private gameStop() {
            this.addChild(this.btnStart);
            this.bg.pause();
            this.removeEventListener(egret.Event.ENTER_FRAME, this.gameViewUpdate, this);
            this.removeEventListener(egret.TouchEvent.TOUCH_MOVE, this.touchHandler, this);
            this.myFighter.stopFire();
            this.myFighter.removeEventListener("createBullet", this.createBulletHandler, this);
            this.enemyFightersTimer.removeEventListener(egret.TimerEvent.TIMER, this.createEnemyFighter, this);
            this.enemyFightersTimer.stop();
            //清理子弹
            var i: number = 0;
            var bullet: fighter.Bullet;
            while (this.myBullets.length > 0) {
                bullet = this.myBullets.pop();
                this.removeChild(bullet);
                fighter.Bullet.reclaim(bullet);
            }
            while (this.enemyBullets.length > 0) {
                bullet = this.enemyBullets.pop();
                this.removeChild(bullet);
                fighter.Bullet.reclaim(bullet);
            }
            //清理飞机
            var theFighter: fighter.Airplane;
            while (this.enemyFighters.length > 0) {
                theFighter = this.enemyFighters.pop();
                theFighter.stopFire();
                theFighter.removeEventListener("createBullet", this.createBulletHandler, this);
                this.removeChild(theFighter);
                fighter.Airplane.reclaim(theFighter);
            }
            //显示成绩
            this.scorePanel.showScore(this.myScore);
            this.scorePanel.x = (this.stageW - this.scorePanel.width) / 2;
            this.scorePanel.y = 100;
            this.addChild(this.scorePanel);
        }
    }
}
