# Planet Watch

A student-friendly dashboard that turns NASA's live natural-event data into an interactive map, AI-chosen charts and a plain-English briefing.

## Language

**Event**:
A single natural occurrence tracked by NASA's EONET, such as one wildfire, one iceberg or one storm, with a title, a Category, one or more dated locations and sometimes a magnitude.
_Avoid_: Incident, disaster, alert

**Category**:
The type EONET assigns to an Event, such as wildfires, sea and lake ice, or severe storms.
_Avoid_: Type, kind, tag

**Window**:
The span of recent days (7, 30 or 90) whose Events the dashboard shows.
_Avoid_: Range, period, timeframe

**Region**:
A coarse part of the world (a continent or ocean) that an Event is placed in from its coordinates.
_Avoid_: Area, zone, country

**Magnitude**:
The size measure EONET reports for an Event, in a unit specific to its Category (acres, knots, square nautical miles). Magnitudes are never compared across Categories.
_Avoid_: Severity, size, intensity

**Measurement**:
A named statistic from a fixed list that can be charted, such as Events by Category or Biggest in a Category. The AI picks which one to show; the numbers always come from real data.
_Avoid_: Metric, chart type, stat

**Briefing**:
The AI-written student-friendly text for a Window: a headline, key points, Notable Events, a chart caption and the Stress Index commentary.
_Avoid_: Summary, report, digest

**Notable Event**:
An Event the Briefing singles out and explains in a sentence. It must refer to a real Event in the current data.
_Avoid_: Highlight, top event, featured event

**Planetary Stress Index**:
An illustrative 0-100 score combining ratings of a few factors (Event volume, new-Event momentum, Category severity) with a documented formula. It is not a forecast of any real-world catastrophe.
_Avoid_: Doomsday score, risk score, prediction
