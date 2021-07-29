const { Client } = require("@notionhq/client");
const dotenv = require("dotenv");
const { google } = require("googleapis");
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const database_id = process.env.NOTION_CALENDAR_DATABASE_ID;

async function main() {
  const payload = {
    path: `databases/${database_id}/query`,
    method: "POST",
  };
  let newArr = [];
  let filteredArr = [];

  const getNotionData = async () => {
    try {
      const { results } = await notion.request(payload);
      for (let i = 0; i < results.length; i++) {
        if (results[i].properties.Name.title.length != 0) {
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
          filteredArr = newArr.filter((item) => {
            return Date.now() - 86400000 < Date.parse(item.date);
          });
          console.log(filteredArr);
        }
      }
    } catch (error) {
      console.log("test1");
      console.error(error.body);
    }
  };

  async function getPageById(id) {
    const payload = {
      path: `pages/${id}`,
      method: "GET",
    };
    return await notion.request(payload);
  }

  const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);
  const calendarId = process.env.CALENDAR_ID;

  // Google calendar API settings
  const SCOPES = "https://www.googleapis.com/auth/calendar";
  const auth = new google.auth.JWT(
    CREDENTIALS.client_email,
    null,
    CREDENTIALS.private_key,
    SCOPES
  );
  const calendar = google.calendar({ version: "v3", auth });

  // Your TIMEOFFSET Offset
  const TIMEOFFSET = "+08:00";

  const getEventsById = async (id) => {
    try {
      let response = await calendar.events.get({
        calendarId: calendarId,
        eventId: id,
      });
      return 1;
    } catch (error) {
      console.log(`Error at getEventsById --> ${error}`);
      return 0;
    }
  };
  // Insert new event to Google Calendar
  const insertEvent = async (event) => {
    try {
      let response = await calendar.events.insert({
        auth: auth,
        calendarId: calendarId,
        resource: event,
      });

      if (response["status"] == 200 && response["statusText"] === "OK") {
        return 1;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(`Error at insertEvent --> ${error}`);
      return 0;
    }
  };

  const checkNotionAndInsert = async () => {
    for (let i = 0; i < filteredArr.length; i++) {
      var item = filteredArr[i];
      let id = item.id.replace(/-/g, "");

      const event = {
        summary: item.title,
        start: {
          date: item.date,
        },
        end: {
          date: item.date,
        },
        id,
      };
      if ((await getEventsById(id)) == 0) {
        await insertEvent(event);
        console.log("Added Event " + item.title);
      } else {
        console.log("Event alr exists");
      }
    }
  };
  await getNotionData();
  await checkNotionAndInsert();
}
// main();

exports.handler = async (event) => {
  main();
};
