import puppeteer from 'puppeteer';
import path from 'path';
(async () => {
  const pathToExtension = path.join(process.cwd(), 'rendie.com');
  const browser = await puppeteer.launch({
    args: [
      '--disable-blink-features=AutomationControlled',//就能轻松移除上一节介绍的 navigator.webdriver = true 属性  https://www.webhek.com/post/detecting-headless-chrome-puppeteer-2024/
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--lang=zh-CN',//这个是给客户获取用的
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--no-zygote'
    ],
    ignoreDefaultArgs: ["--enable-automation"],//如何避免Puppeteer被前端JS检测  https://segmentfault.com/a/1190000019539509
    headless: 'new',//'new':表示后台运行
    //headless: false,//false:表示打开窗口  
  });
  ////////////////////////////////////////////////////////////
  let timeout = function (delay) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(1)
        } catch (e) {
          reject(0)
        }
      }, delay);
    })
  }
  ///////////////////////////////////////////////////////////////
  const page = await browser.newPage();
  await page.evaluateOnNewDocument('const newProto = navigator.__proto__;delete newProto.webdriver;navigator.__proto__ = newProto;');//puppeteer去除webdriver标记问题+打包   https://www.cnblogs.com/yangdadaBO/p/14956397.html
  await page.setViewport({ width: 1920, height: 1080 });
  /////////////////////////////////////////////////////////////////////////
  let url = "https://www.rendie.com/admin.html"
  await page.goto(url);//为什么这个要执行俩次？答：必须要先打开网页才能设置“localStorage”。
  //通过page.evaluate进行localStorag 设置
  await page.evaluate(oo => {
    localStorage.setItem("expires_in", 1722844755);
    //////////////////////////////////////
    localStorage.setItem("refresh_token", oo.refresh_token);
    localStorage.setItem("access_token", oo.access_token);  
    localStorage.setItem("username", "5minute");
    ///////////////////////////////////////////////////////////////////////
    localStorage.setItem("menuList", '{"top1":1,"top2":{"18":{"name":"任务","id":"18","isbool":true,"url":"http://localhost:3000/view/Default/admin/html/Shopee/%E4%BB%BB%E5%8A%A1.html?jsFile=js02&return=%2Fview%2FDefault%2Fadmin%2Fhtml%2FShopee%2F%25E4%25BB%25BB%25E5%258A%25A1.html%3FjsFile%3Djs04"}}}');
  }, {
    refresh_token: process.env.NODE_SHOPEE_REFRESH_TOKEN,
    access_token: process.env.NODE_SHOPEE_ACCESS_TOKEN    
  });
  await page.goto(url);
  /////////////////////////////////// 
  let count = 0;
  let total = 60 * 4 / 10//最多运行4分钟
  let Enable = true;
  while (Enable) {
    count++
    console.log('已运行：' + ((count * 10) / 60).toFixed(2) + '（分钟）');
    await timeout(10000);//10秒  
    if(((count * 10) / 60)>3){//表示超过3分钟就截图
       await page.screenshot({path: '../error/overtime-' + count + '.png'});
    }
    /////////////////////////////////////////////////////
    try {
      let content = await page.$eval('title', ele => ele.innerHTML);
      if (count < total) {
        Enable = content == "已完成所有任务。" ? false : true;
      }
      else {
        Enable = false;
      }
    } catch (error) {
      // 处理错误的代码
      console.log("处理错误的信息：", error)
      await page.screenshot({
        path: '../error/error.png'
      });
      Enable = false;
    }
  }
  await page.close()
  await browser.close()
  console.log('已完成所有任务。');

})();
