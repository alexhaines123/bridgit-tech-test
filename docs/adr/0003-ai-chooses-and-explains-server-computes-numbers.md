# The AI chooses and explains; the server computes every number

The AI never produces a figure that is charted or scored. The server computes all statistics and the Planetary Stress Index from real EONET data using a fixed list of Measurements and a documented formula. The AI picks which Measurement is most interesting, names Notable Events, and writes the narrative, and its output is checked against a schema and against the real data (for example, every Notable Event ID must exist) before it is used.

A model asked to produce chart values or a "world-ending probability" will return confident, plausible numbers with no basis. Those numbers could not be explained or reproduced when asked "why 42?", and would fail the requirement to validate AI output before using it.

## Consequences

- The "prediction" is framed as an illustrative score, never a forecast, and the UI says so.
- Adding a new chart means adding a Measurement to the list, not changing a prompt.
