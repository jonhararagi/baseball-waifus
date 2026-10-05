import assert from "node:assert/strict";
import { TelegramBridge } from "../webapp/js/api.js";
import { ShopManager } from "../webapp/js/shopManager.js";

const events=[];
const webApp={
  initDataUnsafe:{user:{id:123456,name:"Jonh",first_name:"Jonh"}},
  themeParams:{bg_color:"#000"},
  ready(){events.push("ready")},
  expand(){events.push("expand")},
  setHeaderColor(v){events.push("header:"+v)},
  setBackgroundColor(v){events.push("background:"+v)},
  openInvoice(url,cb){events.push("invoice:"+url); cb("paid")}
};
const bridge=new TelegramBridge({WebApp:webApp});
bridge.init();
assert.equal(bridge.getUserId(),"123456");
assert.ok(events.includes("ready")&&events.includes("expand"));

const shop=new ShopManager({telegramBridge:bridge,invoiceUrls:{focus:"https://t.me/invoice/focus"}})
const paid=await shop.buyBoost("focus");
assert.equal(paid.ok,true);
assert.equal(paid.status,"paid");

const cancelledApp={openInvoice(_url,cb){cb("cancelled")}};
const cancelled=await new ShopManager({webApp:cancelledApp,invoiceUrls:{scrap_5000:"https://t.me/invoice/scrap"}}).buyScrapPack("scrap_5000");
assert.equal(cancelled.ok,false);
assert.equal(cancelled.status,"cancelled");

console.log("P17 Telegram/Stars integration tests passed.");
