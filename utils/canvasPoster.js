/*
    todo 
    1.process方法能写在class内部

*/
export class canvasPoster {
    constructor (canvasId, source) {
        this.initCanvas(canvasId, source)
    }

    // 初始化canvasPoster
    initCanvas(canvasId, source) {
        this.canvasId = canvasId
        this.source = source
        this.getUnit()
        this.checkSource()
        this.createCanvas(this.canvasId)
    }


    
    // 异步 获取单位像素, 设置 canvaswidth canvasHeight
    getUnit() {
        wx.getSystemInfo({
            success: (res) => {
                this.unit = 750 / res.windowWidth
                this.source.canvasHeight = this.getResize(this.source.canvasHeight)
                this.source.canvasWidth = this.getResize(this.source.canvasWidth)
            },
            fail: (err) => {
                console.log(err)
            }
        })
    }

    // 检查source参数
    checkSource() {
        let paramsList = ['imageArr', 'canvasWidth', 'canvasHeight']
        if (!this.source) throw new Error('source 参数错误')
        
        paramsList.forEach(key => {
            if (!(key in this.source)) throw new Error(`source 缺失必填参数${key}`)
            if (key === 'imageArr' && !this.source[key].length) throw new Error('无可用图片资源 请检查 source.imageArr')
        })
    }

    // 生成canvas 对象
    createCanvas(canvasId) {
        this.ctx = wx.createCanvasContext(canvasId)
    }

    // 异步 生成canvas图片资源
    /*
    *   canvasId --canvasId [string]
    *   source  -- text source || image source* || canvasWidth* || canvasHeight*   [object] *必传
    *   drawProcess -- 自定义canvas画图过程 [function]
    */
    drawCanvas(process) {
        console.log(this.canvasId, this.source, this.ctx,'ooooooooooo')

        return new Promise((resolve, reject) => {

            console.log(this.source)

            Promise.all(
                // 异步请求图片资源 返回数据以px为单位
                this.getImageListbyAsy(this.source.imageArr),
                this.getImageListbyAsy(this.source.picArr)
            ).then(res => {
                this.source.resImg = res
                // res[0] bgImg res[1] logo res[2] qrcode
                console.log(this.ctx, 'tetetetet canvasid')
                console.log(res,'处理画布图片res')
                // 检查 canvas 宽高
                console.log(this.source.canvasWidth, this.source.canvasHeight,'宽高')
                // 开始 画图
                
                // 由class内部参数 传参 到 对应page定制method
                process(this)
                console.log('++++++++++++++++')
    
                // 结束 画图
                // canvas 图片制作
                this.ctx.draw(true, () => {
                    console.log('绘制完成')
                    wx.canvasToTempFilePath({
                        x: 0,
                        y: 0,
                        width: this.source.canvasWidth,
                        height: this.source.canvasHeight,
                        canvasId: this.canvasId,
                        success: (res) => {
                            console.log(res.tempFilePath)
                            // isReady canvas and canvas Img
                            // 返回canvas生成的图片
                            resolve(res.tempFilePath)
                        },
                        fail: (err) => {
                            console.log(err,'%%%%%%%%%%%%%%%%%%%%%%%%%%')
                            reject(err)
                        }
                    })
                })
            }).catch(err=>{
                console.log(err,'eeeeeeeeeeeeeeee')
            })
        })
    }

    // px to rpx 获取等比例缩放尺寸
    getResize(num) {
        if (this.unit) {
            return num * this.unit
        } else {
            this.getUnit()
        }
    }
    // 异步 返回本地图片数据(px为单位)
    getImageListbyAsy(imgList) {
        let imgResults = []
        console.log(imgList, 'img lisss')
        if(!imgList)return;
        if (imgList.length > 0) {
        for (let item of imgList) {
            // 异步获取图片列表
            imgResults.push(new Promise((resolve, reject) => {
                wx.getImageInfo({
                    src: item,
                    success: function (res) {
                        // success
                        resolve(res)
                    },
                    fail: function (err) {
                        // faile
                        reject(err)
                    }
                })
            }))
        }
        }
        console.log(imgResults,'imgResultsimgResults')
        return imgResults
    }

