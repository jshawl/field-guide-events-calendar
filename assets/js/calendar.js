export const formatEvents = ({ events, options }) =>
  events.map((event) => {
    const startDate = event.startDate;
    const startTime = event.startTime;
    const start = new Date(`${startDate}T${startTime}`);
    let endDate = event.endDate;
    if (options.multi_day_events === "false") {
      endDate = startDate;
    }
    const endTime = event.endTime;
    const end = new Date(`${endDate}T${endTime}`);
    return {
      campaignName: event.campaignName,
      end,
      endDate,
      id: event.id,
      start,
      startDate,
      title: event.name,
    };
  });

export const getCampaignNames = (events) =>
  Object.keys(
    events.reduce((cats, ev) => {
      if (ev.campaignName) {
        cats[ev.campaignName] = true;
      }
      return cats; // 😸
    }, {}),
  ).sort();

export const renderCalendar = (calendarEl) => {
  const calendar = new FullCalendar.Calendar(calendarEl, {
    eventClassNames: ["neon-crm-calendar-event"],
    eventClick: (info) => {
      const url = `https://${neon_crm_calendar.org_id}.app.neoncrm.com/np/clients/${neon_crm_calendar.org_id}/event.jsp?event=${info.event.id}`;
      window.open(url, "_blank");
    },
    headerToolbar: {
      left: "title",
      right: "prev,next today",
    },
    height: "auto",
    initialView: "dayGridMonth",
  });
  calendar.render();
  return calendar;
};

export const getEvents = async ({ options }) => {
  const eventsResponse = await fetch(
    `${neon_crm_calendar.rest_url}/listEvents`,
  );
  const eventsData = await eventsResponse.json();
  if (!eventsData.events) {
    // oxlint-disable-next-line no-console
    console.error("neon-crm-calendar: error fetching events", eventsData);
    return [];
  }
  return formatEvents({ events: eventsData.events, options });
};

const renderCampaignButton = ({ container, campaignName }) => {
  const div = document.createElement("div");
  let checkedAttribute = "";
  if (campaignName === "All") {
    checkedAttribute = "checked='true'";
  }
  div.innerHTML = `
    <input id="neon_crm_calendar_campaign_name_${campaignName}" type="radio" name="neon_crm_calendar_campaign_name" value="${campaignName}" ${checkedAttribute}/>
    <label for="neon_crm_calendar_campaign_name_${campaignName}">
      ${campaignName}
    </label>
  `;
  container.append(div);
  return div;
};

export const renderCampaigns = async ({ calendar, events, container }) => {
  const campaignNames = getCampaignNames(events);
  container.innerHTML = "";
  renderCampaignButton({ container, campaignName: "All" });
  campaignNames.map((campaignName) =>
    renderCampaignButton({ container, campaignName }),
  );
  container.addEventListener("change", (event) => {
    const campaignName = event.target.value;
    render({ calendar, events, campaignName });
  });
};

export const render = ({ calendar, events, campaignName }) => {
  document.querySelector(".neon-crm-calendar .loading")?.remove();
  calendar.getEvents().map((calendarEvent) => calendarEvent.remove());
  events
    .filter((event) => ["All", event.campaignName].includes(campaignName))
    .map((event) =>
      calendar.addEvent({
        ...event,
        allDay: event.startDate !== event.endDate,
      }),
    );
};

export const main = async () => {
  const container = document.querySelector(".neon-crm-calendar");
  const options = container.dataset;
  const calendarEl = document.querySelector(".neon-crm-calendar #calendar");
  const calendar = renderCalendar(calendarEl);
  const events = await getEvents({ options });
  render({ calendar, events, campaignName: "All" });
  if (options.filter_categories !== "true") {
    return;
  }
  const campaignsEl = document.querySelector(".neon-crm-calendar .campaigns");
  renderCampaigns({ calendar, events, container: campaignsEl });
};
