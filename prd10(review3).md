TASK:
Redesign the entire application layout architecture into an Enterprise Adaptive UI System.

CURRENT PROBLEM:
The application looks good at certain browser zoom levels (80%) but breaks or becomes misaligned when browser zoom changes (100%, 110%, 125%, etc.).

GOAL:
Create a fully responsive enterprise-grade layout that remains visually consistent across:

- Browser zoom 80% → 150%
- Screen width 1366px → 3840px
- Laptop screens
- Ultrawide monitors
- Different browser scaling settings

====================================
GLOBAL LAYOUT ARCHITECTURE
====================================

Refactor all layouts using CSS Grid and Flexbox.

Main shell:

grid-template-columns:
  auto 1fr

Sidebar:
  width: clamp(240px, 16vw, 280px)

Content Area:
  width: 100%
  min-width: 0
  overflow-x: hidden

Page Container:

max-width: 100%
padding:
  clamp(12px, 1vw, 24px)

Never use:

width: 1200px
width: 1400px
left: xxx px
right: xxx px

====================================
RESPONSIVE BREAKPOINTS
====================================

xs: 0-640px
sm: 641-768px
md: 769-1024px
lg: 1025-1440px
xl: 1441-1920px
2xl: 1921+

All modules must adapt automatically.

====================================
FLUID TYPOGRAPHY
====================================

Replace all fixed typography.

Example:

font-size:
clamp(12px, 0.8vw, 14px)

Heading:

clamp(20px, 1.5vw, 32px)

Subheading:

clamp(16px, 1vw, 24px)

====================================
FLUID SPACING SYSTEM
====================================

Replace fixed spacing:

8px
12px
16px
24px
32px

With:

spacing-xs:
clamp(4px, 0.3vw, 8px)

spacing-sm:
clamp(8px, 0.5vw, 12px)

spacing-md:
clamp(12px, 0.8vw, 16px)

spacing-lg:
clamp(16px, 1vw, 24px)

spacing-xl:
clamp(24px, 1.5vw, 32px)

====================================
ORDER HISTORY PAGE
====================================

Current issue:
Timeline dates overflow horizontally.

Refactor:

Desktop:
Date selector =
horizontal scrollable flex row

Tablet:
wrap automatically

Mobile:
convert to carousel

Search bar:
always full width

Order columns:

Desktop:
2 columns

Tablet:
1 column

Mobile:
1 column

Order cards:
height auto

No fixed height

====================================
CARD SYSTEM
====================================

Every card must use:

width: 100%

min-width: 0

display: flex

flex-direction: column

Cards must never create page horizontal scroll.

====================================
TABLES
====================================

For CRM tables:

overflow-x-auto

sticky headers

responsive columns

hide secondary columns on smaller screens

====================================
ZOOM RESILIENCE
====================================

Verify layout at:

80%
90%
100%
110%
125%
150%

No overlap allowed.

No horizontal page scrolling allowed.

No clipped content allowed.

No hidden buttons allowed.

====================================
ENTERPRISE UX RULES
====================================

Inspired by:

Salesforce Lightning
Hubspot CRM
Monday.com
SAP Fiori
Odoo Enterprise

Requirements:

Fluid layout
Grid-based architecture
Adaptive cards
Adaptive typography
Container queries
No fixed pixel widths
No viewport overflow

====================================
OUTPUT
====================================

1. Audit current layout issues
2. Refactor layout architecture
3. Update all affected pages
4. Create reusable responsive design system
5. Generate report of all improvements
6. Ensure zoom-resilient enterprise UI