    // 文字内容，自动换行 1、文本 2、左距离  3、顶部距离 4、要求文本的宽度, 5.字体大小 6、最大行数 7、行高 
    drawText (str, left, top, canvasWidth, fontSize, maxline, lineheight) {
        var lineWidth = 0;
        var lineChangeTimes = 0; //换行次数
        var lastSubStrIndex = 0; //每次开始截取的字符串的索引
        // 替换所有换行符 为空""
        str = str.replace(/\n/g, "")
        
        if (!fontSize) return console.log('无法获取到字体高度')
        
        for (let i = 0; i < str.length; i++) {
            lineWidth += this.ctx.measureText(str[i]).width;

            if (lineWidth > (canvasWidth - left)) {
                // 设置 不超出第maxline行,默认1行
                if (lineChangeTimes < (maxline ? maxline: 1)) {
                    this.ctx.fillText(str.substring(lastSubStrIndex, i), left, top); //绘制截取部分
                    top += fontSize + 5*this.unit; // 字体的高度
                    lineWidth = 0;
                    lastSubStrIndex = i;
                    // titleHeight += 30;
                    lineChangeTimes ++
                } else {
                    console.log(str, 'over line')
                    str = str.substring(0, i - 3) + '. . .'
                    this.ctx.fillText(str.substring(lastSubStrIndex, i + 2), left, top); //绘制截取部分
                    top += fontSize+5*this.unit; // 字体的高度
                    lineWidth = 0;
                    lastSubStrIndex = i;
                    // titleHeight += 30;
                    break
                }
            }

            if (i == str.length - 1) { //绘制剩余部分
                this.ctx.fillText(str.substring(lastSubStrIndex, i + 1), left, top);
            }
        }

        // 标题border-bottom 线距顶部距离
        // titleHeight = titleHeight + 10;
    }
    /**
     * 
     * @param {CanvasContext} ctx canvas上下文
     * @param {number} x 圆角矩形选区的左上角 x坐标
     * @param {number} y 圆角矩形选区的左上角 y坐标
     * @param {number} w 圆角矩形选区的宽度
     * @param {number} h 圆角矩形选区的高度
     * @param {number} r 圆角的半径
     */
    roundRect(ctx, x, y, w, h, r,bgc) {
        console.log(ctx, x, y, w, h, r, 'roundRect')
        // 开始绘制
        ctx.beginPath()
        // 因为边缘描边存在锯齿，最好指定使用 transparent 填充
        // 这里是使用 fill 还是 stroke都可以，二选一即可
        // ctx.setFillStyle('#FF6B00')
        if (bgc) {
            ctx.setFillStyle(bgc)
        } else {
            ctx.setStrokeStyle('transparent')
        }
        
        
        // 左上角
        ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5)
        
