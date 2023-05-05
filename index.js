import express from "express";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import cheerio from "cheerio";
import axios from "axios";
const app = express();

app.get("/", (req, res) => {
  res.send("Choo Choo! Welcome to your Express app 🚅");
});

app.get("/json", (req, res) => {
  res.json({ "Choo Choo": "Welcome to your Express app 🚅" });
});

const bot = new Telegraf(process.env.BOT_TOKEN);

// Set the bot API endpoint
app.use(await bot.createWebhook({ domain: process.env.WEBHOOK_DOMAIN }));

try {
  bot.start((ctx) => ctx.reply("Welcome"));
  bot.help((ctx) => ctx.reply("Send me a sticker"));
  bot.on(message("sticker"), (ctx) => ctx.reply("👍"));
  bot.hears(/[\w]{1,10}-[\w]{1,10}/, (ctx) => {
    // ctx.replyWithMarkdownV2('*匹配成功*,_请稍等_', {
    //     reply_to_message_id: messageId,
    //   })
    //   .then(msgInfo => {
    //     setTimeout(() => {
    //       ctx.telegram.editMessageText(msgInfo.chat.id, msgInfo.message_id, undefined, `*暫未實裝*該功能🤗`,{parse_mode: "MarkdownV2"});
    //     }, 2000);
    //   });
    console.log("fanhao", ctx.message);
    const keyword = ctx.message.text;
    const url = `https://javdb.com/search?q=${keyword}`;
    axios
      .get(url)
      .then((response) => {
        const html = response.data;
        const $ = cheerio.load(html);
        const matchItem = $(".movie-list .item").first();
        const imgUrl = matchItem.find(".cover img").attr("src");
        const href = "https://javdb.com/" + matchItem.find(".box").attr("href");
        let title = matchItem.find(".video-title").text().trim();
        let score = matchItem.find(".score").text().trim();
        let time = matchItem.find(".meta").text().trim();
        console.log(imgUrl, href, title, score, time);
        if (!imgUrl) {
          ctx.telegram.sendMessage(ctx.message.from.id, `未找到结果或网络错误`);
          return;
        }
        title = title.replace(/-/g, "\\-");
        score = score.replace(/-/g, "\\-");
        time = time.replace(/-/g, "\\-");
        title = title.replace(/\./g, "\\.");
        score = score.replace(/\./g, "\\.");
        time = time.replace(/\./g, "\\.");
        const captionText = `
      *${title}*
${score} 
_${time}_
[javdb](${href})`;
        ctx.replyWithPhoto(imgUrl, {
          caption: captionText,
          parse_mode: "MarkdownV2",
        });
      })
      .catch((err) => {
        console.log(err);
        ctx.telegram.sendMessage(
          ctx.message.from.id,
          `網絡錯誤! Status: ${err}`
        );
      });
  });

  bot.hears("hzy", async (ctx) => {
    console.log("hzy", ctx.message);
    const date2CST = (dateString) => {
      const pattern =
        /(\d{4})年(\d{1,2})月(\d{1,2})日 \((.)\)\s*(\d{1,2}):(\d{2})/;
      const [, year, month, day, weekday, hour, minute] =
        dateString.match(pattern);
      const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
      return (
        date.toLocaleDateString("zh-CN") +
        " " +
        date.toLocaleTimeString("zh-CN", { hourCycle: "h23" })
      );
    };
    const url =
      "https://zh.wiktionary.org/w/index.php?title=Special:%E7%94%A8%E6%88%B7%E8%B4%A1%E7%8C%AE/Hzy980512&target=Hzy980512&limit=10";
    axios
      .get(url)
      .then((response) => {
        const html = response.data;
        const $ = cheerio.load(html);
        const lastItem = $(".mw-contributions-list li").first();
        const lastDate = lastItem.find(".mw-changeslist-date").text();
        const lastWord = lastItem.find(".mw-contributions-title").text();
        console.log("lastDate", `${lastDate} ${lastWord}`);
        ctx.reply(`${date2CST(lastDate)} ${lastWord}`, {
          reply_to_message_id: ctx.message.message_id,
        });
      })
      .catch((err) => {
        console.log(err);
        ctx.telegram.sendMessage(
          ctx.message.from.id,
          `網絡錯誤! Status: ${err}`
        );
      });
  });

  //   bot.on("message", (ctx) => {
  //     console.log(ctx.message);
  //     ctx.reply("Hello World!");
  //   });
} catch (error) {
  console.log(error);
}

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
