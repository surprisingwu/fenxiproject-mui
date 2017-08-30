document.addEventListener("deviceready", function() {
    document.addEventListener("backbutton", function() {
        removeTotalData();
        mui.openWindow({
            url: '../index.html',
            id: 'index'
        });
    }, false);
}, false);
var pageIndex = 1;
var cuserid = "";
var begindate = "";
var enddate = "";
var dimsmap = null;
$(function() {
    var timerId = null; //时间id
    getLocalVal(); //获取上页面的数据
    initPage(); //初始化页面
    bindEvent(); //事件绑定
    function bindEvent() {
        //点击 左上角的箭头
        mui("header").on("tap", "a", function() {
                removeTotalData()
                mui.openWindow({
                    url: '../index.html',
                    id: 'index'
                });
            })
            // @todo  点击每一条数据，跳转到相应的详情页
        mui("#listContainer").on('tap', "li", function() {
            alert('此处，传参跳转到单据详情页')
        })
    }

    function initPage() {
        //保证获取数据后调用
        clearTimeout(timerId)
        timerId = setTimeout(function() {
            //document.addEventListener('deviceready', callActionData, false);
            callActionData({
                pageIndex: 1
            })
        }, 300)
    }

    function getLocalVal() {
        var totalData = JSON.parse(localStorage.getItem("totalData"));
        cuserid = totalData.cuserid;
        begindate = totalData.begindate;
        enddate = totalData.enddate;
        dimsmap = totalData.dimsmap;
    }
    //访问后台的方法
    function callActionData(options) {
        var pageIndex = pageIndex || 1;
        var _self = options.self || "";
        var params = {};
        params.controllerid = 'com.mobile.controller.MobileReportAnalyzeController';
        params.appid = 'handler';
        params.cuserid = cuserid;
        params.begindate = begindate;
        params.enddate = enddate;
        params.dimsmap = dimsmap;
        params.currdim = null;
        params.matstr = "";
        params.pageSize = 10;
        params.pageIndex = pageIndex;
        callService(mycallback, myerr, params)

        function mycallback(data) {
            try {
                data = JSON.parse(data)
            } catch (e) {
                data = data
            }
            if (data.datas === null) {
                if (_self) {
                    _self.endPullupToRefresh(false)
                }
                mui.alert("没有对应的单据列表！", "提示", "确定", function() {})
                return;
            }
            var data = data.datas;
            if (data.length >= 10) {
                mui('#pullrefresh').pullRefresh().enablePullupToRefresh();
            } else {
                mui('#pullrefresh').pullRefresh().disablePullupToRefresh();
            }
            if (_self) {
                _self.endPullupToRefresh(false)
            }
            renderList(data);
        }

        function myerr(e) {
            if (_self) {
                _self.endPullupToRefresh(false)
            }
            mui.alert("网络异常，请稍候重试！", "提示", "确定", function() {})
        }
    }

    function renderList(data) {
        var arrText = doT.template($("#listTemplate").text());
        $("#listContainer").append(arrText(data));
    }
    //上拉加载  初始化
    mui.init({
        pullRefresh: {
            container: '#pullrefresh', //待刷新区域标识，querySelector能定位的css选择器均可，比如：id、.class等
            up: {
                height: 50, //可选.默认50.触发上拉加载拖动距离
                auto: false, //可选,默认false.自动上拉加载一次
                contentrefresh: "正在加载...", //可选，正在加载状态时，上拉加载控件上显示的标题内容
                contentnomore: '没有更多数据了', //可选，请求完毕若没有更多数据时显示的提醒内容；
                callback: function() {
                    pageIndex++;
                    callActionData({
                        pageIndex: pageIndex,
                        self: this
                    })
                }
            }
        }
    });

})