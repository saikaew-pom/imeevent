// Event-type timeline presets. Each preset is a list of task templates whose
// dates are stored as OFFSETS in days before the event (so one preset works for
// any event date). Import computes concrete dates: date = eventDate - offset.
// A negative offset lands after the event (e.g. post-event reconciliation).
// Pure data + a date helper — no "server-only", shared by client and server.

import { TaskCategory, TaskStatus } from "./tasks";

export interface TaskTemplate {
  title: string;
  description: string;
  category: TaskCategory;
  startOffsetDays: number | null; // days before event; null = no start date
  dueOffsetDays: number | null; // days before event; null = no due date
  status?: TaskStatus; // defaults to "todo"
}

export interface EventPreset {
  id: string;
  name: string;
  icon: string; // emoji
  description: string;
  leadLabel: string; // human hint, e.g. "~6 month lead"
  tasks: TaskTemplate[];
}

// A preset that has actually been imported into a project, with how many tasks
// it currently contributes. Returned by GET /api/builder/tasks/presets and used
// by the Timeline's "Refine a preset" control.
export interface ImportedPreset {
  id: string;
  name: string;
  icon: string;
  count: number;
}

// Compute an ISO date (YYYY-MM-DD) from the event date and a day offset.
// Parsed as UTC to avoid off-by-one timezone drift.
export function offsetToDate(eventDate: string, offset: number | null): string | null {
  if (offset === null) return null;
  const d = new Date(`${eventDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}

const t = (
  title: string,
  category: TaskCategory,
  startOffsetDays: number | null,
  dueOffsetDays: number | null,
  description = "",
  status: TaskStatus = "todo"
): TaskTemplate => ({ title, description, category, startOffsetDays, dueOffsetDays, status });

export const EVENT_PRESETS: EventPreset[] = [
  {
    id: "gala",
    name: "Gala / Celebration",
    icon: "✨",
    description: "Large formal event with staging, shows, catering and a headline finale.",
    leadLabel: "~6 month lead",
    tasks: [
      t("Project kickoff & vendor shortlist", "general", 185, 180, "Align stakeholders, set the concept and shortlist key vendors."),
      t("Finalize & sign off event budget", "finance", 180, 165, "Lock the master budget across venue, production, F&B and entertainment."),
      t("Confirm main space + countdown/finale area hold", "venue", 180, 159, "Lock the primary event space and any secondary finale area."),
      t("Book band + travel & rooms", "entertainment", 169, 143, "Confirm the live band contract plus flights, transport and accommodation."),
      t("Book MC / host", "entertainment", 169, 143, "Confirm the host for the evening."),
      t("Pay tent & main production deposits", "finance", 160, 148, "Release first-half deposits to secure the main tent and AV/production vendors."),
      t("Book main tent / outdoor area", "venue", 159, 138, "Confirm any outdoor or tented areas."),
      t("Pay entertainment deposits", "finance", 155, 143, "Deposits for band, MC and signature show acts."),
      t("Develop buffet / menu concept", "fnb", 152, 128, "Design the menu aligned to the theme and guest mix."),
      t("Confirm signature shows", "entertainment", 152, 123, "Lock the headline performance acts and the finale."),
      t("Confirm F&B cost per cover", "finance", null, 138, "Agree food and beverage COGS per guest to protect margin."),
      t("Book DJ", "entertainment", null, 121, "Confirm DJ for the dance floor / afterglow."),
      t("Menu tasting & sign-off", "fnb", 121, 102, "Chef tasting with stakeholders; finalize dishes and portioning."),
      t("Launch promotion & collateral", "marketing", 121, 92, "Kick off the campaign, hero visuals and channel plan."),
      t("Secure pyro & event permits", "venue", 120, 77, "Obtain venue and authority approvals for pyro / special effects."),
      t("Finalize sound, lighting, LED & AV spec", "entertainment", 107, 72, "Lock the full technical production spec and equipment list."),
      t("Finalize beverage package & bar plan", "fnb", null, 97, "Lock the drinks package, arrival champagne and bar service points."),
      t("Confirm pyro / effects design", "entertainment", 91, 60, "Finalize the special-effects sequence and safety plan."),
      t("Open ticket sales", "marketing", 91, 77, "Open ticket sales and the reservation flow."),
      t("Finalize run-of-show & energy curve", "entertainment", 60, 31, "Lock the minute-by-minute program and energy arc."),
      t("Confirm trucking & load-in schedule", "venue", 60, 30, "Lock logistics windows for tent, staging, AV and decor."),
      t("Design & print guest materials", "marketing", 60, 26, "Menus, tickets, wristbands, table runners and signage."),
      t("Schedule final vendor balance payments", "finance", 46, 16, "Book the remaining balance payments ahead of load-in."),
      t("Staff & casuals scheduling", "venue", 46, 21, "Roster departments and casual labour for setup, service and teardown."),
      t("Plan lucky draw & guest favours", "marketing", null, 41, "Confirm prizes and guest party-pack contents."),
      t("Confirm final guest headcount", "fnb", 30, 11, "Lock covers to finalize catering and seating."),
      t("Guest comms: confirmations & arrival details", "marketing", 21, 3, "Send confirmations, dress code, parking and arrival timing."),
      t("Kitchen & service brief", "fnb", 16, 3, "Brief kitchen and service teams on ops, timing and flow."),
      t("Final production walkthrough & contingency plan", "general", 11, 1, "On-site walkthrough, backup plan and go/no-go checklist."),
      t("Venue load-in & staging build", "venue", 2, 0, "On-site build of tent, stage, LED, lighting and decor."),
      t("Technical rehearsal & cue-to-cue", "entertainment", 2, 1, "Full tech rehearsal: shows, band, lighting and cues."),
      t("Post-event P&L reconciliation", "finance", -2, -10, "Reconcile actuals vs budget, close invoices, produce final P&L."),
    ],
  },
  {
    id: "wedding",
    name: "Wedding",
    icon: "💍",
    description: "Classic single-day wedding: ceremony, reception, vendors and guest logistics.",
    leadLabel: "~12 month lead",
    tasks: [
      t("Set date, budget & guest count", "general", 365, 335, "Agree the date, overall budget and approximate guest list size."),
      t("Book wedding planner / coordinator", "general", 335, 300, "Engage a planner or day-of coordinator."),
      t("Book ceremony & reception venue", "venue", 330, 290, "Confirm and contract the venue(s)."),
      t("Pay venue & vendor deposits", "finance", 285, 260, "Release deposits to secure the venue and key vendors."),
      t("Choose caterer & menu direction", "fnb", 270, 230, "Select the caterer and outline the menu."),
      t("Book photographer & videographer", "entertainment", 260, 220, "Confirm photo and video coverage."),
      t("Book band / DJ & MC", "entertainment", 240, 200, "Confirm music and the host."),
      t("Design & send save-the-dates", "marketing", 240, 210, "Send save-the-dates to the guest list."),
      t("Choose attire (dress, suits, party)", "general", 240, 150, "Order wedding attire for the couple and party."),
      t("Confirm cake & beverages", "fnb", 150, 120, "Finalize the cake and drinks package."),
      t("Order flowers & decor", "general", 150, 100, "Confirm florals, centrepieces and styling."),
      t("Arrange guest accommodation & transport", "venue", 150, 90, "Block rooms and arrange transport for guests."),
      t("Send formal invitations", "marketing", 120, 90, "Mail the formal invitations."),
      t("Arrange hair & makeup trial", "general", 90, 60, "Book and complete the beauty trial."),
      t("Collect RSVPs & finalize seating", "marketing", 90, 30, "Chase RSVPs and build the seating plan."),
      t("Marriage license & legal paperwork", "general", 60, 21, "Complete legal requirements and paperwork."),
      t("Menu tasting & final headcount", "fnb", 45, 20, "Tasting and confirm final numbers to the caterer."),
      t("Final vendor payments", "finance", 30, 10, "Settle remaining balances with all vendors."),
      t("Day-of coordination & timeline", "general", 14, 0, "Finalize the run-of-day and brief the coordinator."),
      t("Rehearsal & rehearsal dinner", "general", 3, 1, "Ceremony rehearsal and dinner."),
    ],
  },
  {
    id: "indian-wedding",
    name: "Indian Wedding",
    icon: "🪔",
    description: "Multi-day celebration: Mehndi, Sangeet, Haldi, wedding ceremony and reception.",
    leadLabel: "~12 month lead",
    tasks: [
      t("Set dates for all ceremonies & budget", "general", 365, 330, "Fix dates for each function and agree the overall budget."),
      t("Consult priest & fix muhurat", "general", 330, 290, "Confirm the auspicious time(s) with the priest."),
      t("Book wedding planner", "general", 330, 300, "Engage a planner experienced with multi-day weddings."),
      t("Book venues (Mehndi / Sangeet / Wedding / Reception)", "venue", 320, 280, "Confirm venues for each function."),
      t("Pay venue & vendor deposits", "finance", 275, 250, "Release deposits across venues and key vendors."),
      t("Book caterers (multi-cuisine, veg / non-veg)", "fnb", 260, 220, "Confirm catering for each function."),
      t("Book photographer & cinematographer", "entertainment", 260, 210, "Confirm photo and cinematography coverage."),
      t("Order bridal & groom attire", "general", 240, 150, "Order lehenga, sherwani and family outfits."),
      t("Book DJ, dhol & live music", "entertainment", 240, 200, "Confirm music across the functions."),
      t("Book mandap & stage decor", "venue", 200, 150, "Confirm the mandap, stage and floral decor."),
      t("Book makeup & hair for all functions", "general", 200, 140, "Confirm beauty artists for each event."),
      t("Order jewellery & accessories", "general", 180, 120, "Confirm bridal jewellery and accessories."),
      t("Design & send invitations (physical + digital)", "marketing", 180, 140, "Send invitations for the functions."),
      t("Book choreographer for Sangeet", "entertainment", 180, 120, "Arrange choreography and rehearsals."),
      t("Arrange guest accommodation (out-of-town / overseas)", "venue", 180, 120, "Block rooms and manage travel for guests."),
      t("Book mehndi (henna) artist", "general", 150, 100, "Confirm the henna artist for the Mehndi."),
      t("Collect RSVPs & manage guest list", "marketing", 140, 60, "Chase RSVPs and finalize numbers per function."),
      t("Confirm sweets & mithai", "fnb", 90, 60, "Order sweets and mithai boxes."),
      t("Arrange baraat (procession) logistics", "entertainment", 90, 45, "Plan the procession, horse / car and dhol."),
      t("Guest welcome kits & favours", "general", 60, 30, "Assemble welcome kits and return gifts."),
      t("Menu tasting for each function", "fnb", 60, 30, "Tasting and final numbers with the caterers."),
      t("Arrange pooja items & ritual essentials", "general", 45, 21, "Gather pooja samagri and ritual items."),
      t("Final vendor payments", "finance", 30, 7, "Settle remaining balances with all vendors."),
      t("Rehearse ceremonies & finalize timelines", "general", 14, 2, "Walk through each ceremony and lock timings."),
    ],
  },
  {
    id: "corporate",
    name: "Corporate Meeting / Conference",
    icon: "📊",
    description: "Business event: agenda, speakers, AV, registration, catering and follow-up.",
    leadLabel: "~4 month lead",
    tasks: [
      t("Define objectives, agenda & budget", "general", 120, 100, "Set goals, draft the agenda and agree the budget."),
      t("Confirm date & format (in-person / hybrid)", "general", 120, 105, "Lock the date and delivery format."),
      t("Book venue & meeting rooms", "venue", 100, 80, "Confirm the venue and breakout spaces."),
      t("Confirm speakers & session content", "entertainment", 90, 60, "Lock speakers and finalize session material."),
      t("Pay venue & vendor deposits", "finance", 90, 75, "Release deposits to secure the venue and vendors."),
      t("Launch event page & open registration", "marketing", 80, 65, "Publish the event page and open registration."),
      t("Send invitations & manage RSVPs", "marketing", 65, 30, "Invite attendees and track registrations."),
      t("Arrange AV, staging & tech setup", "venue", 60, 40, "Confirm AV, staging and technical requirements."),
      t("Book accommodation & transport", "venue", 60, 35, "Arrange rooms and transport for attendees / speakers."),
      t("Arrange catering (breaks, lunch, dinner)", "fnb", 45, 25, "Confirm catering across the programme."),
      t("Finalize run-of-show / agenda schedule", "entertainment", 40, 21, "Lock the minute-by-minute agenda."),
      t("Prepare branding, signage & materials", "marketing", 40, 14, "Produce signage, slides and printed materials."),
      t("Prepare delegate packs & name badges", "general", 21, 7, "Assemble delegate packs and badges."),
      t("On-site setup & tech rehearsal", "general", 2, 0, "Set up the room and run a tech rehearsal."),
      t("Reconcile costs & final payments", "finance", 3, -14, "Close vendor invoices and reconcile the budget."),
      t("Post-event survey & follow-up", "marketing", -1, -7, "Send the survey and follow-up communications."),
    ],
  },
  {
    id: "incentive",
    name: "Incentive Travel",
    icon: "🏆",
    description: "Multi-day reward trip: qualifiers, DMC & hotel buyout, activities and an awards night.",
    leadLabel: "~7 month lead",
    tasks: [
      t("Confirm qualifier list & program objectives", "general", 210, 195, "Lock the qualifying criteria, headcount and business goals for the trip."),
      t("Select destination & DMC (ground handler)", "venue", 205, 175, "Choose the destination and contract the local destination management company."),
      t("Negotiate hotel buyout & room block", "venue", 195, 160, "Secure the property, room categories and buyout terms."),
      t("Pay DMC & hotel deposits", "finance", 175, 150, "Release deposits to hold the hotel block and DMC services."),
      t("Book group flights & set arrival/departure windows", "venue", 165, 130, "Confirm air routing, group fares and transfer windows."),
      t("Design qualifier communications & tracking site", "marketing", 160, 120, "Build the qualification tracker and comms cadence for participants."),
      t("Confirm daily activity program (leisure + optional excursions)", "entertainment", 140, 100, "Lock leisure days, optional add-ons and any spouse/partner program."),
      t("Book awards night production (staging, AV, entertainment)", "entertainment", 130, 90, "Confirm the venue, stage, AV and entertainment for the peak awards evening."),
      t("Confirm F&B for all functions", "fnb", 120, 85, "Lock menus for welcome reception, galas and daily meals."),
      t("Open qualifier registration & rooming preferences", "marketing", 110, 70, "Open registration, collect passport details and rooming preferences."),
      t("Arrange visas & travel insurance guidance", "venue", 100, 45, "Advise qualifiers on visa requirements and arrange group insurance if applicable."),
      t("Finalize transfers & on-ground logistics", "venue", 75, 40, "Lock airport transfers, coach logistics and local transport."),
      t("Confirm final headcount & rooming list", "fnb", 45, 21, "Lock numbers with the hotel and DMC for catering and rooms."),
      t("Produce delegate collateral (itinerary, welcome packs, gifts)", "marketing", 40, 14, "Print itineraries, welcome packs and any recognition gifts."),
      t("Awards night script & recognition run-through", "entertainment", 21, 7, "Finalize the awards script, winner list and rehearsal."),
      t("Pre-departure briefing & final payments", "finance", 14, 3, "Brief travelling staff, settle remaining vendor balances."),
      t("On-site arrival & welcome reception setup", "venue", 1, 0, "On-site check-in support and welcome reception build."),
      t("Post-trip reconciliation & qualifier survey", "finance", -2, -14, "Reconcile costs against budget and send the participant survey."),
    ],
  },
  {
    id: "birthday",
    name: "Birthday / Private Party",
    icon: "🎉",
    description: "Lighter celebration: venue, guests, food, cake, entertainment and decor.",
    leadLabel: "~8 week lead",
    tasks: [
      t("Set date, theme & budget", "general", 56, 49, "Pick the date, theme and budget."),
      t("Book venue or prepare home space", "venue", 49, 35, "Confirm the venue or plan the home setup."),
      t("Draft guest list & send invites", "marketing", 45, 30, "Build the guest list and send invitations."),
      t("Book entertainment (DJ / host / games)", "entertainment", 35, 21, "Confirm entertainment and activities."),
      t("Order food & drinks / caterer", "fnb", 30, 14, "Arrange catering or the food and drinks order."),
      t("Order decorations & theme props", "marketing", 21, 10, "Confirm decor and themed props."),
      t("Order cake", "fnb", 21, 7, "Order the cake."),
      t("Plan party favours & goodie bags", "marketing", 14, 5, "Assemble favours and goodie bags."),
      t("Confirm final headcount", "general", 10, 3, "Lock numbers for catering and seating."),
      t("Buy gifts & finalize schedule", "general", 7, 1, "Final shopping and lock the running order."),
    ],
  },
];

export function getEventPreset(id: string): EventPreset | undefined {
  return EVENT_PRESETS.find((p) => p.id === id);
}
