
document.addEventListener("deviceready", function () {
    document.addEventListener("backbutton", function () {
        removeTotalData();
        functionback();
    }, false);
}, false);
var pageIndex = 1;
var cuserid = "";
var begindate = "";
var enddate = "";
var dimsmap = null;
summerready = function(){
    getLocalVal();
    callActionData({
        pageIndex:pageIndex
    })
    mui("header").on("tap","a",function () {
        removeTotalData()
        mui.openWindow({
            url: '../index.html',
            id: 'index'
        });
    })
    function getLocalVal() {
        var totalData = JSON.parse(localStorage.getItem("totalData"));
        cuserid = totalData.cuserid;
        begindate = totalData.begindate;
        enddate = totalData.enddate;
        dimsmap = totalData.dimsmap;
    }
    function callActionData(options) {
       var pageIndex = options.pageIndex||1;
       var _self = options.self || "";
        $_ajax._post({
            url: 'com.mobile.controller.MobileReportAnalyzeController',
            handler: 'handler',
            data: {
                cuserid: cuserid,
                begindate: begindate,
                enddate: enddate,
                dimsmap: dimsmap,
                currdim: "",
                matstr: "",
                pageSize: 10,
                pageIndex: pageIndex,
            },
            success: mycallback,
            err: myerr
        })
        function mycallback(data) {
            if (data.datas === null) {
                if (_self) {
                    _self.endPullupToRefresh(false)
                }
                return;
            }
            var data = data.datas;
            if (_self) {
                _self.endPullupToRefresh(false)
            }
            renderList(data);
        }

        function myerr(e) {
            if (_self) {
                _self.endPullupToRefresh(false)
            }
            mui.alert("网络异常，请稍候重试！", "提示", "确定", function () {
            })
        }
    }

    function renderList(data) {
        var arrText = doT.template($("#listTemplate").text());
        $("#listContainer").append(arrText(data));
    }
    //上拉加载  初始化
    mui.init({
        pullRefresh: {
            container: '#pullrefresh',//待刷新区域标识，querySelector能定位的css选择器均可，比如：id、.class等
            up: {
                height: 50,//可选.默认50.触发上拉加载拖动距离
                auto: false,//可选,默认false.自动上拉加载一次
                contentrefresh: "正在加载...",//可选，正在加载状态时，上拉加载控件上显示的标题内容
                contentnomore: '没有更多数据了',//可选，请求完毕若没有更多数据时显示的提醒内容；
                callback:function(){
                    pageIndex++;
                    callActionData({
                        pageIndex:pageIndex,
                        self: this
                    })
                }
            }
        }
    });
}
