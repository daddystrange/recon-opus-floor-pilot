# Recon Opus Floor Pilot

A mobile-first collision-repair pilot organized around physical places in the shop. The animated booth doors now open into a lobby where users choose Intake, Production Floor, or The Office. Intake contains the reusable vehicle check-in workflow; the Production Floor contains only active production departments.

This first version is deliberately focused: all vehicle data is local sample data, with no backend, authentication, management dashboard, or client portal.

## Features

- Physical-location lobby with large Intake, Production Floor, and The Office wayfinding destinations
- Single-screen horseshoe Production Floor with Mechanical, Parts Hold, Body, Paint, Reassembly, Detail, Quality Control, and Delivery
- Reusable Intake workflow for VIN capture and exterior inspection
- High-contrast dark automotive UI designed for shop-floor use
- Large vehicle counts, status ribbons, readable work-stage metadata, and large touch targets
- Tap any vehicle card to open its mobile detail view
- Long-press a vehicle card for a haptic, motion-first department push workflow
- One-tap phase completion that always advances to the next production department
- Predefined revision requests stored in a session-only Manager Review Queue
- Production Exceptions queue with optional technician notes and live count
- Vehicle-level corrective-work exceptions that remain separate from normal department flow and automatically return to their originating department
- Prototype revision review with controlled destination status and resolution history
- Explicit Active Production, Revision Needed, Completed, and Archived lifecycle states
- Separate active-production, parts-hold, and revision-hold timer categories
- Close Production workflow with stopped timers and 30-day operational retention
- Searchable archived vehicle history structured for future persistence
- No technician-directed backward moves or ambiguous routing choices
- Automatic destination status and stage-time reset when a vehicle moves
- Six Paint workflow statuses: Prep, Prime, Block, Next in Booth, Ready to Buff, and Denib and Polish
- Typed local data and reusable department/vehicle components

## Run with Expo

Requirements: Node.js 22.13 or newer, npm, and the Expo Go app or a configured iOS/Android simulator.

```bash
npm install
npm start
```

Scan the QR code with Expo Go, or press `i` or `a` in the Expo terminal to open iOS or Android.

Other commands:

```bash
npm run ios
npm run android
npm run typecheck
```

## Project structure

```text
App.tsx                         App shell and session navigation state
src/components/EntranceScreen  Animated booth-door entrance
src/components/ShopLobbyScreen Physical-location destination lobby
src/components/OfficeScreen    Management-office placeholder
src/components/ProductionFloorScreen  Visual shop-floor overview
src/modules/vehicleCheckIn     Reusable Intake workflow
src/components/VehicleHistoryScreen   Completed and archived records
src/domain/vehicleLifecycle.ts        Pure lifecycle transitions and retention rules
src/components/DepartmentPage  Department queue screen
src/components/VehicleCard     Reusable production vehicle card
src/data/departments.ts        Local sample department and vehicle data
src/theme/colors.ts             Shared visual tokens
src/types/index.ts              Domain types
```

## Editing sample data

Update `src/data/departments.ts`. Production departments populate both the floor overview and their individual queues.

## Pilot scope

Phase completions, revision requests, review notes, and revision resolutions are kept in memory for the current app session. Closing or reloading the app restores the original sample data; no information is sent to a backend.
