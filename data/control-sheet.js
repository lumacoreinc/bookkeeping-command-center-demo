// Client Control Sheet — one row per client for the close period.
// This mirrors the Google Sheet the team keeps. All names and numbers are fictional.
window.CONTROL_SHEET_CSV = `client_id,client,industry,fom,accountant,tier,monthly_fee,close_due,close_status,bank_rec_through,cc_rec_through,uncategorized,ama_balance,undeposited,ar_total,ar_over_90,revenue,revenue_prior,net_income,cash,package_sent,last_touch,hubspot_health,note
C001,Bayside Auto Spa - Hingham,Car wash,Dana Whitaker,Kelly Ortiz,Premium,2400,2026-10-20,Closed,2026-09-30,2026-09-30,0,0,0,18400,900,212000,198500,31800,84200,Y,2026-10-21,Green,Daily sales via TPI import; 3 locations roll up
C002,Bayside Auto Spa - Quincy,Car wash,Dana Whitaker,Kelly Ortiz,Standard,1250,2026-10-31,Closed,2026-09-30,2026-09-30,4,0,1850,6200,0,148300,151900,19400,40100,Y,2026-10-21,Green,
C003,Harbor Light Dental,Dental,Dana Whitaker,Sam Patel,Premium,2200,2026-10-20,Closed,2026-09-30,2026-09-30,2,0,0,64800,7900,186400,179200,41200,122500,Y,2026-10-14,Green,
C004,Cranberry Coast Landscaping,Landscaping,Dana Whitaker,Sam Patel,Standard,1100,2026-10-31,In review,2026-09-30,2026-08-31,18,640,0,39200,4100,97600,121400,8900,22800,N,2026-10-09,Yellow,Seasonal slowdown starting - cash planning conversation due
C005,Scituate Harbor Brewing,Brewery,Dana Whitaker,Kelly Ortiz,Standard,1350,2026-10-31,Closed,2026-09-30,2026-09-30,0,0,3200,12600,1100,134900,128700,15600,51300,N,2026-10-02,Green,Package ready - waiting on owner review meeting
C006,Duxbury Pet Clinic,Veterinary,Dana Whitaker,Sam Patel,Essentials,750,2026-11-05,Closed,2026-09-30,2026-09-30,1,0,0,9800,600,88200,86900,12100,35600,Y,2026-10-17,Green,
C007,Marshfield Tile & Stone,Construction,Dana Whitaker,Kelly Ortiz,Premium,2500,2026-10-20,In progress,2026-09-30,2026-09-30,27,1980,0,142300,38600,265400,241800,-6200,18900,N,2026-09-24,Yellow,Job costing WIP schedule pending from PM
C008,Plymouth Rock Diner,Restaurant,Marcus Lee,Jordan Brooks,Standard,1200,2026-10-31,In progress,2026-08-31,2026-08-31,88,2350,4800,3100,0,118600,124300,4200,15200,N,2026-09-18,Red,Owner sends receipts in batches - bank feed backlog
C009,Kingston Comfort HVAC,HVAC,Marcus Lee,Jordan Brooks,Premium,2300,2026-10-20,Not started,2026-07-31,2026-08-31,142,5400,0,88400,21700,224800,262100,9800,31400,N,2026-09-12,Red,Payroll provider switched in Aug - liabilities need tie-out
C010,Hanover Family Pharmacy,Pharmacy,Marcus Lee,Alicia Nunez,Standard,1300,2026-10-31,In review,2026-09-30,2026-09-30,9,0,0,22300,2900,176400,171200,14800,63800,N,2026-10-16,Green,
C011,Pembroke Fitness Co.,Fitness,Marcus Lee,Alicia Nunez,Essentials,650,2026-11-05,Closed,2026-09-30,2026-09-30,3,0,0,0,0,52300,49800,7300,28700,Y,2026-10-20,Green,
C012,Weymouth Wash & Lube,Car wash,Marcus Lee,Jordan Brooks,Standard,1250,2026-10-31,In progress,2026-09-30,2026-08-31,38,0,6900,4100,0,96300,112800,6100,21900,N,2026-10-01,Yellow,Cash deposits short vs POS - run cash-to-sales match
C013,Abington Print House,Printing,Marcus Lee,Alicia Nunez,Essentials,700,2026-11-05,In progress,2026-09-30,2026-09-30,12,310,0,17600,6800,41800,44100,1900,9600,N,2026-10-06,Yellow,
C014,Rockland Physical Therapy,Healthcare,Marcus Lee,Jordan Brooks,Premium,2100,2026-10-20,Closed,2026-09-30,2026-09-30,6,0,0,71200,16400,158900,152300,22600,88400,N,2026-10-13,Green,Insurance AR aging creeping - flag in package
C015,Cohasset Yacht Services,Marine,Priya Raman,Ben Carter,Premium,2600,2026-10-20,Closed,2026-09-30,2026-09-30,0,0,0,58300,4200,312500,289600,48700,141900,Y,2026-10-19,Green,
C016,Norwell Organic Market,Grocery,Priya Raman,Mei Chen,Standard,1400,2026-10-31,Closed,2026-09-30,2026-09-30,5,0,2100,2800,0,203700,198100,9400,46200,Y,2026-10-22,Green,
C017,Hull Shore Rentals,Property mgmt,Priya Raman,Ben Carter,Standard,1150,2026-10-31,Closed,2026-09-30,2026-09-30,0,0,0,14900,1800,74600,92300,11800,58300,Y,2026-10-15,Green,Off-season revenue drop - expected
C018,Braintree Kids Academy,Childcare,Priya Raman,Mei Chen,Standard,1250,2026-10-31,In review,2026-09-30,2026-09-30,11,0,0,8700,1200,121300,108900,13900,37400,N,2026-10-23,Green,
C019,Milton Craft Coffee,Cafe,Priya Raman,Ben Carter,Essentials,650,2026-11-05,Closed,2026-09-30,2026-09-30,2,0,0,0,0,46900,47800,3800,12100,Y,2026-10-18,Green,
C020,Randolph Auto Body,Auto repair,Priya Raman,Mei Chen,Standard,1300,2026-10-31,In progress,2026-09-30,2026-09-30,22,880,0,46100,12900,139200,133600,12700,27800,N,2026-10-11,Yellow,Insurance receivables reclass needed
C021,Canton Chiropractic Group,Healthcare,Priya Raman,Ben Carter,Essentials,750,2026-11-05,Closed,2026-09-30,2026-09-30,0,0,0,11300,800,68400,66200,15200,44900,Y,2026-10-20,Green,
C022,Quincy Point Seafood,Restaurant,Tom Keefe,Rachel Dunn,Premium,2200,2026-10-20,In review,2026-09-30,2026-09-30,14,0,3900,6400,0,241600,268900,11200,33700,N,2026-10-08,Yellow,Food cost up 4 pts - advisory talking point
C023,Easton Electrical Contractors,Construction,Tom Keefe,Luis Romero,Premium,2400,2026-10-20,In progress,2026-09-30,2026-08-31,31,3100,0,188200,52400,302100,276400,24800,46100,N,2026-09-29,Yellow,Retainage receivable not tracked separately
C024,Stoughton Bakery,Bakery,Tom Keefe,Rachel Dunn,Essentials,650,2026-11-05,Closed,2026-09-30,2026-09-30,0,0,0,1900,0,38700,37200,4100,10800,Y,2026-10-20,Green,
C025,Avon Logistics,Trucking,Tom Keefe,Luis Romero,Standard,1350,2026-10-31,Not started,2026-08-31,2026-08-31,96,1240,0,97400,31800,184300,201700,-3900,8600,N,2026-09-08,Red,Owner unresponsive - fuel card statements missing
C026,Sharon Lake Dental Arts,Dental,Tom Keefe,Rachel Dunn,Standard,1300,2026-10-31,Closed,2026-09-30,2026-09-30,1,0,0,38900,3100,142600,139800,33700,96200,Y,2026-10-16,Green,
C027,Holbrook Home Goods,Retail,Tom Keefe,Luis Romero,Essentials,700,2026-11-05,In progress,2026-09-30,2026-09-30,19,0,1600,0,0,58900,63200,2200,14300,N,2026-10-12,Green,
C028,Brockton Metro Car Care,Car wash,Tom Keefe,Rachel Dunn,Standard,1250,2026-10-31,Closed,2026-09-30,2026-09-30,0,0,0,3600,0,109700,104100,14600,39800,N,2026-10-17,Green,Package drafted - needs FOM sign-off
`;

