import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import { google } from "googleapis";
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const database_id = process.env.NOTION_CALENDAR_DATABASE_ID;

const payload = {
  path: `databases/${database_id}/query`,
  method: "POST",
};
let newArr = [];

try {
  const { results } = await notion.request(payload);
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
} catch (error) {
  console.error(error.body);
}

let filteredArr = newArr.filter((item) => {
  console.log(Date.parse(item.date));
  return Date.now() - 86400000 < Date.parse(item.date);
});

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
      insertEvent(event);
    } else {
      console.log("Event alr exists");
    }
  }
};

checkNotionAndInsert();

// filteredArr.forEach((item) => {
//   let id = item.id.replace(/-/g, "");

//   const event = {
//     summary: item.title,
//     start: {
//       date: item.date,
//     },
//     end: {
//       date: item.date,
//     },
//     id,
//   };
//   console.log(getEventsById(id));
//   if (getEventsById(id) == 0) {
//     insertEvent(event);
//   } else {
//     console.log("Event alr exists");
//   }
//   // console.log(event);
// });

// getEventsById("a52e40edd1204d2886e3cc562fd40469");
// getEventsById("hopflpu35ht8lurpgud447u7c4");

// filteredArr.forEach((item) => {
//   console.log(getEventsById(item.id));
// });

// Get all the events between two dates
const getEvents = async (dateTimeStart, dateTimeEnd) => {
  try {
    let response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: dateTimeStart,
      timeMax: dateTimeEnd,
    });

    let items = response["data"]["items"];
    return items;
  } catch (error) {
    console.log(`Error at getEvents --> ${error}`);
    return 0;
  }
};

let start = "2021-07-03T00:00:00.000Z";
let end = "2021-10-04T00:00:00.000Z";

// getEvents(start, end)
//   .then((res) => {
//     console.log(res);
//   })
//   .catch((err) => {
//     console.log(err);
//   });

// Delete an event from eventID
// const deleteEvent = async (eventId) => {
//   try {
//     let response = await calendar.events.delete({
//       auth: auth,
//       calendarId: calendarId,
//       eventId: eventId,
//     });

//     if (response.data === "") {
//       return 1;
//     } else {
//       return 0;
//     }
//   } catch (error) {
//     console.log(`Error at deleteEvent --> ${error}`);
//     return 0;
//   }
// };

// let eventId = "hkkdmeseuhhpagc862rfg6nvq4";

// deleteEvent(eventId)
//   .then((res) => {
//     console.log(res);
//   })
//   .catch((err) => {
//     console.log(err);
//   });
