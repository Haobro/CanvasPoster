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
    *  定制canvas 画图 过程分享详情
    *  canvasData = class canvasPoster(this)
    */
    process(canvasData) {
        console.log(canvasData, 'canvasData')
        let {ctx, unit} = canvasData;
        let {resImg, resImg2, textArr, giftNameArr, couponTypeArr, couponAmountArr, canvasHeight, canvasWidth} = canvasData.source;

        // resImg对应imageArr  resImg2对应picArr
        // 生成背景图--resImg[0] 分享二维码--resImg[1]
        ctx.drawImage(resImg[0].path, 0, 0, resImg[0].width, resImg[0].height, 0, 0, canvasWidth, canvasHeight)
        ctx.save()
        ctx.beginPath()
        ctx.arc(522 * unit, 945 * unit, 75 * unit, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(resImg[1].path, 0, 0, resImg[1].width, resImg[1].height, 447 * unit, 870 * unit, 150 * unit, 150 * unit);
        ctx.restore()

        // 活动名称
        ctx.save()
        ctx.setFillStyle('#FFFFFF')
        ctx.setFontSize(60*unit)
        ctx.setTextAlign('center')
        canvasData.drawText(textArr[0], 336*unit, 123*unit, 880*unit, 60*unit, 1)
        ctx.restore()

        // 活动时间
        ctx.save()
        ctx.setFillStyle('#FFFFFF')
        ctx.setFontSize(30*unit)
        canvasData.drawText(textArr[1], 208*unit, 183*unit, 580*unit, 30*unit, 1)
        ctx.restore()

        // 活动提示
        ctx.save()
        ctx.setFillStyle('#FFFFFF')
        ctx.setFontSize(24*unit)
        ctx.setTextAlign('center')
        canvasData.drawText(textArr[2], 340*unit, 270*unit, 950*unit, 24*unit, 1)
        ctx.restore()

        // 门店名称
        ctx.save()
        ctx.setFillStyle('#FFFFFF')
        ctx.setFontSize(36*unit)
        ctx.setTextAlign('center')
        canvasData.drawText(textArr[3], 230*unit, 1006*unit, 620*unit, 36*unit, 1)
        ctx.restore()
        
        if (resImg2.length) {
            for (var i=0; i<resImg2.length; i++) {
                switch(i){
                    case 0: 
                        // 设置奖品图片
                        ctx.save()
                        canvasData.roundRect(ctx, 69*unit, 358*unit, 182*unit, 150*unit, 20*unit, 'transparent')
                        ctx.drawImage(resImg2[0].path, 0, 0, resImg2[0].width, resImg2[0].height, 110*unit, 368*unit, 100*unit, 90*unit)
                        ctx.restore()
                        // 设置奖品名称
                        ctx.save()
                        ctx.setFillStyle('#7F3E3E')
                        ctx.setTextAlign('center')
                        ctx.setFontSize(24*unit)
                        canvasData.drawText(giftNameArr[0], 160*unit, 492*unit, 336*unit, 24*unit, 1)
                        ctx.restore()
                        // 设置优惠券的类型
                        if (couponTypeArr[0] !== null) {
                            ctx.save()
                            ctx.setFillStyle('#FFFFFF')
                            ctx.setFontSize(20*unit)
                            if (couponTypeArr[0]==1||couponTypeArr[0]==2) {
                                ctx.fillText('￥', 120*unit, 440*unit)
                                
                            } else if (couponTypeArr[0]==3) {
                                ctx.fillText('折', 176*unit, 440*unit)
                            }
                            ctx.restore()
                        }
                        // 设置优惠券的值
                        if (couponAmountArr[0] !== null) {
                            ctx.save()
                            ctx.setFillStyle('#FFFFFF')
                            ctx.setFontSize(42*unit)
                            ctx.setTextAlign('center')
                            ctx.fillText(couponAmountArr[0], 160*unit, 440*unit, 60*unit)
                            ctx.restore()
                        }
                        break;
                    case 1: 
                        // 设置奖品图片
                        ctx.save()
                        canvasData.roundRect(ctx, 252*unit, 358*unit, 182*unit, 150*unit, 20*unit, 'transparent')
                        ctx.drawImage(resImg2[1].path, 0, 0, resImg2[1].width, resImg2[1].height, 292*unit, 368*unit, 100*unit, 90*unit)
                        ctx.restore()
                        // 设置奖品名称
                        ctx.save()
                        ctx.setFillStyle('#7F3E3E')
                        ctx.setTextAlign('center')
                        ctx.setFontSize(24*unit)
                        canvasData.drawText(giftNameArr[1], 345*unit, 492*unit, 536*unit, 24*unit, 1)
                        ctx.restore()
                        // 设置优惠券的类型
                        if (couponTypeArr[1] !== null) {
                            ctx.save()
                            ctx.setFillStyle('#FFFFFF')
                            ctx.setFontSize(20*unit)
                            if (couponTypeArr[1]==1||couponTypeArr[1]==2) {
                                ctx.fillText('￥', 302*unit, 440*unit)
                                
                            } else if (couponTypeArr[1]==3) {
                                ctx.fillText('折', 358*unit, 440*unit)
                            }
                            ctx.restore()
                        }
                        // 设置优惠券的值
                        if (couponAmountArr[1] !== null) {
                            ctx.save()
                            ctx.setFillStyle('#FFFFFF')
                            ctx.setFontSize(42*unit)
                            ctx.setTextAlign('center')
                            ctx.fillText(couponAmountArr[1], 342*unit, 440*unit, 60*unit)
                            ctx.restore()
                        }
                        break;
                    case 2: 
                        // 设置奖品图片
                        ctx.save()
                        canvasData.roundRect(ctx, 435*unit, 358*unit, 182*unit, 150*unit, 20*unit, 'transparent')
                        ctx.drawImage(resImg2[2].path, 0, 0, resImg2[2].width, resImg2[2].height, 478*unit, 368*unit, 100*unit, 90*unit)
                        ctx.restore()
                        // 设置奖品名称
                        ctx.save()
                        ctx.setFillStyle('#7F3E3E')
                        ctx.setTextAlign('center')
                        ctx.setFontSize(24*unit)
                        canvasData.drawText(giftNameArr[2], 528*unit, 492*unit, 716*unit, 24*unit, 1)
                        ctx.restore()
                        // 设置优惠券的类型
                        if (couponTypeArr[2] !== null) {
                            ctx.save()
                            ctx.setFillStyle('#FFFFFF')
                            ctx.setFontSize(20*unit)
                            if (couponTypeArr[2]==1||couponTypeArr[2]==2) {
                                ctx.fillText('￥', 485*unit, 440*unit)
                                
                            } else if (couponTypeArr[2]==3) {
                                ctx.fillText('折', 541*unit, 440*unit)
                            }
                            ctx.restore()
                        }
                        // 设置优惠券的值
                        if (couponAmountArr[2] !== null) {
                            ctx.save()
                            ctx.setFillStyle('#FFFFFF')
                            ctx.setFontSize(42*unit)
                            ctx.setTextAlign('center')
                            ctx.fillText(couponAmountArr[2], 524*unit, 440*unit, 60*unit)
                            ctx.restore()
                        }
                        break;
                    case 3: 
                        // 设置奖品图片
                        ctx.save()
                        canvasData.roundRect(ctx, 69*unit, 508*unit, 182*unit, 150*unit, 20*unit, 'transparent')
                        ctx.drawImage(resImg2[3].path, 0, 0, resImg2[3].width, resImg2[3].height, 110*unit, 518*unit, 100*unit, 90*unit)
                        ctx.restore()
                        // 设置奖品名称
                        ctx.save()
                        ctx.setFillStyle('#7F3E3E')
                        ctx.setTextAlign('center')
                        ctx.setFontSize(24*unit)
                        canvasData.drawText(giftNameArr[3], 160*unit, 642*unit, 336*unit, 24*unit, 1)
                        ctx.restore()
                        // 设置优惠券的类型
                        if (couponTypeArr[3] !== null) {
                            ctx.save()
                            ctx.setFillStyle('#FFFFFF')
                            ctx.setFontSize(20*unit)
                            if (couponTypeArr[3]==1||couponTypeArr[3]==2) {
                                ctx.fillText('￥', 120*unit, 590*unit)
                                
                            } else if (couponTypeArr[3]==3) {
                                ctx.fillText('折', 176*unit, 590*unit)
                            }
                            ctx.restore()
                        }
                        // 设置优惠券的值
                        if (couponAmountArr[3] !== null) {
                            ctx.save()
                            ctx.setFillStyle('#FFFFFF')
                            ctx.setFontSize(42*unit)
                            ctx.setTextAlign('center')
                            ctx.fillText(couponAmountArr[3], 160*unit, 590*unit, 60*unit)
                            ctx.restore()
                        }
                        break;
                    case 4: 
                        // 设置奖品图片
                        ctx.save()
                        canvasData.roundRect(ctx, 435*unit, 508*unit, 182*unit, 150*unit, 20*unit, 'transparent')
                        ctx.drawImage(resImg2[4].path, 0, 0, resImg2[4].width, resImg2[4].height, 478*unit, 518*unit, 100*unit, 90*unit)
                        ctx.restore()
                        // 设置奖品名称
                        ctx.save()
                        ctx.setFillStyle('#7F3E3E')
                        ctx.setTextAlign('center')
                        ctx.setFontSize(24*unit)
                        canvasData.drawText(giftNameArr[4], 528*unit, 642*unit, 716*unit, 24*unit, 1)
                        ctx.restore()
                        // 设置优惠券的类型
                        if (couponTypeArr[4] !== null) {
                            ctx.save()
                            ctx.setFillStyle('#FFFFFF')
                            ctx.setFontSize(20*unit)
                            if (couponTypeArr[4]==1||couponTypeArr[4]==2) {
                                ctx.fillText('￥', 485*unit, 590*unit)
                                
                            } else if (couponTypeArr[4]==3) {
                                ctx.fillText('折', 541*unit, 590*unit)
                            }
                            ctx.restore()
                        }
                        // 设置优惠券的值
                        if (couponAmountArr[4] !== null) {
                            ctx.save()
                            ctx.setFillStyle('#FFFFFF')
                            ctx.setFontSize(42*unit)
                            ctx.setTextAlign('center')
                            ctx.fillText(couponAmountArr[4], 524*unit, 590*unit, 60*unit)
                            ctx.restore()
                        }
                        break;
                    case 5: 
                        // 设置奖品图片
                        ctx.save()
                        canvasData.roundRect(ctx, 69*unit, 658*unit, 182*unit, 150*unit, 20*unit, 'transparent')
                        ctx.drawImage(resImg2[5].path, 0, 0, resImg2[5].width, resImg2[5].height, 110*unit, 668*unit, 100*unit, 90*unit)
                        ctx.restore()
                        // 设置奖品名称
                        ctx.save()
                        ctx.setFillStyle('#7F3E3E')
                        ctx.setTextAlign('center')
                        ctx.setFontSize(24*unit)
                        canvasData.drawText(giftNameArr[5], 160*unit, 792*unit, 336*unit, 24*unit, 1)
                        ctx.restore()
                        // 设置优惠券的类型
                        if (couponTypeArr[5] !== null) {
                            ctx.save()
                            ctx.setFillStyle('#FFFFFF')
                            ctx.setFontSize(20*unit)
                            if (couponTypeArr[5]==1||couponTypeArr[5]==2) {
                                ctx.fillText('￥', 120*unit, 740*unit)
                                
                            } else if (couponTypeArr[5]==3) {
                                ctx.fillText('折', 176*unit, 740*unit)
                            }
                            ctx.restore()
                        }
                        // 设置优惠券的值
                        if (couponAmountArr[5] !== null) {
                            ctx.save()
                            ctx.setFillStyle('#FFFFFF')
                            ctx.setFontSize(42*unit)
                            ctx.setTextAlign('center')
                            ctx.fillText(couponAmountArr[5], 160*unit, 740*unit, 60*unit)
                            ctx.restore()
                        }
                        break;
                    case 6: 
                        // 设置奖品图片
                        ctx.save()
                        canvasData.roundRect(ctx, 252*unit, 658*unit, 182*unit, 150*unit, 20*unit, 'transparent')
                        ctx.drawImage(resImg2[6].path, 0, 0, resImg2[6].width, resImg2[6].height, 292*unit, 668*unit, 100*unit, 90*unit)
                        ctx.restore()
                        // 设置奖品名称
                        ctx.save()
                        ctx.setFillStyle('#7F3E3E')
                        ctx.setTextAlign('center')
                        ctx.setFontSize(24*unit)
                        canvasData.drawText(giftNameArr[6], 345*unit, 792*unit, 536*unit, 24*unit, 1)
                        ctx.restore()
                        // 设置优惠券的类型
                        if (couponTypeArr[6] !== null) {
                            ctx.save()
                            ctx.setFillStyle('#FFFFFF')
                            ctx.setFontSize(20*unit)
                            if (couponTypeArr[6]==1||couponTypeArr[6]==2) {
                                ctx.fillText('￥', 302*unit, 740*unit)
                                
                            } else if (couponTypeArr[6]==3) {
                                ctx.fillText('折', 358*unit, 740*unit)
                            }
                            ctx.restore()
                        }
                        // 设置优惠券的值
                        if (couponAmountArr[6] !== null) {
                            ctx.save()
                            ctx.setFillStyle('#FFFFFF')
                            ctx.setFontSize(42*unit)
                            ctx.setTextAlign('center')
                            ctx.fillText(couponAmountArr[6], 342*unit, 740*unit, 60*unit)
                            ctx.restore()
                        }
                        break;
                    case 7: 
                        // 设置奖品图片
                        ctx.save()
                        canvasData.roundRect(ctx, 435*unit, 658*unit, 182*unit, 150*unit, 20*unit, 'transparent')
                        ctx.drawImage(resImg2[7].path, 0, 0, resImg2[7].width, resImg2[7].height, 478*unit, 668*unit, 100*unit, 90*unit)
                        ctx.restore()
                        // 设置奖品名称
                        ctx.save()
                        ctx.setFillStyle('#7F3E3E')
                        ctx.setTextAlign('center')
                        ctx.setFontSize(24*unit)
                        canvasData.drawText(giftNameArr[7], 528*unit, 792*unit, 716*unit, 24*unit, 1)
                        ctx.restore()
                        // 设置优惠券的类型
                        if (couponTypeArr[7] !== null) {
                            ctx.save()
                            ctx.setFillStyle('#FFFFFF')
                            ctx.setFontSize(20*unit)
                            if (couponTypeArr[7]==1||couponTypeArr[7]==2) {
                                ctx.fillText('￥', 485*unit, 740*unit)
                                
                            } else if (couponTypeArr[7]==3) {
                                ctx.fillText('折', 541*unit, 740*unit)
                            }
                            ctx.restore()
                        }
                        // 设置优惠券的值
                        if (couponAmountArr[7] !== null) {
                            ctx.save()
                            ctx.setFillStyle('#FFFFFF')
                            ctx.setFontSize(42*unit)
                            ctx.setTextAlign('center')
                            ctx.fillText(couponAmountArr[7], 524*unit, 740*unit, 60*unit)
                            ctx.restore()
                        }
                        break;
                }
            }
        }
        
    }
}