// To-do tab of the same sheet.
window.TODOS_CSV = `id,client_id,owner,task,due,status,assigned_by
T01,C009,Jordan Brooks,Tie out payroll liabilities after provider switch,2026-10-29,Open,Marcus Lee
T02,C009,Marcus Lee,Call owner about the Aug/Sep backlog plan,2026-10-28,Open,Erin Walsh
T03,C008,Jordan Brooks,Clear uncategorized bank transactions,2026-10-30,Open,Marcus Lee
T04,C012,Jordan Brooks,Run cash-to-sales match for September,2026-10-29,Open,Marcus Lee
T05,C025,Luis Romero,Request fuel card statements (2nd ask),2026-10-27,Open,Tom Keefe
T06,C025,Tom Keefe,Escalate: owner unresponsive since early September,2026-10-28,Open,Erin Walsh
T07,C007,Kelly Ortiz,Get WIP schedule from PM and post JE,2026-10-29,Open,Dana Whitaker
T08,C004,Sam Patel,Reconcile Amex through 9/30,2026-10-28,Open,Dana Whitaker
T09,C005,Dana Whitaker,Schedule package review meeting with owner,2026-10-31,Open,Dana Whitaker
T10,C023,Luis Romero,Set up retainage receivable account,2026-11-03,Open,Tom Keefe
T11,C022,Tom Keefe,Prep food cost talking points for advisory call,2026-11-02,Open,Tom Keefe
T12,C020,Mei Chen,Reclass insurance receivables,2026-10-30,Open,Priya Raman
T13,C014,Alicia Nunez,Add insurance AR aging page to package,2026-10-29,Open,Marcus Lee
T14,C028,Tom Keefe,Sign off on September package,2026-10-28,Open,Tom Keefe
T15,C013,Alicia Nunez,Finish September close,2026-10-24,Open,Marcus Lee
T16,C003,Sam Patel,Send Q3 review deck,2026-10-20,Done,Dana Whitaker
T17,C015,Ben Carter,Year-end planning prep list,2026-11-06,Open,Priya Raman
T18,C018,Mei Chen,Final review and send package,2026-10-30,Open,Priya Raman
`;
