# Rebar Payday

## Features

- **Automated Paydays:** Players automatically receive paychecks at regular intervals, configurable in the `PaydayConfig`.
- **Missed Payday Handling:** The system calculates and pays out any missed paydays when a player logs in or when the payday event is triggered.
- **Manual Payday Trigger:** Server administrators can manually trigger a payday for a specific player using the `triggerManualPayday` function.
- **Payday History Tracking:** The system logs all payday transactions for each player, allowing you to retrieve and view their payment history using the `getPaydayHistory` function.
- **Customizable Payday Amounts:** You can set different payday amounts for employed and unemployed players, and potentially integrate with other systems to adjust pay based on jobs, skills, or other factors.
- **Integration with Currency Systems:** The plugin is designed to work with your existing currency system (using the `currency-api`).
- **Optional Notification Integration:** You can enable notifications to inform players when they receive a payday, using the `ascended-notification-api` (if installed).
- **Database Persistence:** Payday data is stored persistently in a database, ensuring that player progress is saved across server restarts.
- **Event-Driven Architecture:** The payday system is built on an event-driven architecture, allowing for flexibility and potential integration with other game events.