        // border-top
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + w - r, y)
        ctx.lineTo(x + w, y + r)
        // 右上角
        ctx.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 2)
        
        // border-right
        ctx.lineTo(x + w, y + h - r)
        ctx.lineTo(x + w - r, y + h)

        // 右下角
        ctx.arc(x + w - r, y + h - r, r, 0, Math.PI * 0.5)
        
        // border-bottom
        ctx.lineTo(x + r, y + h)
        ctx.lineTo(x, y + h - r)

        // 左下角
        ctx.arc(x + r, y + h - r, r, Math.PI * 0.5, Math.PI)
        
        // border-left
        ctx.lineTo(x, y + r)
        ctx.lineTo(x + r, y)
        
        // 这里是使用 fill 还是 stroke都可以，二选一即可，但是需要与上面对应
        ctx.fill()
        // ctx.stroke()
        ctx.closePath()
        // 剪切
        ctx.clip()
    }
    /*
    *  定制canvas 画图 过程秒杀分享详情
    *  canvasData = class canvasPoster(this)
    */
    processSpkShare(canvasData) {
        console.log(canvasData, 'datat')
        let {ctx, unit} = canvasData
        let {resImg, textArr, canvasHeight, canvasWidth} = canvasData.source

        // 生成背景图 resImg[0] 商品图片 resImg[1] 分享二维码(暂无) resImg[2]
        // textArr  0.商品名称1.商品价格

        ctx.drawImage(resImg[0].path, 0, 0, resImg[0].width, resImg[0].height, 0, 0, canvasWidth, canvasHeight)
        
        ctx.save()
        canvasData.roundRect(ctx, 58*unit,150*unit,400*unit, 540*unit, 10*unit,'#FF9B19')
        ctx.restore()

        // 设置商品图片
        ctx.save()
        canvasData.roundRect(ctx, 60*unit, 152*unit,396*unit, 396*unit, 10*unit)
        ctx.drawImage(resImg[1].path, 0, 0, resImg[1].width, resImg[1].height, 60*unit, 152*unit,396*unit, 396*unit)
        ctx.restore()
        
        let labelWid = wx.getStorageSync('spkLabelWid');
        if (!labelWid) {
            wx.setStorageSync('spkLabelWid', ctx.measureText(textArr[0]).width)
            labelWid = ctx.measureText(textArr[0]).width;
        }
        let t0width = labelWid * textArr[0].length

        console.log(textArr,'textArrtextArr')

        if (textArr[0].length == 5) {
            ctx.save()
            // 设置文本颜色
            canvasData.roundRect(ctx, 70*unit, 574*unit,t0width + 45, 36*unit, 20*unit, '#EF5E29')
            ctx.restore()

            ctx.save()
            ctx.setFillStyle('#fff')
            ctx.setFontSize(24*unit)
            canvasData.drawText(textArr[0], 82*unit, 600*unit, 230*unit, 24*unit, 2)
            ctx.restore()
        } else if (textArr[0].length == 4) {
            ctx.save()
            // 设置文本颜色
            canvasData.roundRect(ctx, 65*unit, 574*unit,t0width+80, 36*unit, 20*unit, '#EF5E29')
            ctx.restore()
            
            ctx.save()
            ctx.setFillStyle('#fff')
            ctx.setFontSize(24*unit)
            canvasData.drawText(textArr[0], 82*unit, 600*unit, 230*unit, 24*unit, 2)
            ctx.restore()
        }

        // 设置拼团文案
        ctx.save()
        ctx.setFillStyle('#FF0000')
        ctx.setFontSize(24*unit)
        canvasData.drawText(textArr[1], 220*unit, 600*unit, 450*unit, 30*unit, 1)
        ctx.restore()

        // 拼团价
        ctx.save()
        ctx.setFillStyle('#FF0101')
        ctx.setFontSize(40*unit)
        canvasData.drawText(textArr[2], 300*unit, 600*unit, 450*unit, 30*unit, 1)
        ctx.restore()

        ctx.save()
        ctx.setFillStyle('#fff')
        ctx.setFontSize(24*unit)
        canvasData.drawText(textArr[3], 70*unit, 660*unit, 450*unit, 40*unit, 1)
        ctx.restore()


        // 商品名称
        ctx.save()
        ctx.setFillStyle('#999999')
        ctx.setFontSize(24*unit)
        canvasData.drawText(textArr[4], 74*unit, 750*unit, 300*unit, 24*unit, 1)
        ctx.restore()
        
        // 原价
        let t5width = ctx.measureText(textArr[5]).width

        ctx.save()
        ctx.setFillStyle('#fff')
        ctx.setFontSize(24*unit)
        canvasData.drawText(textArr[5], 68*unit, 660*unit, 450*unit, 40*unit, 1)
        ctx.restore()

        // 设置小程序二维码
        ctx.save()
        ctx.setFillStyle('#999999')
        ctx.setFontSize(22*unit)
        canvasData.drawText(textArr[6], 300*unit, 880*unit, 490*unit, 22*unit, 1)
        ctx.restore()

        ctx.save()
        ctx.beginPath()
        ctx.arc(385*unit,780*unit, 75*unit, 0, 2*Math.PI)
        ctx.clip()
        ctx.drawImage(resImg[2].path, 0, 0, resImg[2].width, resImg[2].height,310*unit,704*unit,150*unit,  150*unit)
        ctx.restore()

    }
}

