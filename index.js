import { Client } from "@notionhq/client";
import dotenv from "dotenv";
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_CALENDAR_DATABASE_ID;
async function addItem(text) {
  try {
    await notion.request({
      path: "pages",
      method: "POST",
      body: {
        parent: { database_id: databaseId },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: text,
                },
              },
            ],
          },
        },
      },
    });
    console.log("Success! Entry added.");
  } catch (error) {
    console.error(error.body);
  }
}

// addItem("Yurts in Big Sur, California");
const database_id = process.env.NOTION_CALENDAR_DATABASE_ID;

const payload = {
  path: `databases/${database_id}/query`,
  method: "POST",
};

try {
  const { results } = await notion.request(payload);
  let newArr = [];
  for (let i = 0; i < results.length; i++) {
    const page = results[i];
    var pageId;
    if (page.properties.Lecture.relation[0]) {
      pageId = page.properties.Lecture.relation[0].id;
      const newRes = await getPageById(pageId);
      newArr.push({
        id: page.id,
        title: page.properties.Name.title[0].text.content,
        date: page.properties.Date.date.start,
        linkedName: newRes.properties.Name.rich_text[0].text.content,
      });
    } else {
      newArr.push({
        id: page.id,
        title: page.properties.Name.title[0].text.content,
        date: page.properties.Date.date.start,
      });
    }
  }
  console.log(newArr);
} catch (error) {
  console.error(error.body);
}

async function getPageById(id) {
  const payload = {
    path: `pages/${id}`,
    method: "GET",
  };
  return await notion.request(payload);
}

// // getPageById("ee144711-8b0f-4e12-8cff-1e1a77b5a2ef");
// getPageById("a072ed90-8f60-4138-8459-6aec4c70f3cf");
